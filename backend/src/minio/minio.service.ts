import {
  BadGatewayException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as Minio from 'minio';
import * as crypto from 'crypto';

export type MinioObjectInfo = {
  key: string;
  size: number;
  lastModified: string | null;
  etag?: string;
};

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private fallbackClient: Minio.Client | null = null;
  private readonly primaryEndpoint: string;
  private readonly fallbackEndpoint: string | null = null;
  private readonly timeoutMs: number;
  private readonly bucketName =
    process.env.MINIO_BUCKET_NAME || 'cctv-report-images';
  private readonly logger = new Logger(MinioService.name);
  private readonly startupCheckEnabled =
    (process.env.MINIO_STARTUP_CHECK ?? 'true') === 'true';
  private readonly autoCreateBucketEnabled =
    (process.env.MINIO_AUTO_CREATE_BUCKET ?? 'true') === 'true';
  /** ค่าเริ่มต้น false — bucket private; ตั้งเป็น true เฉพาะเมื่อยังต้องการให้ client โหลด object ตรงจาก MinIO */
  private readonly ensurePublicReadPolicyEnabled =
    (process.env.MINIO_ENSURE_PUBLIC_READ_POLICY ?? 'false') === 'true';

  constructor() {
    const primaryHost = process.env.MINIO_ENDPOINT || 'localhost';
    const primaryPort = parseInt(process.env.MINIO_PORT || '9000', 10);
    const primaryUseSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKey = process.env.MINIO_ACCESS_KEY || '';
    const secretKey = process.env.MINIO_SECRET_KEY || '';

    this.primaryEndpoint = `${primaryUseSSL ? 'https' : 'http'}://${primaryHost}:${primaryPort}`;
    this.timeoutMs = parseInt(process.env.MINIO_TIMEOUT_MS || '5000', 10);

    this.minioClient = new Minio.Client({
      endPoint: primaryHost,
      port: primaryPort,
      useSSL: primaryUseSSL,
      accessKey,
      secretKey,
    });

    // Fallback MinIO client (e.g. public URL when internal LAN IP is unreachable, or vice versa)
    const fallbackHost = process.env.MINIO_FALLBACK_ENDPOINT?.trim();
    if (fallbackHost) {
      const fallbackPort = parseInt(
        process.env.MINIO_FALLBACK_PORT || '443',
        10,
      );
      const fallbackUseSSL = process.env.MINIO_FALLBACK_USE_SSL !== 'false';
      this.fallbackEndpoint = `${fallbackUseSSL ? 'https' : 'http'}://${fallbackHost}:${fallbackPort}`;
      this.fallbackClient = new Minio.Client({
        endPoint: fallbackHost,
        port: fallbackPort,
        useSSL: fallbackUseSSL,
        accessKey,
        secretKey,
      });
      this.logger.log(
        `MinIO configured with explicit fallback: ${this.fallbackEndpoint}`,
      );
    } else {
      const publicUrl = process.env.MINIO_PUBLIC_URL?.trim();
      if (publicUrl) {
        try {
          const parsed = new URL(publicUrl);
          if (parsed.hostname && parsed.hostname !== primaryHost) {
            const fallbackPort = parsed.port
              ? parseInt(parsed.port, 10)
              : parsed.protocol === 'https:'
                ? 443
                : 80;
            const fallbackUseSSL = parsed.protocol === 'https:';
            this.fallbackEndpoint = `${parsed.protocol}//${parsed.hostname}:${fallbackPort}`;
            this.fallbackClient = new Minio.Client({
              endPoint: parsed.hostname,
              port: fallbackPort,
              useSSL: fallbackUseSSL,
              accessKey,
              secretKey,
            });
            this.logger.log(
              `MinIO auto-discovered fallback from MINIO_PUBLIC_URL: ${this.fallbackEndpoint}`,
            );
          }
        } catch {
          // ignore invalid public url
        }
      }
    }
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(timeoutMessage);
        (err as any).code = 'ETIMEDOUT';
        reject(err);
      }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timer);
    });
  }

  private isNetworkOrTimeoutError(err: any): boolean {
    if (!err) return false;
    const code = err.code || err.cause?.code;
    const msg = String(err.message || '').toLowerCase();
    return (
      code === 'ETIMEDOUT' ||
      code === 'ECONNREFUSED' ||
      code === 'EHOSTUNREACH' ||
      code === 'ENETUNREACH' ||
      code === 'ENOTFOUND' ||
      code === 'ECONNRESET' ||
      msg.includes('etimedout') ||
      msg.includes('timed out') ||
      msg.includes('econnrefused') ||
      msg.includes('network')
    );
  }

  private async executeWithFallback<T>(
    actionName: string,
    operation: (client: Minio.Client) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.withTimeout(
        operation(this.minioClient),
        this.timeoutMs,
        `MinIO ${actionName} timed out on primary (${this.primaryEndpoint})`,
      );
    } catch (primaryErr: any) {
      if (this.fallbackClient && this.isNetworkOrTimeoutError(primaryErr)) {
        this.logger.warn(
          `MinIO ${actionName} failed on primary (${this.primaryEndpoint}): ${primaryErr?.message || primaryErr}. Retrying with fallback (${this.fallbackEndpoint})...`,
        );
        try {
          return await this.withTimeout(
            operation(this.fallbackClient),
            this.timeoutMs,
            `MinIO ${actionName} timed out on fallback (${this.fallbackEndpoint})`,
          );
        } catch (fallbackErr: any) {
          this.logger.error(
            `MinIO ${actionName} failed on fallback (${this.fallbackEndpoint}): ${fallbackErr?.message || fallbackErr}`,
          );
          throw this.toStorageException(fallbackErr, actionName);
        }
      }
      throw this.toStorageException(primaryErr, actionName);
    }
  }

  private toStorageException(err: any, actionName: string): Error {
    if (this.isNetworkOrTimeoutError(err)) {
      return new BadGatewayException(
        `ระบบจัดเก็บไฟล์รูปภาพ (MinIO) ไม่สามารถเชื่อมต่อได้ในขณะนี้ (${actionName})`,
      );
    }
    return err instanceof Error ? err : new Error(String(err));
  }

  async onModuleInit() {
    if (!this.startupCheckEnabled) {
      this.logger.warn(
        'MinIO startup check disabled (MINIO_STARTUP_CHECK=false).',
      );
      return;
    }

    try {
      this.logger.log(
        `MinIO startup check: primary=${this.primaryEndpoint}, fallback=${this.fallbackEndpoint ?? 'none'}, bucket=${this.bucketName}`,
      );

      const exists = await this.executeWithFallback('bucketExists', (client) =>
        client.bucketExists(this.bucketName),
      );
      if (!exists) {
        if (!this.autoCreateBucketEnabled) {
          this.logger.warn(
            `Bucket ${this.bucketName} does not exist, but auto-create is disabled (MINIO_AUTO_CREATE_BUCKET=false).`,
          );
          return;
        }

        await this.executeWithFallback('makeBucket', (client) =>
          client.makeBucket(this.bucketName, 'us-east-1'),
        );
        this.logger.log(`Bucket ${this.bucketName} created successfully.`);
      }

      if (this.ensurePublicReadPolicyEnabled) {
        // Ensure bucket policy is set to public read (idempotent)
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Action: ['s3:GetObject'],
              Effect: 'Allow',
              Principal: '*',
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };

        try {
          await this.executeWithFallback('setBucketPolicy', (client) =>
            client.setBucketPolicy(this.bucketName, JSON.stringify(policy)),
          );
          this.logger.log(
            `Bucket ${this.bucketName} policy set to public read (ensured on startup).`,
          );
        } catch (error: any) {
          // Some MinIO deployments deny policy changes for the provided user.
          // Uploads may still work if putObject permission is granted.
          this.logger.error(
            `Bucket policy setup failed (MINIO_ENSURE_PUBLIC_READ_POLICY=true): ${error?.message ?? String(error)}`,
          );
        }
      } else {
        this.logger.log(
          'Skipping bucket public-read policy (MINIO_ENSURE_PUBLIC_READ_POLICY=false).',
        );
      }
    } catch (error: any) {
      const message = error?.message ?? String(error);
      this.logger.error(`MinIO startup check failed: ${message}`);
      this.logger.warn(
        'ตรวจสอบ MINIO_ACCESS_KEY/MINIO_SECRET_KEY ว่าถูกต้องและมีสิทธิ์อย่างน้อย: s3:ListBucket, s3:PutObject (และถ้าจะตั้ง public read ต้องมีสิทธิ์ตั้ง policy ด้วย)',
      );
    }
  }

  private getPublicBaseUrl(): string {
    const publicBase =
      process.env.MINIO_PUBLIC_URL &&
      process.env.MINIO_PUBLIC_URL.trim().length > 0
        ? process.env.MINIO_PUBLIC_URL.replace(/\/+$/, '')
        : undefined;

    if (publicBase) {
      return publicBase;
    }

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    return `${protocol}://${endpoint}:${port}`;
  }

  /**
   * แปลง URL ที่บันทึกใน DB (อาจเป็น host ภายใน/docker) ให้ใช้ MINIO_PUBLIC_URL
   * เพื่อให้แท็ก <img> ในเบราว์เซอร์โหลดรูปได้
   */
  rewriteStorageUrlForClient(url: string | null | undefined): string | null {
    if (url == null || typeof url !== 'string') {
      return null;
    }
    const trimmed = url.trim();
    if (!trimmed) {
      return null;
    }
    const publicBaseRaw = process.env.MINIO_PUBLIC_URL?.trim();
    if (!publicBaseRaw) {
      return trimmed;
    }
    const publicBase = publicBaseRaw.replace(/\/+$/, '');
    try {
      const parsed = new URL(trimmed);
      const bucketPrefix = `/${this.bucketName}/`;
      if (
        !parsed.pathname.startsWith(bucketPrefix) &&
        parsed.pathname !== `/${this.bucketName}`
      ) {
        return trimmed;
      }
      return `${publicBase}${parsed.pathname}${parsed.search}`;
    } catch {
      return trimmed;
    }
  }

  /**
   * แปลง URL ที่ออกให้ client (MINIO_PUBLIC_URL / โดเมน HTTPS) เป็น URL ที่ backend ใช้ axios โหลด object
   * ใช้เมื่อ DNS ภายในชี้โดเมนไป IP ที่ไม่มี :443 แต่ MinIO รับที่ :9000 (HTTP) เช่น http://192.168.0.71:9000
   * ตั้ง MINIO_SERVER_FETCH_BASE_URL=http://192.168.0.71:9000 คู่กับ MINIO_PUBLIC_URL=https://minio-it.forth.co.th
   */
  rewriteStorageUrlForServerFetch(url: string): string {
    const internalRaw = process.env.MINIO_SERVER_FETCH_BASE_URL?.trim();
    if (!internalRaw) {
      return url;
    }
    const internalBase = internalRaw.replace(/\/+$/, '');
    const publicRaw = process.env.MINIO_PUBLIC_URL?.trim();
    if (!publicRaw) {
      return url;
    }
    const publicBase = publicRaw.replace(/\/+$/, '');
    const trimmed = url.trim();
    if (trimmed.startsWith(publicBase)) {
      return `${internalBase}${trimmed.slice(publicBase.length)}`;
    }
    try {
      const pub = new URL(publicBase);
      const u = new URL(trimmed);
      if (u.origin === pub.origin) {
        return `${internalBase}${u.pathname}${u.search}`;
      }
    } catch {
      /* keep url */
    }
    return url;
  }

  /**
   * แปลง URL ที่บันทึกใน DB (public / internal / หลัง rewrite สำหรับ client) เป็น object key ใน bucket ปัจจุบัน
   * รูปแบบที่รองรับ: path เป็น `/{bucketName}/{objectKey}` เช่น `/cctv-app/jobs/289/fix/1.jpg`
   */
  tryParseBucketObjectKeyFromUrl(url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) {
      return null;
    }
    let pathname: string;
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return null;
    }
    const prefix = `/${this.bucketName}/`;
    if (!pathname.startsWith(prefix)) {
      return null;
    }
    const rawKey = pathname.slice(prefix.length);
    if (!rawKey) {
      return null;
    }
    let key: string;
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    } catch {
      return null;
    }
    const segments = key.split('/');
    for (const seg of segments) {
      if (seg === '' || seg === '.' || seg === '..') {
        return null;
      }
    }
    return key;
  }

  private static readonly maxJobImageBytes = 15 * 1024 * 1024;

  /**
   * อ่าน object ใน bucket ปัจจุบันด้วย credentials ของ MinIO client — ใช้เมื่อ bucket เป็น private
   */
  async getBucketObjectBuffer(objectName: string): Promise<{
    buffer: Buffer;
    contentType: string;
  }> {
    return this.executeWithFallback('getBucketObjectBuffer', async (client) => {
      const stat = await client.statObject(this.bucketName, objectName);
      if (stat.size > MinioService.maxJobImageBytes) {
        throw new Error(
          `object too large: ${stat.size} bytes (max ${MinioService.maxJobImageBytes})`,
        );
      }
      const stream = await client.getObject(this.bucketName, objectName);
      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<
        Buffer | Uint8Array | string
      >) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      const meta = stat.metaData ?? {};
      const rawCt =
        (meta['content-type'] as string | undefined) ||
        (meta['Content-Type'] as string | undefined) ||
        'application/octet-stream';
      const contentType =
        rawCt.split(';')[0]?.trim() || 'application/octet-stream';
      return { buffer, contentType };
    });
  }

  private async putObjectAndGetUrl(
    objectName: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const metaData = {
      'Content-Type': file.mimetype,
    };

    await this.executeWithFallback('putObject', (client) =>
      client.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.buffer.length,
        metaData,
      ),
    );

    const base = this.getPublicBaseUrl();
    return `${base}/${this.bucketName}/${objectName}`;
  }

  /** upload แบบเดิม: เก็บไฟล์ไว้ root ของ bucket ด้วยชื่อสุ่ม */
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'png';
    const filename = `${crypto.randomUUID()}.${ext}`;
    return this.putObjectAndGetUrl(filename, file);
  }

  /** upload ภาพผูกกับ Job: jobs/{jobId}/{kind}/{index}.{ext} */
  async uploadJobImage(
    jobId: number,
    kind: 'issue' | 'fix',
    index: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const safeKind = kind === 'fix' ? 'fix' : 'issue';
    const objectName = `jobs/${jobId}/${safeKind}/${index}${ext.startsWith('.') ? ext : `.${ext}`}`;
    return this.putObjectAndGetUrl(objectName, file);
  }

  /** upload รูปโปรไฟล์ผู้ใช้: users/{userId}/profile.{ext} */
  async uploadUserAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
    const objectName = `users/${userId}/profile${normalizedExt}`;
    return this.putObjectAndGetUrl(objectName, file);
  }

  /** upload ลายเซ็นเจ้าหน้าที่: users/{userId}/signature.{ext} */
  async uploadUserSignature(
    userId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'png';
    const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
    const objectName = `users/${userId}/signature${normalizedExt}`;
    return this.putObjectAndGetUrl(objectName, file);
  }

  /** upload ลายเซ็นผู้แจ้งตอนปิดงาน: jobs/{jobId}/reporter-signature.{ext} */
  async uploadJobReporterSignature(
    jobId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'png';
    const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
    const objectName = `jobs/${jobId}/reporter-signature${normalizedExt}`;
    return this.putObjectAndGetUrl(objectName, file);
  }

  async listObjectsRecursive(prefix = ''): Promise<MinioObjectInfo[]> {
    const normalizedPrefix = prefix.trim();
    const stream = this.minioClient.listObjectsV2(
      this.bucketName,
      normalizedPrefix || undefined,
      true,
    );
    const rows: MinioObjectInfo[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (obj: Minio.BucketItem) => {
        const key = String(obj.name || '').trim();
        if (!key) return;
        rows.push({
          key,
          size: Number(obj.size || 0),
          lastModified: obj.lastModified
            ? new Date(obj.lastModified).toISOString()
            : null,
          etag: obj.etag,
        });
      });
      stream.on('error', (err: unknown) => reject(err));
      stream.on('end', () => resolve());
    });
    return rows;
  }

  async removeObjectByKey(objectKey: string): Promise<void> {
    const key = objectKey.trim();
    if (!key) return;
    await this.executeWithFallback('removeObject', (client) =>
      client.removeObject(this.bucketName, key),
    );
  }
}

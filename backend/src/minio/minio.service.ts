import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import * as crypto from 'crypto';

@Injectable()
export class MinioService implements OnModuleInit {
    private minioClient: Minio.Client;
    private readonly bucketName = process.env.MINIO_BUCKET_NAME || 'cctv-report-images';
    private readonly logger = new Logger(MinioService.name);
    private readonly startupCheckEnabled = (process.env.MINIO_STARTUP_CHECK ?? 'true') === 'true';
    private readonly autoCreateBucketEnabled = (process.env.MINIO_AUTO_CREATE_BUCKET ?? 'true') === 'true';
    private readonly ensurePublicReadPolicyEnabled = (process.env.MINIO_ENSURE_PUBLIC_READ_POLICY ?? 'true') === 'true';

    constructor() {
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY || '',
            secretKey: process.env.MINIO_SECRET_KEY || '',
        });
    }

    async onModuleInit() {
        if (!this.startupCheckEnabled) {
            this.logger.warn('MinIO startup check disabled (MINIO_STARTUP_CHECK=false).');
            return;
        }

        try {
            const endpoint = `${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`;
            this.logger.log(`MinIO startup check: endpoint=${endpoint}, bucket=${this.bucketName}`);

            const exists = await this.minioClient.bucketExists(this.bucketName);
            if (!exists) {
                if (!this.autoCreateBucketEnabled) {
                    this.logger.warn(
                        `Bucket ${this.bucketName} does not exist, but auto-create is disabled (MINIO_AUTO_CREATE_BUCKET=false).`,
                    );
                    return;
                }

                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
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
                    await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
                    this.logger.log(`Bucket ${this.bucketName} policy set to public read (ensured on startup).`);
                } catch (error: any) {
                    // Some MinIO deployments deny policy changes for the provided user.
                    // Uploads may still work if putObject permission is granted.
                    this.logger.error(
                        `Bucket policy setup failed (MINIO_ENSURE_PUBLIC_READ_POLICY=true): ${error?.message ?? String(error)}`,
                    );
                }
            } else {
                this.logger.log('Skipping bucket public-read policy (MINIO_ENSURE_PUBLIC_READ_POLICY=false).');
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

    private async putObjectAndGetUrl(objectName: string, file: Express.Multer.File): Promise<string> {
        const metaData = {
            'Content-Type': file.mimetype,
        };

        await this.minioClient.putObject(
            this.bucketName,
            objectName,
            file.buffer,
            file.buffer.length,
            metaData,
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
    async uploadJobImage(jobId: number, kind: 'issue' | 'fix', index: number, file: Express.Multer.File): Promise<string> {
        const ext = file.originalname.split('.').pop() || 'jpg';
        const safeKind = kind === 'fix' ? 'fix' : 'issue';
        const objectName = `jobs/${jobId}/${safeKind}/${index}${ext.startsWith('.') ? ext : `.${ext}`}`;
        return this.putObjectAndGetUrl(objectName, file);
    }

    /** upload รูปโปรไฟล์ผู้ใช้: users/{userId}/profile.{ext} */
    async uploadUserAvatar(userId: number, file: Express.Multer.File): Promise<string> {
        const ext = file.originalname.split('.').pop() || 'jpg';
        const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
        const objectName = `users/${userId}/profile${normalizedExt}`;
        return this.putObjectAndGetUrl(objectName, file);
    }
}

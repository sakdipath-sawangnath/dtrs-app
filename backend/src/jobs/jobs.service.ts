import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  maskEmailForPublic,
  maskPhoneForPublic,
  maskTextForPublic,
} from '../common/utils/mask-public-text';
import { JobStatus, Prisma } from '@prisma/client';
import { SitesService } from '../sites/sites.service';
import { UsersService } from '../users/users.service';
import { MinioService } from '../minio/minio.service';
import { JobEmailNotificationService } from './job-email-notification.service';
import { RolesService } from '../roles/roles.service';
import {
  bangkokYearMonth as formatBangkokYearMonth,
  bangkokYear as formatBangkokYear,
  formatDocTicketNo,
  formatRequestTicketNo,
  formatRequestOocTicketNo,
  formatOocDocTicketNo,
  isFormalDocTicketNo,
} from './doc-ticket-no';
import axios from 'axios';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private sitesService: SitesService,
    private usersService: UsersService,
    private minioService: MinioService,
    private jobEmailNotifications: JobEmailNotificationService,
    private rolesService: RolesService,
  ) {}

  async onModuleInit() {
    await this.backfillLegacyHexTicketNumbers();
  }

  /** ปรับ URL รูปผู้ใช้ (avatar) ให้เบราว์เซอร์เข้าถึง MinIO ภายนอกได้ */
  private mapUserImage<T extends { image?: string | null } | null | undefined>(
    u: T,
  ): T {
    if (!u || typeof u !== 'object') {
      return u;
    }
    const image = this.minioService.rewriteStorageUrlForClient(
      u.image ?? undefined,
    );
    return { ...u, image } as T;
  }

  /** นับ URL รูปแก้ไขที่ไม่ว่างใน JSON ของ Job.fixImages */
  countNonemptyFixImages(fixImages: unknown): number {
    if (!Array.isArray(fixImages)) {
      return 0;
    }
    return fixImages.filter((u) => typeof u === 'string' && u.trim().length > 0)
      .length;
  }

  async getNonemptyFixImageCount(jobId: number): Promise<number> {
    const row = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { fixImages: true },
    });
    if (!row) {
      throw new NotFoundException(`ไม่พบงาน id=${jobId}`);
    }
    return this.countNonemptyFixImages(row.fixImages);
  }

  private mapJobForClient<
    T extends {
      assignedTo?: { image?: string | null } | null;
      assignedBy?: { image?: string | null } | null;
      reporter?: { image?: string | null } | null;
    },
  >(job: T): T {
    return {
      ...job,
      assignedTo: job.assignedTo
        ? this.mapUserImage(job.assignedTo)
        : job.assignedTo,
      assignedBy: job.assignedBy
        ? this.mapUserImage(job.assignedBy)
        : job.assignedBy,
      reporter: job.reporter ? this.mapUserImage(job.reporter) : job.reporter,
    };
  }

  async create(data: Prisma.JobCreateInput) {
    const province = (data.province as string)?.trim();
    const district = (data.district as string)?.trim();
    const agency = (data.agency as string)?.trim();
    const location = (data.location as string)?.trim();
    let subdistrict =
      typeof data.subdistrict === 'string' ? data.subdistrict.trim() : '';

    if (province && district && location && !agency) {
      throw new BadRequestException('กรุณาระบุสถานที่/หน่วยงาน พร้อมชื่อสถานี');
    }

    if (province && district && agency && location) {
      const site = await this.sitesService.findByLocation(
        province,
        district,
        agency,
        location,
        subdistrict || null,
        { whenSubdistrictEmpty: 'any' },
      );
      if (!site) {
        throw new BadRequestException(
          'กรุณาเลือกสถานที่จากรายการที่กำหนด (จังหวัด/อำเภอ/ตำบล/สถานที่/ชื่อสถานี ไม่ถูกต้อง)',
        );
      }
      // ฟอร์มไม่เลือกตำบล — เติมจาก Site ที่ match (เช่น ข้อมูลจาก Sites.xlsx)
      if (!subdistrict && site.subdistrict?.trim()) {
        subdistrict = site.subdistrict.trim();
      }
    }

    const createData: Prisma.JobCreateInput = { ...data };
    if (agency) {
      createData.agency = agency;
    }
    if (subdistrict) {
      createData.subdistrict = subdistrict;
    } else if ('subdistrict' in createData) {
      createData.subdistrict = null;
    }
    // แปลงค่า isOutOfContract จาก form-data (string) ให้เป็น boolean ที่แน่นอน
    const rawOut = (data as any).isOutOfContract;
    if (typeof rawOut === 'string') {
      (createData as any).isOutOfContract = rawOut === 'true' || rawOut === '1';
    }

    // requestTicketNo = RQ-CM-YYYYXXXX / RQ-OOC-YYYYXXXX ตอนสร้าง (ถาวร ห้ามเขียนทับ)
    // ticketNo = เลขเอกสารทางการ (Doc No) ออกตอนจำแนกเอกสาร (ค่าเริ่มต้น null)
    delete (createData as { ticketNo?: unknown }).ticketNo;
    delete (createData as { requestTicketNo?: unknown }).requestTicketNo;
    if (!createData.reportDate) {
      createData.reportDate = new Date();
    }

    if (!createData.reporter) {
      const phone = (createData.reporterPhone as string | undefined)?.trim();
      if (phone) {
        const u = await this.usersService.findByPhone(phone);
        if (u?.id) {
          createData.reporter = { connect: { id: u.id } };
        }
      }
    }

    const reportDate =
      createData.reportDate instanceof Date
        ? createData.reportDate
        : new Date(String(createData.reportDate));

    const isOutOfContract = Boolean((createData as any).isOutOfContract);

    const created = await this.runInTransaction(async (tx) => {
      const requestTicketNo = isOutOfContract
        ? await this.allocateRequestOocTicketNo(tx, reportDate)
        : await this.allocateRequestTicketNo(tx, reportDate);
      return tx.job.create({
        data: {
          ...createData,
          requestTicketNo,
          ticketNo: null,
        },
      });
    });
    void this.jobEmailNotifications.notifyReported(created.id);
    return created;
  }

  /**
   * แจ้งซ่อมจากหน้าสาธารณะ — สร้าง/อัปเดต User บทบาทผู้แจ้ง (USER) + เชื่อม reporter ก่อนบันทึก Job
   */
  async createFromPublicReport(
    dto: Record<string, unknown>,
    opts?: { reporterAvatar?: Express.Multer.File },
  ) {
    const reporterPosition =
      typeof dto.reporterPosition === 'string'
        ? String(dto.reporterPosition).trim()
        : '';
    const { reporterPosition: _omit, ...rest } = dto;
    const reporterUserId =
      await this.usersService.ensureReporterUserFromPublicReport({
        phone: String(rest.reporterPhone ?? '').trim(),
        name: String(rest.reporterName ?? '').trim(),
        email: String(rest.reporterEmail ?? '').trim(),
        position: reporterPosition || undefined,
        avatarFile: opts?.reporterAvatar,
      });
    return this.create({
      ...(rest as Prisma.JobCreateInput),
      reporter: { connect: { id: reporterUserId } },
    });
  }

  async findAll(options?: { includeOutOfContract?: boolean }) {
    const includeOoc = options?.includeOutOfContract !== false;
    const rows = await this.prisma.job.findMany({
      where: includeOoc ? {} : { NOT: { isOutOfContract: true } },
      include: {
        assignedTo: {
          select: { id: true, name: true, image: true },
        },
        reporter: {
          select: { id: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((j) => this.mapJobForClient(j));
  }

  /** รายการแจ้งใหม่สำหรับ notifications bell (PENDING ล่าสุด) */
  async findRecentPending(limit: number) {
    return this.prisma.job.findMany({
      where: { status: JobStatus.PENDING },
      select: {
        id: true,
        ticketNo: true,
        requestTicketNo: true,
        status: true,
        reportDate: true,
        province: true,
        district: true,
        location: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findOne(id: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, image: true },
        },
        assignedBy: {
          select: { id: true, name: true, image: true },
        },
        reporter: {
          select: { id: true, image: true },
        },
      },
    });
    return job ? this.mapJobForClient(job) : null;
  }

  /**
   * ดึงไบต์รูปจาก URL ที่บันทึกใน Job (MinIO ฯลฯ) ฝั่งเซิร์ฟเวอร์ — ใช้กับ proxy ให้เบราว์เซอร์/html2canvas ไม่ติด CORS
   */
  async getJobImageBuffer(
    jobId: number,
    kind: 'issue' | 'fix',
    index: number,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const job = await this.findOne(jobId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
    const raw = kind === 'issue' ? job.images : job.fixImages;
    const urls = Array.isArray(raw)
      ? (raw as unknown[]).filter(
          (u): u is string => typeof u === 'string' && u.length > 0,
        )
      : [];
    const url = urls[index];
    if (!url) {
      throw new NotFoundException('ไม่มีรูปในตำแหน่งนี้');
    }

    const objectKey = this.minioService.tryParseBucketObjectKeyFromUrl(url);
    if (objectKey) {
      try {
        return await this.minioService.getBucketObjectBuffer(objectKey);
      } catch (sdkErr: unknown) {
        if (!this.isMinioObjectNotFoundError(sdkErr)) {
          this.logger.warn(
            `getJobImageBuffer MinIO SDK failed job=${jobId} kind=${kind} index=${index} key=${objectKey} ${String(sdkErr)}`,
          );
        }
        // Legacy / public URL หรือ object ยังไม่อยู่ใน bucket — ลอง HTTP
      }
    }

    const fetchUrl = this.minioService.rewriteStorageUrlForServerFetch(url);
    try {
      const resp = await axios.get<ArrayBuffer>(fetchUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 15 * 1024 * 1024,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      const ct = (resp.headers['content-type'] as string) || 'image/jpeg';
      return { buffer: Buffer.from(resp.data), contentType: ct };
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? `code=${err.code ?? 'n/a'} status=${err.response?.status ?? 'n/a'}`
        : 'non-axios error';
      this.logger.warn(
        `getJobImageBuffer failed job=${jobId} kind=${kind} index=${index} ${detail}`,
      );
      throw new BadGatewayException(
        'ไม่สามารถโหลดรูปจากที่เก็บได้ — ตรวจสอบ URL ใน DB, MinIO/พร็อกซี, และว่า backend เข้าถึง object storage ได้',
      );
    }
  }

  async getReporterSignatureImageBuffer(
    jobId: number,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const row = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { reporterSignature: true },
    });
    if (!row) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
    const url = row.reporterSignature?.trim();
    if (!url) {
      throw new NotFoundException('ไม่มีลายเซ็นผู้แจ้ง');
    }

    const objectKey = this.minioService.tryParseBucketObjectKeyFromUrl(url);
    if (objectKey) {
      try {
        return await this.minioService.getBucketObjectBuffer(objectKey);
      } catch (sdkErr: unknown) {
        if (!this.isMinioObjectNotFoundError(sdkErr)) {
          this.logger.warn(
            `getReporterSignatureImageBuffer MinIO SDK failed job=${jobId} key=${objectKey} ${String(sdkErr)}`,
          );
        }
      }
    }

    const fetchUrl = this.minioService.rewriteStorageUrlForServerFetch(url);
    try {
      const resp = await axios.get<ArrayBuffer>(fetchUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 5 * 1024 * 1024,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      const ct = (resp.headers['content-type'] as string) || 'image/png';
      return { buffer: Buffer.from(resp.data), contentType: ct };
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? `code=${err.code ?? 'n/a'} status=${err.response?.status ?? 'n/a'}`
        : 'non-axios error';
      this.logger.warn(
        `getReporterSignatureImageBuffer failed job=${jobId} ${detail}`,
      );
      throw new BadGatewayException('ไม่สามารถโหลดลายเซ็นผู้แจ้งจากที่เก็บได้');
    }
  }

  private isMinioObjectNotFoundError(err: unknown): boolean {
    if (!err || typeof err !== 'object') {
      return false;
    }
    const e = err as { code?: string; name?: string; message?: string };
    return (
      e.code === 'NotFound' ||
      e.code === 'NoSuchKey' ||
      e.name === 'NotFound' ||
      (typeof e.message === 'string' &&
        /Not Found|NoSuchKey|The specified key does not exist/i.test(e.message))
    );
  }

  /**
   * ค้นหาตามเลขที่ใบแจ้งซ่อม (หน้า /status)
   * - includeSensitive=false: สาธารณะ — มาสก์ PII/สถานที่, ไม่ส่ง URL รูป (ส่ง issueImageCount แทน), รายละเอียดปัญหา/สาเหตุ/วิธีแก้ไขแสดงเต็ม (ข้อความจากช่าง ไม่ใช่ข้อมูลส่วนบุคคล)
   * - includeSensitive=true: มี JWT ที่ถูกต้อง — ข้อมูลเต็ม
   */
  async findByTicketNoForStatus(searchNo: string, includeSensitive: boolean) {
    const trimmed = (searchNo ?? '').trim();
    if (!trimmed) {
      return null;
    }

    if (includeSensitive) {
      const job = await this.prisma.job.findFirst({
        where: {
          OR: [
            { requestTicketNo: trimmed },
            { ticketNo: trimmed },
          ],
        },
        select: {
          id: true,
          ticketNo: true,
          requestTicketNo: true,
          status: true,
          reportDate: true,
          description: true,
          cause: true,
          fixMethod: true,
          province: true,
          district: true,
          location: true,
          reporterName: true,
          reporterPhone: true,
          reporterEmail: true,
          images: true,
          reporter: {
            select: {
              id: true,
              image: true,
            },
          },
        },
      });
      if (!job) {
        return null;
      }
      const mapped = this.mapJobForClient(job);
      return { ...mapped, detailLevel: 'full' as const };
    }

    const job = await this.prisma.job.findFirst({
      where: {
        OR: [
          { requestTicketNo: trimmed },
          { ticketNo: trimmed },
        ],
        NOT: { isOutOfContract: true },
      },
      select: {
        id: true,
        ticketNo: true,
        requestTicketNo: true,
        status: true,
        reportDate: true,
        description: true,
        cause: true,
        fixMethod: true,
        province: true,
        district: true,
        location: true,
        reporterName: true,
        reporterPhone: true,
        reporterEmail: true,
        images: true,
      },
    });
    if (!job) {
      return null;
    }

    const rawImages = job.images;
    const issueImageCount = Array.isArray(rawImages) ? rawImages.length : 0;

    const provinceMasked = job.province
      ? maskTextForPublic(job.province)
      : null;
    const districtMasked = job.district
      ? maskTextForPublic(job.district)
      : null;
    const locationMasked = job.location
      ? maskTextForPublic(job.location)
      : null;

    return {
      id: job.id,
      ticketNo: job.ticketNo,
      requestTicketNo: job.requestTicketNo,
      status: job.status,
      reportDate: job.reportDate,
      description: job.description,
      /** ข้อความจากช่าง — ไม่ใช่ PII เปิดเต็มเหมือน description */
      cause: job.cause,
      fixMethod: job.fixMethod,
      province: provinceMasked,
      district: districtMasked,
      location: locationMasked,
      reporterName: maskTextForPublic(job.reporterName),
      reporterPhone: maskPhoneForPublic(job.reporterPhone),
      reporterEmail: maskEmailForPublic(job.reporterEmail),
      images: [] as string[],
      issueImageCount,
      reporter: null,
      detailLevel: 'masked' as const,
    };
  }

  /**
   * รูปแบบเบอร์ที่อาจตรงกับ reporterPhone ใน DB
   * (0 นำหน้า / ไม่มี 0 / รหัสประเทศ 66 / ข้อมูลเก่าอาจมีขีดหรือช่องว่างใน cell — ใช้ contains ประกอบ)
   */
  reporterPhoneSearchVariants(raw: string): string[] | null {
    const digits = String(raw ?? '').replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 12) {
      return null;
    }
    const variants = new Set<string>();
    const add = (s: string) => {
      if (s.length >= 9 && s.length <= 12) {
        variants.add(s);
      }
    };

    add(digits);

    if (digits.length === 9) {
      add(`0${digits}`);
    } else if (digits.length === 10) {
      if (digits.startsWith('0')) {
        add(digits.slice(1));
        add(`66${digits.slice(1)}`);
      } else {
        add(`0${digits}`);
      }
    } else if (digits.length === 11 && digits.startsWith('66')) {
      const nat = digits.slice(2);
      add(nat);
      add(`0${nat}`);
    } else if (digits.length === 12 && digits.startsWith('66')) {
      const nat = digits.slice(2);
      add(nat);
      add(`0${nat}`);
    }

    const list = Array.from(variants);
    return list.length > 0 ? list : null;
  }

  /**
   * รายการงานตามเบอร์ผู้แจ้ง — สรุปอย่างเดียว เรียงแจ้งล่าสุดก่อน · ทุกสถานะ
   * @param includeJobId true เมื่อ JWT (ลิงก์ไปแดชบอร์ด)
   */
  async findByReporterPhoneForStatusList(
    rawPhone: string,
    includeJobId: boolean,
  ) {
    const variants = this.reporterPhoneSearchVariants(rawPhone);
    if (!variants?.length) {
      throw new BadRequestException('เบอร์โทรไม่ถูกต้อง (ต้อง 9–12 หลัก)');
    }
    const orClause: Prisma.JobWhereInput[] = [
      { reporterPhone: { in: variants } },
    ];
    for (const v of variants) {
      if (v.length >= 9) {
        orClause.push({ reporterPhone: { contains: v } });
      }
    }

    const userPhoneOr: Prisma.UserWhereInput[] = [{ phone: { in: variants } }];
    for (const v of variants) {
      if (v.length >= 9) {
        userPhoneOr.push({ phone: { contains: v } });
      }
    }

    const [byReporterPhone, reporterUsers] = await Promise.all([
      this.prisma.job.findMany({
        where: {
          OR: orClause,
          ...(includeJobId ? {} : { NOT: { isOutOfContract: true } }),
        },
        select: {
          id: true,
          ticketNo: true,
          requestTicketNo: true,
          status: true,
          reportDate: true,
          createdAt: true,
          description: true,
          title: true,
          cause: true,
          fixMethod: true,
        },
        take: 2000,
      }),
      this.prisma.user.findMany({
        where: { OR: userPhoneOr },
        select: { id: true },
        take: 500,
      }),
    ]);

    const byReporterId =
      reporterUsers.length > 0
        ? await this.prisma.job.findMany({
            where: {
              reporterId: { in: reporterUsers.map((u) => u.id) },
              ...(includeJobId ? {} : { NOT: { isOutOfContract: true } }),
            },
            select: {
              id: true,
              ticketNo: true,
              requestTicketNo: true,
              status: true,
              reportDate: true,
              createdAt: true,
              description: true,
              title: true,
              cause: true,
              fixMethod: true,
            },
            take: 2000,
          })
        : [];

    const merged = new Map<
      number,
      {
        id: number;
        ticketNo: string | null;
        requestTicketNo: string | null;
        status: JobStatus;
        reportDate: Date | null;
        createdAt: Date;
        description: string | null;
        title: string | null;
        cause: string | null;
        fixMethod: string | null;
      }
    >();
    for (const j of byReporterPhone) {
      merged.set(j.id, j);
    }
    for (const j of byReporterId) {
      if (!merged.has(j.id)) {
        merged.set(j.id, j);
      }
    }

    const jobs = Array.from(merged.values());
    const sorted = [...jobs].sort((a, b) => {
      const ta = a.reportDate?.getTime() ?? a.createdAt.getTime();
      const tb = b.reportDate?.getTime() ?? b.createdAt.getTime();
      return tb - ta;
    });
    return {
      items: sorted.map((j) => {
        const d = j.description?.trim();
        const t = j.title?.trim();
        const issueSummary = d || t || null;
        const base = {
          ticketNo: j.ticketNo,
          requestTicketNo: j.requestTicketNo,
          status: j.status,
          reportDate: j.reportDate ? j.reportDate.toISOString() : null,
          issueSummary,
          cause: j.cause,
          fixMethod: j.fixMethod,
        };
        return includeJobId ? { id: j.id, ...base } : base;
      }),
      detailLevel: 'summary' as const,
    };
  }

  async updateStatus(id: number, status: any, _jwtForEmailPdf?: string) {
    const prev = await this.prisma.job.findUnique({
      where: { id },
      select: { status: true, assignedToId: true },
    });
    if (!prev) {
      throw new NotFoundException(`ไม่พบงาน id=${id}`);
    }
    if (prev.status === JobStatus.CANCELLED) {
      throw new BadRequestException('ไม่สามารถเปลี่ยนสถานะงานที่ยกเลิกแล้ว');
    }
    const nextSt = String(status ?? '').toUpperCase();
    // ปิดงานต้องผ่าน PATCH /jobs/:id/close (ลายเซ็นผู้แจ้ง + ข้อมูลแก้ไขครบ)
    if (nextSt === String(JobStatus.RESOLVED)) {
      throw new BadRequestException(
        'ปิดงานกรุณาใช้ PATCH /jobs/:id/close พร้อมลายเซ็นผู้แจ้ง — ไม่รองรับการตั้ง RESOLVED ผ่านเปลี่ยนสถานะโดยตรง',
      );
    }
    const updated = await this.prisma.job.update({
      where: { id },
      data: { status },
    });
    return updated;
  }

  /**
   * Backfill วันเวลาให้เคสย้อนหลัง
   * - reportDate: วันที่แจ้ง
   * - fixDate: วันที่ปิดงาน (อนุญาตเฉพาะงานที่สถานะ RESOLVED)
   */
  async backfillDates(
    id: number,
    payload: {
      reportDate?: string;
      fixDate?: string;
    },
  ) {
    const row = await this.prisma.job.findUnique({
      where: { id },
      select: { id: true, status: true, reportDate: true, fixDate: true },
    });
    if (!row) {
      throw new NotFoundException(`ไม่พบงาน id=${id}`);
    }

    const data: Prisma.JobUpdateInput = {};
    let nextReportDate: Date | null = row.reportDate ?? null;
    let nextFixDate: Date | null = row.fixDate ?? null;

    if (payload.reportDate !== undefined && payload.reportDate.trim() !== '') {
      const parsed = this.parseBackfillDate(payload.reportDate, 'reportDate');
      data.reportDate = parsed;
      nextReportDate = parsed;
    }

    if (payload.fixDate !== undefined && payload.fixDate.trim() !== '') {
      const parsed = this.parseBackfillDate(payload.fixDate, 'fixDate');
      data.fixDate = parsed;
      nextFixDate = parsed;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'กรุณาระบุ reportDate หรือ fixDate อย่างน้อย 1 ค่า',
      );
    }

    if (nextFixDate && row.status !== JobStatus.RESOLVED) {
      throw new BadRequestException(
        'อนุญาตให้ตั้ง fixDate ได้เฉพาะงานสถานะ RESOLVED เท่านั้น',
      );
    }

    if (
      nextReportDate &&
      nextFixDate &&
      nextFixDate.getTime() < nextReportDate.getTime()
    ) {
      throw new BadRequestException('fixDate ต้องไม่น้อยกว่า reportDate');
    }

    const updated = await this.prisma.job.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: { id: true, name: true, image: true },
        },
        assignedBy: {
          select: { id: true, name: true, image: true },
        },
        reporter: {
          select: { id: true, image: true },
        },
      },
    });
    return this.mapJobForClient(updated);
  }

  async updateImages(id: number, images: string[]) {
    return this.prisma.job.update({
      where: { id },
      data: { images: images as any },
    });
  }

  /** นับรูปปัญหาที่ไม่ว่าง */
  countNonemptyIssueImages(images: unknown): number {
    if (!Array.isArray(images)) return 0;
    return images.filter((u) => typeof u === 'string' && u.trim().length > 0)
      .length;
  }

  async getNonemptyIssueImageCount(jobId: number): Promise<number> {
    const row = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { images: true },
    });
    if (!row) throw new NotFoundException(`ไม่พบงาน id=${jobId}`);
    return this.countNonemptyIssueImages(row.images);
  }

  /**
   * อัปโหลดรูปปัญหา — สิทธิ์ job.issue.upload อย่างเดียว
   * อนุญาตเฉพาะงาน PENDING / IN_PROGRESS
   */
  async assertUserCanUploadIssueImages(
    jobId: number,
    userId: number,
  ): Promise<void> {
    const codes = await this.getPermissionCodesForUser(userId);
    if (!codes.includes('job.issue.upload')) {
      throw new ForbiddenException('ไม่มีสิทธิ์อัปโหลดรูปปัญหา');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true },
    });
    if (!job) {
      throw new NotFoundException(`ไม่พบงาน id=${jobId}`);
    }
    if (
      job.status !== JobStatus.PENDING &&
      job.status !== JobStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'อัปโหลดรูปปัญหาได้เฉพาะงานรอดำเนินการหรือกำลังแก้ไข',
      );
    }
  }

  /** เติมรูปปัญหาต่อท้าย (สูงสุด 3) — ไม่แทนที่รูปเดิม */
  async setIssueImages(id: number, imageUrls: string[]) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: { id: true, images: true },
    });
    if (!job) throw new NotFoundException(`ไม่พบงาน id=${id}`);
    const existing = Array.isArray(job.images)
      ? (job.images as unknown[]).filter(
          (u): u is string => typeof u === 'string' && u.trim().length > 0,
        )
      : [];
    const merged = [...existing, ...imageUrls].slice(0, 3);
    const updated = await this.prisma.job.update({
      where: { id },
      data: { images: merged as any },
      include: {
        assignedTo: { select: { id: true, name: true, image: true } },
        assignedBy: { select: { id: true, name: true, image: true } },
        reporter: { select: { id: true, image: true } },
      },
    });
    return this.mapJobForClient(updated);
  }

  /** สิทธิ์ผู้ใช้ — ใช้ชุดเดียวกับ GET /roles/me/permissions และ PermissionsGuard */
  private async getPermissionCodesForUser(userId: number): Promise<string[]> {
    return this.rolesService.getPermissionsForUser(userId);
  }

  /**
   * ตรวจสิทธิ์การบันทึก/ปิดงาน (fix)
   * - job.fix.any: ทำได้ทุกงาน
   * - job.fix.self: ทำได้เฉพาะงานที่เป็นผู้รับงาน (assignedToId)
   */
  async assertUserCanFix(jobId: number, userId: number): Promise<void> {
    const codes = await this.getPermissionCodesForUser(userId);
    if (codes.includes('job.fix.any')) return;
    if (!codes.includes('job.fix.self')) {
      throw new ForbiddenException('ไม่มีสิทธิ์บันทึก/ปิดงาน');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, assignedToId: true },
    });
    if (!job) {
      throw new NotFoundException(`ไม่พบงาน id=${jobId}`);
    }
    if (job.assignedToId == null) {
      throw new BadRequestException('ยังไม่มีผู้รับผิดชอบงาน');
    }
    const assigneeId = Number(job.assignedToId);
    const uid = Number(userId);
    if (assigneeId !== uid) {
      throw new ForbiddenException(
        'ไม่มีสิทธิ์บันทึก/ปิดงานนี้ (อนุญาตเฉพาะผู้รับงาน หรือบทบาทที่ได้รับสิทธิ์)',
      );
    }
  }

  /**
   * Reopen: RESOLVED → IN_PROGRESS พร้อมบันทึกเหตุผลต่อท้าย fixNote
   * - job.reopen.any: ทำได้ทุกงาน
   * - job.reopen.self: ทำได้เฉพาะงานที่เป็นผู้รับงาน (assignedToId)
   */
  async assertUserCanReopen(jobId: number, userId: number): Promise<void> {
    const codes = await this.getPermissionCodesForUser(userId);
    if (codes.includes('job.reopen.any')) return;
    if (!codes.includes('job.reopen.self')) {
      throw new ForbiddenException('ไม่มีสิทธิ์ Reopen งาน');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, assignedToId: true },
    });
    if (!job) throw new NotFoundException(`ไม่พบงาน id=${jobId}`);
    if (job.assignedToId == null) {
      throw new BadRequestException('ยังไม่มีผู้รับผิดชอบงาน');
    }
    if (Number(job.assignedToId) !== Number(userId)) {
      throw new ForbiddenException('ไม่มีสิทธิ์ Reopen งานนี้');
    }
  }

  async reopenJobByAssignee(jobId: number, userId: number, reason: string) {
    await this.usersService.assertHasStaffSignature(userId);
    await this.assertUserCanReopen(jobId, userId);
    const row = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, fixNote: true },
    });
    if (!row) {
      throw new NotFoundException(`ไม่พบงาน id=${jobId}`);
    }
    if (row.status !== JobStatus.RESOLVED) {
      throw new BadRequestException(
        'Reopen ได้เฉพาะเมื่องานสถานะเสร็จสิ้นเท่านั้น',
      );
    }
    const stamp = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });
    const line = `[Reopen ${stamp}] ${reason.trim()}`;
    const newNote = row.fixNote ? `${row.fixNote}\n${line}` : line;

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.IN_PROGRESS,
        fixNote: newNote,
        fixDate: null,
        reporterSignature: null,
        reporterSignedAt: null,
      },
    });

    const full = await this.findOne(jobId);
    if (!full) {
      throw new NotFoundException(`ไม่พบงาน id=${jobId}`);
    }
    return full;
  }

  /** ตรวจว่างาน IN_PROGRESS มีข้อมูลแก้ไขครบพร้อมปิดงาน */
  async assertJobFixReadyToClose(jobId: number): Promise<void> {
    const row = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        status: true,
        assignedToId: true,
        fixEnvironment: true,
        brokenPart: true,
        cause: true,
        fixMethod: true,
        fixImages: true,
      },
    });
    if (!row) {
      throw new NotFoundException(`ไม่พบงาน id=${jobId}`);
    }
    this.assertJobAllowsFixMutation(row, 'ปิดงาน');
    if (row.fixEnvironment !== 'INDOOR' && row.fixEnvironment !== 'OUTDOOR') {
      throw new BadRequestException(
        'ปิดงานไม่ได้: กรุณาบันทึกประเภทสถานที่ (Indoor / Outdoor) ก่อน',
      );
    }
    if (row.brokenPart !== 'Hardware' && row.brokenPart !== 'Software') {
      throw new BadRequestException(
        'ปิดงานไม่ได้: กรุณาบันทึกประเภทงาน (Hardware / Software) ก่อน',
      );
    }
    if (!row.cause?.trim()) {
      throw new BadRequestException('ปิดงานไม่ได้: กรุณาบันทึกสาเหตุก่อน');
    }
    if (!row.fixMethod?.trim()) {
      throw new BadRequestException('ปิดงานไม่ได้: กรุณาบันทึกวิธีแก้ไขก่อน');
    }
    if (this.countNonemptyFixImages(row.fixImages) < 2) {
      throw new BadRequestException(
        'ปิดงานไม่ได้: กรุณาแนบรูปการแก้ไขอย่างน้อย 2 รูปก่อน',
      );
    }
  }

  private assertJobAllowsFixMutation(
    row: { status: JobStatus; assignedToId: number | null },
    actionLabel: string,
  ): void {
    if (row.status === JobStatus.RESOLVED) {
      throw new BadRequestException(
        'งานปิดแล้ว หากต้องการแก้ไขโปรด Reopen เพื่อเปลี่ยนสถานะเป็นกำลังแก้ไขก่อน',
      );
    }
    if (row.assignedToId == null) {
      throw new BadRequestException(
        `${actionLabel}ไม่ได้: ต้องมีผู้รับผิดชอบงานก่อน`,
      );
    }
    if (row.status === JobStatus.PENDING) {
      throw new BadRequestException(
        `${actionLabel}ไม่ได้: งานสถานะรอดำเนินการ (PENDING) ต้องมอบหมายและเปลี่ยนเป็นกำลังแก้ไขก่อน`,
      );
    }
    if (row.status !== JobStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `${actionLabel}ได้เฉพาะงานสถานะกำลังแก้ไข (IN_PROGRESS) เท่านั้น`,
      );
    }
  }

  /** บันทึกข้อมูลการแก้ไข — คงสถานะ IN_PROGRESS (ไม่รับลายเซ็นผู้แจ้ง) */
  async saveFixInfo(
    id: number,
    payload: {
      brokenPartType?: string | null;
      fixEnvironment?: string | null;
      cause?: string | null;
      fixMethod?: string | null;
      note?: string | null;
      oldSerialNumber?: string | null;
      newSerialNumber?: string | null;
      fixImagesUrls?: string[];
      actorUserId?: number;
    },
  ) {
    if (payload.actorUserId != null) {
      await this.usersService.assertHasStaffSignature(payload.actorUserId);
    }
    const current = await this.prisma.job.findUnique({
      where: { id },
      select: { status: true, assignedToId: true },
    });
    if (!current) {
      throw new NotFoundException(`ไม่พบงาน id=${id}`);
    }
    this.assertJobAllowsFixMutation(current, 'บันทึกการแก้ไข');

    const data: Prisma.JobUpdateInput = {};

    if (payload.brokenPartType !== undefined) {
      data.brokenPart = payload.brokenPartType;
    }
    if (payload.fixEnvironment !== undefined) {
      data.fixEnvironment = payload.fixEnvironment;
    }
    if (payload.cause !== undefined) {
      data.cause = payload.cause;
    }
    if (payload.fixMethod !== undefined) {
      data.fixMethod = payload.fixMethod;
    }
    if (payload.note !== undefined) {
      data.fixNote = payload.note;
    }
    if (payload.oldSerialNumber !== undefined) {
      data.oldSerialNumber = payload.oldSerialNumber;
    }
    if (payload.newSerialNumber !== undefined) {
      data.newSerialNumber = payload.newSerialNumber;
    }
    if (payload.fixImagesUrls && payload.fixImagesUrls.length > 0) {
      data.fixImages = payload.fixImagesUrls;
    }

    await this.prisma.job.update({
      where: { id },
      data,
    });
    const full = await this.findOne(id);
    if (!full) {
      throw new NotFoundException(`ไม่พบงาน id=${id}`);
    }
    return full;
  }

  /** ปิดงาน — ต้องมีข้อมูลแก้ไขครบแล้ว + ลายเซ็นผู้แจ้ง */
  async closeJob(
    id: number,
    reporterSignatureUrl: string,
    actorUserId: number,
    jwtForEmailPdf?: string,
  ) {
    await this.usersService.assertHasStaffSignature(actorUserId);
    await this.assertJobFixReadyToClose(id);
    if (!reporterSignatureUrl?.trim()) {
      throw new BadRequestException('กรุณาเซ็นลายเซ็นผู้แจ้งก่อนปิดงาน');
    }

    const closed = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.RESOLVED,
        fixDate: new Date(),
        reporterSignature: reporterSignatureUrl.trim(),
        reporterSignedAt: new Date(),
      },
    });
    void this.jobEmailNotifications.notifyClosed(closed.id, jwtForEmailPdf);
    const full = await this.findOne(id);
    if (!full) {
      throw new NotFoundException(`ไม่พบงาน id=${id}`);
    }
    return full;
  }

  async assignStaff(id: number, staffId: number, assignedByUserId: number) {
    await this.usersService.assertHasStaffSignature(assignedByUserId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const before = await tx.job.findUnique({
        where: { id },
        select: {
          assignedToId: true,
          status: true,
        },
      });
      if (!before) {
        throw new NotFoundException(`ไม่พบงาน id=${id}`);
      }
      if (before.assignedToId != null) {
        throw new BadRequestException(
          'งานนี้มีผู้รับผิดชอบแล้ว — มอบหมายใหม่ได้เฉพาะงานที่ยังไม่มีผู้รับผิดชอบ',
        );
      }

      const isOrphanInProgress = before.status === JobStatus.IN_PROGRESS;
      const isOrphanResolved = before.status === JobStatus.RESOLVED;
      const isPending = before.status === JobStatus.PENDING;

      if (!isPending && !isOrphanInProgress && !isOrphanResolved) {
        throw new BadRequestException(
          'มอบหมายงานได้เฉพาะงานสถานะรอดำเนินการ (PENDING) หรืองานกำลังแก้ไข/เสร็จสิ้นที่ยังไม่มีผู้รับผิดชอบ',
        );
      }

      const data: {
        assignedToId: number;
        assignedById: number;
        status?: typeof JobStatus.IN_PROGRESS;
        fixDate?: null;
      } = {
        assignedToId: staffId,
        assignedById: assignedByUserId,
      };
      if (isPending || isOrphanInProgress || isOrphanResolved) {
        data.status = JobStatus.IN_PROGRESS;
      }
      if (isOrphanResolved) {
        data.fixDate = null;
      }

      return tx.job.update({
        where: { id },
        data,
      });
    });

    void this.jobEmailNotifications.notifyAssigned(updated.id);
    return updated;
  }

  async bulkAssignStaff(
    jobIds: number[],
    staffId: number,
    assignedByUserId: number,
  ) {
    const uniqueIds = [...new Set(jobIds)];
    const jobs: Awaited<ReturnType<typeof this.assignStaff>>[] = [];
    const updatedIds: number[] = [];
    const failed: { id: number; message: string }[] = [];

    for (const id of uniqueIds) {
      try {
        const updated = await this.assignStaff(id, staffId, assignedByUserId);
        jobs.push(updated);
        updatedIds.push(id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'มอบหมายไม่สำเร็จ';
        failed.push({ id, message });
      }
    }

    return {
      updated: updatedIds.length,
      updatedIds,
      failed,
      jobs,
    };
  }

  /** ยกเลิกงานคิว — เฉพาะ PENDING */
  async cancelPendingJob(id: number, reason?: string) {
    const row = await this.prisma.job.findUnique({
      where: { id },
      select: { id: true, status: true, fixNote: true },
    });
    if (!row) {
      throw new NotFoundException(`ไม่พบงาน id=${id}`);
    }
    if (row.status !== JobStatus.PENDING) {
      throw new BadRequestException(
        'ยกเลิกได้เฉพาะงานสถานะรอดำเนินการ (PENDING) เท่านั้น',
      );
    }
    const stamp = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });
    const trimmed = reason?.trim();
    const line = trimmed ? `[ยกเลิก ${stamp}] ${trimmed}` : `[ยกเลิก ${stamp}]`;
    const newNote = row.fixNote ? `${row.fixNote}\n${line}` : line;

    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.CANCELLED,
        fixNote: newNote,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, image: true },
        },
        assignedBy: {
          select: { id: true, name: true, image: true },
        },
        reporter: {
          select: { id: true, image: true },
        },
      },
    });
    return this.mapJobForClient(updated);
  }

  /**
   * ย้ายงานไปนอกสัญญา แต่คงสถานะเป็น PENDING (ตาม requirement)
   */
  async moveToOutOfContract(
    id: number,
    isOutOfContract: boolean,
    actorUserId: number,
  ) {
    await this.usersService.assertHasStaffSignature(actorUserId);
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id } });
      if (!job) throw new NotFoundException(`ไม่พบ Job id=${id}`);

      if (job.status !== JobStatus.PENDING && isOutOfContract === true) {
        throw new BadRequestException(
          'อนุญาตให้ย้ายนอกสัญญาได้เฉพาะงานสถานะ PENDING เท่านั้น',
        );
      }

      return tx.job.update({
        where: { id },
        data: { isOutOfContract },
      });
    });
  }

  /**
   * ตรวจสิทธิ์จำแนกในสัญญา / นอกสัญญา (ปุ่มใน dialog)
   * ประตู job.classifyDoc ตรวจที่ PermissionsGuard แล้ว
   */
  async assertUserCanClassifyDocKind(
    userId: number,
    isOutOfContract: boolean,
  ): Promise<void> {
    const codes = await this.getPermissionCodesForUser(userId);
    const needed = isOutOfContract
      ? 'job.classifyDoc.outOfContract'
      : 'job.classifyDoc.contract';
    if (!codes.includes(needed)) {
      throw new ForbiddenException(
        'คุณไม่มีสิทธิ์จำแนกประเภทเอกสาร กรุณาติดต่อผู้ดูแลระบบ / ผู้ที่เกี่ยวข้อง',
      );
    }
  }

  /**
   * จำแนกเอกสาร: กำหนดเลขเอกสารทางการ (Doc No) ใน ticketNo (ครั้งเดียว)
   * โดย requestTicketNo จะยังคงเดิมไม่ถูกแตะต้อง
   */
  async classifyDoc(id: number, isOutOfContract: boolean, actorUserId: number) {
    await this.assertUserCanClassifyDocKind(actorUserId, isOutOfContract);
    await this.usersService.assertHasStaffSignature(actorUserId);
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id },
        select: { id: true, status: true, ticketNo: true, requestTicketNo: true },
      });
      if (!job) throw new NotFoundException(`ไม่พบ Job id=${id}`);
      if (job.status === JobStatus.CANCELLED) {
        throw new BadRequestException('ไม่สามารถจำแนกเอกสารงานที่ถูกยกเลิกได้');
      }
      if (job.ticketNo && isFormalDocTicketNo(job.ticketNo)) {
        throw new ConflictException('งานนี้จำแนกเอกสารแล้ว');
      }

      const ticketNo = await this.allocateTicketNo(tx, isOutOfContract);
      return tx.job.update({
        where: { id },
        data: { ticketNo, isOutOfContract },
      });
    });
  }

  /** ลบงานที่ยังไม่มีผู้รับผิดชอบ (assignedToId = null) และสถานะต้องเป็น PENDING เท่านั้น */
  async deleteUnassignedJob(id: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: { id: true, status: true, assignedToId: true },
    });

    if (!job) throw new NotFoundException(`ไม่พบ Job id=${id}`);

    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException(
        'อนุญาตให้ลบได้เฉพาะงานสถานะ PENDING เท่านั้น',
      );
    }

    if (job.assignedToId != null) {
      throw new BadRequestException(
        'อนุญาตให้ลบได้เฉพาะงานที่ยังไม่มีผู้รับผิดชอบ',
      );
    }

    await this.prisma.job.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * ADMIN เท่านั้น (ตรวจที่ controller): ลบงานสถานะกำลังแก้ไข
   * คืน true ถ้าลบแล้ว, false ถ้าไม่ใช่ IN_PROGRESS (ให้ fallback ไปลบแบบยังไม่มอบหมาย)
   */
  async tryDeleteInProgressJobByAdmin(id: number): Promise<boolean> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!job) throw new NotFoundException(`ไม่พบ Job id=${id}`);
    // เทียบแบบ string รองรับทั้ง Prisma enum และค่าจาก DB
    const st = String(job.status ?? '').toUpperCase();
    if (st !== String(JobStatus.IN_PROGRESS)) return false;
    await this.prisma.job.delete({ where: { id } });
    return true;
  }

  /** YYYY ตาม Asia/Bangkok */
  private bangkokYear(now: Date = new Date()): string {
    return formatBangkokYear(now);
  }

  /** YYYYMM ตาม Asia/Bangkok */
  private bangkokYearMonth(now: Date = new Date()): string {
    return formatBangkokYearMonth(now);
  }

  private async runInTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (typeof this.prisma.$transaction === 'function') {
      const res = await this.prisma.$transaction(fn);
      if (res !== undefined) return res;
    }
    return fn(this.prisma as unknown as Prisma.TransactionClient);
  }

  /** ออกเลขที่ใบแจ้งซ่อมเริ่มต้น RQ-CM-YYYYXXXX พร้อม retry เมื่อชนเลขที่มีอยู่แล้ว */
  private async allocateRequestTicketNo(
    tx: Prisma.TransactionClient | PrismaService,
    date: Date = new Date(),
    maxAttempts = 5,
  ): Promise<string> {
    const year = this.bangkokYear(date);
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.nextRequestTicketNo(tx, year);
      } catch (err) {
        lastErr = err;
        if (
          !(err instanceof ConflictException) ||
          attempt === maxAttempts - 1
        ) {
          throw err;
        }
      }
    }
    throw lastErr;
  }

  /**
   * ออกเลขที่ใบแจ้งซ่อมเริ่มต้น (Reference No.) ใน transaction:
   * รูปแบบ RQ-CM-YYYYXXXX (RQ-CM = fixed prefix, YYYY = ปี 4 หลัก Asia/Bangkok, XXXX = running 4 หลัก)
   * แถว DocSequence ล็อกด้วย SELECT … FOR UPDATE
   */
  private async nextRequestTicketNo(
    tx: Prisma.TransactionClient | PrismaService,
    year: string,
  ): Promise<string> {
    const kind = 'RQ_CM';
    const period = year;

    let next = 1;

    if (typeof (tx as any).$executeRaw === 'function') {
      await (tx as any).$executeRaw`
        INSERT INTO \`DocSequence\` (\`kind\`, \`period\`, \`lastValue\`, \`updatedAt\`)
        VALUES (${kind}, ${period}, 0, NOW(3))
        ON DUPLICATE KEY UPDATE \`id\` = \`id\`
      `;

      const locked = await (tx as any).$queryRaw<
        Array<{ lastValue: number | bigint }>
      >`
        SELECT \`lastValue\` FROM \`DocSequence\`
        WHERE \`kind\` = ${kind} AND \`period\` = ${period}
        FOR UPDATE
      `;
      let current = Number(locked[0]?.lastValue ?? 0);
      if (current === 0 && typeof (tx as any).job?.findFirst === 'function') {
        const existing = await (tx as any).job.findFirst({
          where: {
            OR: [
              { requestTicketNo: { startsWith: `RQ-CM-${year}` } },
              { ticketNo: { startsWith: `RQ-CM-${year}` } },
            ],
          },
          orderBy: [{ requestTicketNo: 'desc' }, { ticketNo: 'desc' }],
          select: { requestTicketNo: true, ticketNo: true },
        });
        const matched = existing?.requestTicketNo || existing?.ticketNo;
        if (matched) {
          const numPart = matched.slice(`RQ-CM-${year}`.length);
          const parsed = parseInt(numPart, 10);
          if (!isNaN(parsed) && parsed > current) {
            current = parsed;
          }
        }
      }
      next = current + 1;

      await (tx as any).$executeRaw`
        UPDATE \`DocSequence\`
        SET \`lastValue\` = ${next}, \`updatedAt\` = NOW(3)
        WHERE \`kind\` = ${kind} AND \`period\` = ${period}
      `;
    } else if (typeof (tx as any).job?.findFirst === 'function') {
      const existing = await (tx as any).job.findFirst({
        where: {
          OR: [
            { requestTicketNo: { startsWith: `RQ-CM-${year}` } },
            { ticketNo: { startsWith: `RQ-CM-${year}` } },
          ],
        },
        orderBy: [{ requestTicketNo: 'desc' }, { ticketNo: 'desc' }],
        select: { requestTicketNo: true, ticketNo: true },
      });
      const matched = existing?.requestTicketNo || existing?.ticketNo;
      if (matched) {
        const numPart = matched.slice(`RQ-CM-${year}`.length);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed >= 1) {
          next = parsed + 1;
        }
      }
    }

    const ticketNo = formatRequestTicketNo({ year, running: next });

    if (typeof (tx as any).job?.findFirst === 'function') {
      const clash = await (tx as any).job.findFirst({
        where: {
          OR: [
            { requestTicketNo: ticketNo },
            { ticketNo },
          ],
        },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException(
          `เลขที่ใบแจ้งซ่อมซ้ำ (${ticketNo}) — ลองใหม่อีกครั้ง`,
        );
      }
    }
    return ticketNo;
  }

  /** ออกเลขที่ใบแจ้งซ่อมนอกสัญญาเริ่มต้น RQ-OOC-YYYYXXXX พร้อม retry เมื่อชนเลขที่มีอยู่แล้ว */
  private async allocateRequestOocTicketNo(
    tx: Prisma.TransactionClient | PrismaService,
    date: Date = new Date(),
    maxAttempts = 5,
  ): Promise<string> {
    const year = this.bangkokYear(date);
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.nextRequestOocTicketNo(tx, year);
      } catch (err) {
        lastErr = err;
        if (
          !(err instanceof ConflictException) ||
          attempt === maxAttempts - 1
        ) {
          throw err;
        }
      }
    }
    throw lastErr;
  }

  /**
   * ออกเลขที่ใบแจ้งซ่อมนอกสัญญาเริ่มต้น (Reference No.) ใน transaction:
   * รูปแบบ RQ-OOC-YYYYXXXX (RQ-OOC = fixed prefix, YYYY = ปี 4 หลัก Asia/Bangkok, XXXX = running 4 หลัก)
   * แถว DocSequence ล็อกด้วย SELECT … FOR UPDATE
   */
  private async nextRequestOocTicketNo(
    tx: Prisma.TransactionClient | PrismaService,
    year: string,
  ): Promise<string> {
    const kind = 'RQ_OOC';
    const period = year;

    let next = 1;

    if (typeof (tx as any).$executeRaw === 'function') {
      await (tx as any).$executeRaw`
        INSERT INTO \`DocSequence\` (\`kind\`, \`period\`, \`lastValue\`, \`updatedAt\`)
        VALUES (${kind}, ${period}, 0, NOW(3))
        ON DUPLICATE KEY UPDATE \`id\` = \`id\`
      `;

      const locked = await (tx as any).$queryRaw<
        Array<{ lastValue: number | bigint }>
      >`
        SELECT \`lastValue\` FROM \`DocSequence\`
        WHERE \`kind\` = ${kind} AND \`period\` = ${period}
        FOR UPDATE
      `;
      let current = Number(locked[0]?.lastValue ?? 0);
      if (current === 0 && typeof (tx as any).job?.findFirst === 'function') {
        const existing = await (tx as any).job.findFirst({
          where: {
            OR: [
              { requestTicketNo: { startsWith: `RQ-OOC-${year}` } },
              { ticketNo: { startsWith: `RQ-OOC-${year}` } },
            ],
          },
          orderBy: [{ requestTicketNo: 'desc' }, { ticketNo: 'desc' }],
          select: { requestTicketNo: true, ticketNo: true },
        });
        const matched = existing?.requestTicketNo || existing?.ticketNo;
        if (matched) {
          const numPart = matched.slice(`RQ-OOC-${year}`.length);
          const parsed = parseInt(numPart, 10);
          if (!isNaN(parsed) && parsed > current) {
            current = parsed;
          }
        }
      }
      next = current + 1;

      await (tx as any).$executeRaw`
        UPDATE \`DocSequence\`
        SET \`lastValue\` = ${next}, \`updatedAt\` = NOW(3)
        WHERE \`kind\` = ${kind} AND \`period\` = ${period}
      `;
    } else if (typeof (tx as any).job?.findFirst === 'function') {
      const existing = await (tx as any).job.findFirst({
        where: {
          OR: [
            { requestTicketNo: { startsWith: `RQ-OOC-${year}` } },
            { ticketNo: { startsWith: `RQ-OOC-${year}` } },
          ],
        },
        orderBy: [{ requestTicketNo: 'desc' }, { ticketNo: 'desc' }],
        select: { requestTicketNo: true, ticketNo: true },
      });
      const matched = existing?.requestTicketNo || existing?.ticketNo;
      if (matched) {
        const numPart = matched.slice(`RQ-OOC-${year}`.length);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed >= 1) {
          next = parsed + 1;
        }
      }
    }

    const ticketNo = formatRequestOocTicketNo({ year, running: next });

    if (typeof (tx as any).job?.findFirst === 'function') {
      const clash = await (tx as any).job.findFirst({
        where: {
          OR: [
            { requestTicketNo: ticketNo },
            { ticketNo },
          ],
        },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException(
          `เลขที่ใบแจ้งซ่อมซ้ำ (${ticketNo}) — ลองใหม่อีกครั้ง`,
        );
      }
    }
    return ticketNo;
  }

  /**
   * ตรวจสอบและแปลงเลขที่ใบแจ้งซ่อมแบบ hex 8 ตัวเดิม (เช่น 9530f95f)
   * ให้เป็นรูปแบบทางการ RQ-CM-YYYYXXXX เรียงตามวันที่แจ้ง/สร้าง
   */
  async backfillLegacyHexTicketNumbers(): Promise<number> {
    try {
      if (!this.prisma.job || typeof this.prisma.job.findMany !== 'function') {
        return 0;
      }
      const candidates = await this.prisma.job.findMany({
        where: {
          ticketNo: {
            not: null,
          },
        },
        select: {
          id: true,
          ticketNo: true,
          reportDate: true,
          createdAt: true,
        },
        orderBy: [{ reportDate: 'asc' }, { id: 'asc' }],
      });

      const hexJobs = candidates.filter(
        (j) => j.ticketNo && /^[0-9a-f]{8}$/i.test(j.ticketNo.trim()),
      );

      if (hexJobs.length === 0) {
        return 0;
      }

      this.logger.log(
        `Found ${hexJobs.length} legacy hex ticket(s) to backfill to RQ-CM-YYYYXXXX`,
      );

      let count = 0;
      for (const job of hexJobs) {
        const date = job.reportDate || job.createdAt || new Date();
        await this.runInTransaction(async (tx) => {
          const newTicketNo = await this.allocateRequestTicketNo(tx, date);
          await tx.job.update({
            where: { id: job.id },
            data: { requestTicketNo: newTicketNo, ticketNo: null },
          });
          this.logger.log(
            `Migrated Job #${job.id}: ${job.ticketNo} -> requestTicketNo ${newTicketNo}`,
          );
        });
        count++;
      }
      return count;
    } catch (err) {
      this.logger.warn(
        `backfillLegacyHexTicketNumbers skipped: ${(err as Error)?.message}`,
      );
      return 0;
    }
  }

  /** ออกเลข Doc No พร้อม retry เมื่อชนเลขที่มีอยู่แล้ว */
  private async allocateTicketNo(
    tx: Prisma.TransactionClient,
    isOutOfContract: boolean,
    maxAttempts = 5,
  ): Promise<string> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.nextTicketNo(tx, isOutOfContract);
      } catch (err) {
        lastErr = err;
        if (
          !(err instanceof ConflictException) ||
          attempt === maxAttempts - 1
        ) {
          throw err;
        }
      }
    }
    throw lastErr;
  }

  /**
   * ออกเลข Doc No ใน transaction (แถว DocSequence ล็อกด้วย SELECT … FOR UPDATE)
   * ในสัญญา: CM-SHF-YYYY-XXXX (YYYY Asia/Bangkok ณ วันจำแนก; running ไม่รีเซ็ต — DocSequence period='')
   * นอกสัญญา: OOC-YYYY-XXXX (รีเซ็ตรายปี Asia/Bangkok; DocSequence kind='OOC_DOC', period=YYYY)
   */
  private async nextTicketNo(
    tx: Prisma.TransactionClient,
    isOutOfContract: boolean,
  ): Promise<string> {
    const kind = isOutOfContract ? 'OOC_DOC' : 'IN_CONTRACT';
    const period = isOutOfContract ? this.bangkokYear() : '';

    await tx.$executeRaw`
      INSERT INTO \`DocSequence\` (\`kind\`, \`period\`, \`lastValue\`, \`updatedAt\`)
      VALUES (${kind}, ${period}, 0, NOW(3))
      ON DUPLICATE KEY UPDATE \`id\` = \`id\`
    `;

    const locked = await tx.$queryRaw<Array<{ lastValue: number | bigint }>>`
      SELECT \`lastValue\` FROM \`DocSequence\`
      WHERE \`kind\` = ${kind} AND \`period\` = ${period}
      FOR UPDATE
    `;
    const current = Number(locked[0]?.lastValue ?? 0);
    const next = current + 1;

    await tx.$executeRaw`
      UPDATE \`DocSequence\`
      SET \`lastValue\` = ${next}, \`updatedAt\` = NOW(3)
      WHERE \`kind\` = ${kind} AND \`period\` = ${period}
    `;

    const ticketNo = isOutOfContract
      ? formatOocDocTicketNo({ year: period, running: next })
      : formatDocTicketNo({
          isOutOfContract: false,
          running: next,
          periodYear: this.bangkokYear(),
        });

    const clash = await tx.job.findFirst({
      where: {
        OR: [
          { ticketNo },
          { requestTicketNo: ticketNo },
        ],
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException(
        `เลขที่ใบแจ้งซ่อมซ้ำ (${ticketNo}) — ลองใหม่อีกครั้ง`,
      );
    }
    return ticketNo;
  }

  private static readonly BACKFILL_MIN_YEAR = 2000;

  /** สิ้นวันปัจจุบันตาม Asia/Bangkok (ไม่มี DST) — ใช้เปรียบเทียบกับค่า UTC ใน DB */
  private getEndOfTodayBangkok(): Date {
    const ymd = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return new Date(`${ymd}T23:59:59.999+07:00`);
  }

  private getStartOfMinBackfillDateBangkok(): Date {
    return new Date(
      `${JobsService.BACKFILL_MIN_YEAR}-01-01T00:00:00.000+07:00`,
    );
  }

  private assertBackfillDateInPolicy(
    d: Date,
    fieldName: 'reportDate' | 'fixDate',
  ): void {
    const start = this.getStartOfMinBackfillDateBangkok();
    const end = this.getEndOfTodayBangkok();
    if (d.getTime() < start.getTime()) {
      throw new BadRequestException(
        fieldName === 'reportDate'
          ? `วันที่แจ้งต้องไม่ก่อนปี ${JobsService.BACKFILL_MIN_YEAR} — กรุณาตรวจสอบปี`
          : `วันที่ปิดงานต้องไม่ก่อนปี ${JobsService.BACKFILL_MIN_YEAR} — กรุณาตรวจสอบปี`,
      );
    }
    if (d.getTime() > end.getTime()) {
      throw new BadRequestException(
        fieldName === 'reportDate'
          ? 'วันที่แจ้งต้องไม่เกินวันนี้ (ตามเวลาไทย) — ตรวจสอบปีหรือวันที่ในอนาคต'
          : 'วันที่ปิดงานต้องไม่เกินวันนี้ (ตามเวลาไทย) — ตรวจสอบปีหรือวันที่ในอนาคต',
      );
    }
  }

  /** แปลงสตริงวันเวลา (ISO หรือ datetime-local) ให้เป็น Date */
  private parseBackfillDate(
    input: string,
    fieldName: 'reportDate' | 'fixDate',
  ): Date {
    const raw = input.trim();
    if (!raw) {
      throw new BadRequestException(`${fieldName} ต้องไม่เป็นค่าว่าง`);
    }
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(
        `${fieldName} ไม่ใช่รูปแบบวันเวลาที่ถูกต้อง`,
      );
    }
    this.assertBackfillDateInPolicy(d, fieldName);
    return d;
  }
}

import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
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
import axios from 'axios';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private sitesService: SitesService,
    private usersService: UsersService,
    private minioService: MinioService,
    private jobEmailNotifications: JobEmailNotificationService,
    private rolesService: RolesService,
  ) {}

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
    const location = (data.location as string)?.trim();
    if (province && district && location) {
      const exists = await this.sitesService.existsByLocation(
        province,
        district,
        location,
      );
      if (!exists) {
        throw new BadRequestException(
          'กรุณาเลือกสถานที่จากรายการที่กำหนด (จังหวัด/อำเภอ/หน่วยงาน ไม่ถูกต้อง)',
        );
      }
    }

    const createData: Prisma.JobCreateInput = { ...data };
    // แปลงค่า isOutOfContract จาก form-data (string) ให้เป็น boolean ที่แน่นอน
    const rawOut = (data as any).isOutOfContract;
    if (typeof rawOut === 'string') {
      (createData as any).isOutOfContract = rawOut === 'true' || rawOut === '1';
    }

    if (!createData.ticketNo) {
      createData.ticketNo = await this.generateTicketNo();
    }
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

    const created = await this.prisma.job.create({
      data: createData,
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

  async findAll() {
    const rows = await this.prisma.job.findMany({
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
  async findByTicketNoForStatus(ticketNo: string, includeSensitive: boolean) {
    if (includeSensitive) {
      const job = await this.prisma.job.findUnique({
        where: { ticketNo },
        select: {
          id: true,
          ticketNo: true,
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

    const job = await this.prisma.job.findUnique({
      where: { ticketNo },
      select: {
        ticketNo: true,
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
      ticketNo: job.ticketNo,
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
        where: { OR: orClause },
        select: {
          id: true,
          ticketNo: true,
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
            where: { reporterId: { in: reporterUsers.map((u) => u.id) } },
            select: {
              id: true,
              ticketNo: true,
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

  async updateStatus(id: number, status: any, jwtForEmailPdf?: string) {
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
    if (nextSt === String(JobStatus.RESOLVED)) {
      if (prev.assignedToId == null) {
        throw new BadRequestException(
          'ปิดงานไม่ได้: ต้องมีผู้รับผิดชอบงานก่อน',
        );
      }
      if (prev.status === JobStatus.PENDING) {
        throw new BadRequestException(
          'ปิดงานไม่ได้: งานสถานะรอดำเนินการ (PENDING) ต้องมอบหมายและเปลี่ยนเป็นกำลังแก้ไขก่อน',
        );
      }
      if (prev.status !== JobStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'ปิดงานได้เฉพาะงานสถานะกำลังแก้ไข (IN_PROGRESS) เท่านั้น',
        );
      }
    }
    const updated = await this.prisma.job.update({
      where: { id },
      data: { status },
    });
    const wasResolved = prev?.status === JobStatus.RESOLVED;
    if (nextSt === 'RESOLVED' && !wasResolved) {
      void this.jobEmailNotifications.notifyClosed(updated.id, jwtForEmailPdf);
    }
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
      },
    });

    const full = await this.findOne(jobId);
    if (!full) {
      throw new NotFoundException(`ไม่พบงาน id=${jobId}`);
    }
    return full;
  }

  async updateFixInfo(
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
    },
    jwtForEmailPdf?: string,
  ) {
    const current = await this.prisma.job.findUnique({
      where: { id },
      select: { status: true, assignedToId: true },
    });
    if (!current) {
      throw new NotFoundException(`ไม่พบงาน id=${id}`);
    }
    if (current.status === JobStatus.RESOLVED) {
      throw new BadRequestException(
        'งานปิดแล้ว หากต้องการแก้ไขโปรด Reopen เพื่อเปลี่ยนสถานะเป็นกำลังแก้ไขก่อน',
      );
    }
    if (current.assignedToId == null) {
      throw new BadRequestException('ปิดงานไม่ได้: ต้องมีผู้รับผิดชอบงานก่อน');
    }
    if (current.status === JobStatus.PENDING) {
      throw new BadRequestException(
        'ปิดงานไม่ได้: งานสถานะรอดำเนินการ (PENDING) ต้องมอบหมายและเปลี่ยนเป็นกำลังแก้ไขก่อน',
      );
    }
    if (current.status !== JobStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'ปิดงานได้เฉพาะงานสถานะกำลังแก้ไข (IN_PROGRESS) เท่านั้น',
      );
    }

    const data: Prisma.JobUpdateInput = {
      status: JobStatus.RESOLVED,
      fixDate: new Date(),
    };

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

    const closed = await this.prisma.job.update({
      where: { id },
      data,
    });
    void this.jobEmailNotifications.notifyClosed(closed.id, jwtForEmailPdf);
    return closed;
  }

  async assignStaff(id: number, staffId: number, assignedByUserId: number) {
    const before = await this.prisma.job.findUnique({
      where: { id },
      select: { assignedToId: true, status: true },
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

    const updated = await this.prisma.job.update({
      where: { id },
      data,
    });
    if (before.assignedToId !== staffId) {
      void this.jobEmailNotifications.notifyAssigned(updated.id);
    }
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
  async moveToOutOfContract(id: number, isOutOfContract: boolean) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`ไม่พบ Job id=${id}`);

    if (job.status !== JobStatus.PENDING && isOutOfContract === true) {
      throw new BadRequestException(
        'อนุญาตให้ย้ายนอกสัญญาได้เฉพาะงานสถานะ PENDING เท่านั้น',
      );
    }

    return this.prisma.job.update({
      where: { id },
      data: { isOutOfContract },
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

  /** สร้างเลขที่ใบแจ้งซ่อมใหม่ให้มีรูปแบบใกล้เคียงข้อมูลเก่า (8 ตัวอักษร hex ไม่ซ้ำ) */
  private async generateTicketNo(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      // ตัวอย่างเดิมใน CSV เป็นรหัส 8 ตัว เช่น 65e5dfbd
      const ticketNo = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('');

      const exists = await this.prisma.job.findUnique({ where: { ticketNo } });
      if (!exists) {
        return ticketNo;
      }
    }
    throw new Error('ไม่สามารถสร้างเลขที่ใบแจ้งซ่อมได้ กรุณาลองใหม่อีกครั้ง');
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

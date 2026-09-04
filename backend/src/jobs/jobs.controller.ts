import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  UseInterceptors,
  UploadedFiles,
  Query,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { JobsService } from './jobs.service';
import { JobsPdfService } from './jobs-pdf.service';
import { MinioService } from '../minio/minio.service';
import { EventsGateway } from '../events/events.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { RolesService } from '../roles/roles.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  assertReporterSignatureFile,
  JOB_IMAGE_MULTER_LIMITS,
  normalizeJobImageFiles,
} from '../common/upload/job-image-upload';
import {
  UpdateJobStatusSchema,
  UpdateFixInfoSchema,
  AssignStaffSchema,
  BulkAssignStaffSchema,
  UpdateOutOfContractSchema,
  ClassifyDocSchema,
  ReopenJobSchema,
  BackfillJobDatesSchema,
  DashboardSummaryPdfQuerySchema,
  CancelJobSchema,
} from './dto/create-job.dto';
import type {
  BackfillJobDatesDto,
  DashboardSummaryPdfQueryDto,
} from './dto/create-job.dto';
import type { Response } from 'express';

type ReqUser = { user: { id: number; role: string } };

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobsPdfService: JobsPdfService,
    private readonly minioService: MinioService,
    private readonly eventsGateway: EventsGateway,
    private readonly rolesService: RolesService,
  ) {}

  /**
   * รายการงานทั้งหมด (ต้อง JWT)
   * - GET /list — แนะนำใช้จาก frontend เพื่อแยกความหมายชัดจาก POST / (แจ้งซ่อมสาธารณะ)
   * - GET / (path ว่าง = GET /api/jobs) — alias เดียวกับ /list รองรับ Postman/ลิงก์เดิมที่เปิดในเบราว์เซอร์
   */
  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll() {
    return this.jobsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllRoot() {
    return this.jobsService.findAll();
  }

  /** แจ้งเตือน: รายการงานใหม่สำหรับกระดิ่ง (PENDING ล่าสุด) */
  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async getNotifications(@Query('limit') limit?: string) {
    const n = limit ? Math.max(1, Math.min(50, parseInt(limit, 10) || 20)) : 20;
    return this.jobsService.findRecentPending(n);
  }

  /**
   * สรุปรายงานสำหรับ Dashboard (ไฟล์ PDF จากเซิร์ฟเวอร์)
   * Query:
   * - periodType=month&month=YYYY-MM
   * - periodType=year&year=YYYY
   * - periodType=range&start=ISO&end=ISO
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('menu.dashboard')
  @Get('reports/summary-pdf')
  async dashboardSummaryPdf(
    @Req() req: { user: { id: number } },
    @Query(new ZodValidationPipe(DashboardSummaryPdfQuerySchema))
    query: DashboardSummaryPdfQueryDto,
  ): Promise<StreamableFile> {
    const { buffer, filename } =
      await this.jobsPdfService.generateDashboardSummaryPdf(
        query,
        req.user.id,
      );
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  /**
   * ตรวจสอบสถานะด้วยเลขที่ใบแจ้งซ่อม — **ต้อง JWT** (หน้าในระบบหลังล็อกอิน)
   * หน้าสาธารณะใช้ `GET /api/public/jobs/status/:ticketNo` เท่านั้น
   */
  @UseGuards(JwtAuthGuard)
  @Get('status/:ticketNo')
  async getStatus(@Param('ticketNo') ticketNo: string) {
    return this.jobsService.findByTicketNoForStatus(ticketNo, true);
  }

  /** รายการงานตามเบอร์ผู้แจ้ง — สรุป + id สำหรับลิงก์แดชบอร์ด */
  @UseGuards(JwtAuthGuard)
  @Get('status-by-phone')
  async getStatusListByPhone(@Query('phone') phone?: string) {
    const p = String(phone ?? '').trim();
    if (!p) {
      throw new BadRequestException('ต้องระบุ query phone');
    }
    return this.jobsService.findByReporterPhoneForStatusList(p, true);
  }

  /**
   * Proxy ลายเซ็นผู้แจ้งตอนปิดงาน — ต้องอยู่ก่อน `:id/image/:kind/:index`
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/image/reporter-signature')
  async streamReporterSignature(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, contentType } =
      await this.jobsService.getReporterSignatureImageBuffer(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(buffer);
  }

  /**
   * Proxy รูปงาน (issue/fix) จาก URL ใน DB — ต้อง JWT
   * ใช้ให้ frontend/html2canvas โหลดรูป same-origin ผ่าน Next `/api/jobs/.../image/...` แทน URL MinIO ตรงๆ
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/image/:kind/:index')
  async streamJobImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('kind') kind: string,
    @Param('index', ParseIntPipe) index: number,
    @Res() res: Response,
  ) {
    if (kind !== 'issue' && kind !== 'fix') {
      throw new BadRequestException('kind ต้องเป็น issue หรือ fix');
    }
    if (index < 0 || index > 2) {
      throw new BadRequestException('index ต้องอยู่ระหว่าง 0 ถึง 2');
    }
    const { buffer, contentType } = await this.jobsService.getJobImageBuffer(
      id,
      kind,
      index,
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(buffer);
  }

  /**
   * PDF รายงาน (Chromium) — โหลดหน้า Next `/print/jobs/:id` พร้อม Authorization header
   * ต้องอยู่ก่อน @Get(':id') เพื่อไม่ให้ id จับคู่เป็น "report-pdf"
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/report-pdf')
  async reportPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { headers: { authorization?: string } },
  ): Promise<StreamableFile> {
    const raw = req.headers.authorization;
    const token =
      typeof raw === 'string' && raw.startsWith('Bearer ')
        ? raw.slice(7).trim()
        : '';
    const pdf = await this.jobsPdfService.generateReportPdf(id, token);
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="report-${id}.pdf"`,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteJob(
    @Req() req: ReqUser,
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    const userId = req.user?.id;
    if (userId == null) {
      throw new ForbiddenException('ไม่มีสิทธิ์ลบงาน');
    }
    const codes = await this.rolesService.getPermissionsForUser(userId);
    if (codes.includes('job.deleteInProgress')) {
      const deleted = await this.jobsService.tryDeleteInProgressJobByAdmin(id);
      if (deleted) {
        this.eventsGateway.notifyJobUpdate({ id, deleted: true });
        return { ok: true };
      }
    }
    if (!codes.includes('job.deleteUnassigned')) {
      throw new ForbiddenException('ไม่มีสิทธิ์ลบงานที่ยังไม่มีผู้รับผิดชอบ');
    }

    const result = await this.jobsService.deleteUnassignedJob(id);
    this.eventsGateway.notifyJobUpdate({ id, deleted: true });
    return result;
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('job.updateStatus')
  @Patch(':id/status')
  async updateStatus(
    @Req() req: { headers: { authorization?: string } },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateJobStatusSchema)) body: { status: any },
  ) {
    const raw = req.headers.authorization ?? '';
    const jwt =
      typeof raw === 'string' && raw.startsWith('Bearer ')
        ? raw.slice(7).trim()
        : '';
    const updated = await this.jobsService.updateStatus(+id, body.status, jwt);
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }

  /**
   * Backfill วันที่ย้อนหลังของงาน (ใช้ตอนลงข้อมูลเคสเก่า)
   * - reportDate: วันที่แจ้ง
   * - fixDate: วันที่ปิดงาน (อนุญาตเฉพาะงาน RESOLVED)
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('job.backfillDate')
  @Patch(':id/backfill-dates')
  async backfillDates(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body(new ZodValidationPipe(BackfillJobDatesSchema))
    body: BackfillJobDatesDto,
  ) {
    const updated = await this.jobsService.backfillDates(id, body);
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }

  /** Reopen: เสร็จสิ้น → กำลังแก้ไข (RBAC: job.reopen.self|any) */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reopen')
  async reopenJob(
    @Req() req: ReqUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReopenJobSchema)) body: { reason: string },
  ) {
    const userId = req.user?.id;
    if (userId == null) {
      throw new ForbiddenException('ไม่มีสิทธิ์ Reopen งาน');
    }
    const updated = await this.jobsService.reopenJobByAssignee(
      +id,
      userId,
      body.reason,
    );
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }

  /**
   * อัปโหลดรูปปัญหา (issue) — เติมต่อได้สูงสุด 3 รูป ไม่แทนที่รูปเดิม
   * RBAC: job.issue.upload · สถานะ PENDING | IN_PROGRESS
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('job.issue.upload')
  @Patch(':id/issue-images')
  @UseInterceptors(
    FilesInterceptor('images', 3, { limits: JOB_IMAGE_MULTER_LIMITS }),
  )
  async uploadIssueImages(
    @Req() req: ReqUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const userId = req.user?.id;
    if (userId == null) {
      throw new ForbiddenException('ไม่มีสิทธิ์อัปโหลดรูปปัญหา');
    }
    await this.jobsService.assertUserCanUploadIssueImages(id, userId);

    const normalizedFiles = await normalizeJobImageFiles(files ?? []);
    const newCount = normalizedFiles.length;
    if (newCount < 1) {
      throw new BadRequestException('กรุณาแนบรูปปัญหาอย่างน้อย 1 รูป');
    }

    const existingCount = await this.jobsService.getNonemptyIssueImageCount(id);
    if (existingCount + newCount > 3) {
      throw new BadRequestException(
        `อัปโหลดได้อีกไม่เกิน ${Math.max(0, 3 - existingCount)} รูป (สูงสุด 3 รูป)`,
      );
    }

    const uploadedUrls: string[] = [];
    let index = existingCount + 1;
    for (const file of normalizedFiles) {
      const url = await this.minioService.uploadJobImage(
        id,
        'issue',
        index,
        file,
      );
      uploadedUrls.push(url);
      index++;
    }

    const updated = await this.jobsService.setIssueImages(id, uploadedUrls);
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/fix')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'fixImages', maxCount: 3 }], {
      limits: JOB_IMAGE_MULTER_LIMITS,
    }),
  )
  async saveFixInfo(
    @Req() req: ReqUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateFixInfoSchema)) body: any,
    @UploadedFiles()
    files: {
      fixImages?: Express.Multer.File[];
    },
  ) {
    const userId = req.user?.id;
    if (userId == null) {
      throw new ForbiddenException('ไม่มีสิทธิ์บันทึกข้อมูลการแก้ไข');
    }
    /** บันทึกการแก้ไข — RBAC: job.fix.self|any */
    await this.jobsService.assertUserCanFix(+id, userId);

    const fixFiles = await normalizeJobImageFiles(files?.fixImages ?? []);

    const existingCount = await this.jobsService.getNonemptyFixImageCount(+id);
    const newCount = fixFiles.length;
    if (newCount > 0 && newCount < 2) {
      throw new BadRequestException(
        'กรุณาแนบรูปการแก้ไขอย่างน้อย 2 รูป หรือไม่แนบรูปเพื่อใช้รูปเดิม',
      );
    }
    if (newCount < 2 && existingCount < 2) {
      throw new BadRequestException('กรุณาแนบรูปการแก้ไขอย่างน้อย 2 รูป');
    }

    const uploadedUrls: string[] = [];
    if (newCount >= 2) {
      let index = 1;
      for (const file of fixFiles) {
        const url = await this.minioService.uploadJobImage(
          +id,
          'fix',
          index,
          file,
        );
        uploadedUrls.push(url);
        index++;
      }
    }

    const updated = await this.jobsService.saveFixInfo(+id, {
      brokenPartType: body.brokenPartType ?? null,
      fixEnvironment: body.fixEnvironment,
      cause: body.cause ?? null,
      fixMethod: body.fixMethod ?? null,
      note: body.note ?? null,
      oldSerialNumber: body.oldSerialNumber ?? null,
      newSerialNumber: body.newSerialNumber ?? null,
      fixImagesUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      actorUserId: userId,
    });
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/close')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'reporterSignature', maxCount: 1 }], {
      limits: JOB_IMAGE_MULTER_LIMITS,
    }),
  )
  async closeJob(
    @Req() req: ReqUser & { headers?: { authorization?: string } },
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      reporterSignature?: Express.Multer.File[];
    },
  ) {
    const userId = req.user?.id;
    if (userId == null) {
      throw new ForbiddenException('ไม่มีสิทธิ์ปิดงาน');
    }
    /** ปิดงาน — RBAC: job.fix.self|any */
    await this.jobsService.assertUserCanFix(+id, userId);
    await this.jobsService.assertJobFixReadyToClose(+id);

    const sigFile = files?.reporterSignature?.[0];
    if (!sigFile) {
      throw new BadRequestException('กรุณาเซ็นลายเซ็นผู้แจ้งก่อนปิดงาน');
    }
    const normalizedSig = await assertReporterSignatureFile(sigFile);

    const reporterSignatureUrl =
      await this.minioService.uploadJobReporterSignature(+id, normalizedSig);

    const raw = req.headers?.authorization ?? '';
    const jwt =
      typeof raw === 'string' && raw.startsWith('Bearer ')
        ? raw.slice(7).trim()
        : '';
    const updated = await this.jobsService.closeJob(
      +id,
      reporterSignatureUrl,
      userId,
      jwt,
    );
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk-assign')
  async bulkAssignStaff(
    @Req() req: ReqUser,
    @Body(new ZodValidationPipe(BulkAssignStaffSchema))
    body: { jobIds: number[]; staffId: number },
  ) {
    const userId = req.user.id;
    const codes = await this.rolesService.getPermissionsForUser(userId);
    const targetStaffId = Number(body.staffId);
    if (codes.includes('job.assign')) {
      // มอบหมายให้ผู้อื่นได้
    } else if (
      targetStaffId === Number(userId) &&
      codes.includes('menu.pending')
    ) {
      // รับงานเองหลายรายการ
    } else {
      throw new ForbiddenException('ไม่มีสิทธิ์มอบหมายงาน');
    }
    const result = await this.jobsService.bulkAssignStaff(
      body.jobIds,
      body.staffId,
      userId,
    );
    for (const job of result.jobs) {
      this.eventsGateway.notifyJobUpdate(job);
    }
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/assign')
  async assignStaff(
    @Req() req: ReqUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignStaffSchema)) body: { staffId: number },
  ) {
    const userId = req.user.id;
    const codes = await this.rolesService.getPermissionsForUser(userId);
    const targetStaffId = Number(body.staffId);
    if (codes.includes('job.assign')) {
      // มอบหมายให้ผู้อื่นได้
    } else if (
      targetStaffId === Number(userId) &&
      codes.includes('menu.pending')
    ) {
      // รับงานเอง (เช่น STAFF ที่มีเมนูรอดำเนินการ แต่ไม่มี job.assign)
    } else {
      throw new ForbiddenException('ไม่มีสิทธิ์มอบหมายงาน');
    }
    const updated = await this.jobsService.assignStaff(
      +id,
      body.staffId,
      userId,
    );
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }

  /**
   * ย้ายนอกสัญญา: ตั้ง Job.isOutOfContract=true แต่ "คงสถานะเดิม" (ต้องเป็น PENDING ตาม requirement)
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/out-of-contract')
  async moveToOutOfContract(
    @Req() req: ReqUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOutOfContractSchema))
    body: { isOutOfContract: boolean },
  ) {
    const codes = await this.rolesService.getPermissionsForUser(req.user.id);
    // ให้สอดคล้องกับหน้าจัดการสิทธิ์: ใช้ job.assign (ระดับเดียวกับมอบหมายงานคิว)
    if (!codes.includes('job.assign')) {
      throw new ForbiddenException('ไม่มีสิทธิ์ย้ายนอกสัญญา');
    }

    const updated = await this.jobsService.moveToOutOfContract(
      +id,
      body.isOutOfContract,
      req.user.id,
    );
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }

  /** จำแนกเอกสารหลังปิดงาน — ออก Running Doc No ครั้งเดียว */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('job.classifyDoc')
  @Patch(':id/classify-doc')
  async classifyDoc(
    @Req() req: ReqUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(ClassifyDocSchema))
    body: { isOutOfContract: boolean },
  ) {
    const updated = await this.jobsService.classifyDoc(
      id,
      body.isOutOfContract,
      req.user.id,
    );
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }

  /** ยกเลิกงานสถานะ PENDING — สิทธิ์ job.cancel */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('job.cancel')
  @Patch(':id/cancel')
  async cancelJob(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body(new ZodValidationPipe(CancelJobSchema)) body: { reason?: string },
  ) {
    const updated = await this.jobsService.cancelPendingJob(id, body?.reason);
    this.eventsGateway.notifyJobUpdate(updated);
    return updated;
  }
}

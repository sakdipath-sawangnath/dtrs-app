import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Post,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  Body,
  ForbiddenException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JobsService } from './jobs.service';
import { MinioService } from '../minio/minio.service';
import { EventsGateway } from '../events/events.gateway';
import { RolesService } from '../roles/roles.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateJobSchema } from './dto/create-job.dto';
import {
  assertAndNormalizeJobImage,
  JOB_IMAGE_MULTER_LIMITS,
  normalizeJobImageFiles,
} from '../common/upload/job-image-upload';
import type { Request } from 'express';

/**
 * API สาธารณะสำหรับหน้า `/public/report` และ `/public/status` เท่านั้น
 * แยกจาก `JobsController` เพื่อไม่ให้ทับซ้อนกับเส้นที่ต้อง JWT
 */
@Controller('public/jobs')
export class PublicJobsController {
  private readonly logger = new Logger(PublicJobsController.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly minioService: MinioService,
    private readonly eventsGateway: EventsGateway,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
  ) {}

  /** แจ้งซ่อม (multipart) — ไม่ต้อง JWT; รูป issue = images[], รูปโปรไฟล์ผู้แจ้ง = reporterAvatar */
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 3 },
        { name: 'reporterAvatar', maxCount: 1 },
      ],
      { limits: JOB_IMAGE_MULTER_LIMITS },
    ),
  )
  async createReport(
    @Req() req: Request,
    @Body(new ZodValidationPipe(CreateJobSchema)) createJobDto: any,
    @UploadedFiles()
    files?: {
      images?: Express.Multer.File[];
      reporterAvatar?: Express.Multer.File[];
    },
  ) {
    const isOutOfContract =
      createJobDto.isOutOfContract === true ||
      createJobDto.isOutOfContract === 'true' ||
      createJobDto.isOutOfContract === 1 ||
      createJobDto.isOutOfContract === '1';

    if (isOutOfContract) {
      const authHeader = (req.headers['authorization'] as string) || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : '';
      let authorized = false;
      if (token) {
        try {
          const decoded = this.jwtService.verify(token);
          const userId = Number(decoded?.sub);
          if (userId) {
            const codes = await this.rolesService.getPermissionsForUser(userId);
            authorized =
              codes.includes('menu.outOfContract') ||
              codes.includes('job.classifyDoc.outOfContract');
          }
        } catch {
          authorized = false;
        }
      }
      if (!authorized) {
        this.logger.warn(
          `Unauthorized attempt to submit out-of-contract report from public endpoint`,
        );
        throw new ForbiddenException(
          'การแจ้งงานนอกสัญญาจำกัดเฉพาะเจ้าหน้าที่ที่ได้รับอนุญาต',
        );
      }
    }

    const issueFiles = await normalizeJobImageFiles(files?.images ?? []);
    const reporterAvatar = files?.reporterAvatar?.[0]
      ? await assertAndNormalizeJobImage(files.reporterAvatar[0])
      : undefined;
    const baseData: Prisma.JobCreateInput = {
      ...createJobDto,
      isOutOfContract,
    };
    const created = await this.jobsService.createFromPublicReport(
      baseData as Record<string, unknown>,
      {
        reporterAvatar,
      },
    );

    const uploadedUrls: string[] = [];
    if (created?.id && issueFiles.length > 0) {
      let index = 1;
      for (const file of issueFiles) {
        try {
          const url = await this.minioService.uploadJobImage(
            created.id,
            'issue',
            index,
            file,
          );
          uploadedUrls.push(url);
          index++;
        } catch (uploadErr: any) {
          this.logger.error(
            `Failed to upload issue image #${index} for job ${created.id}: ${uploadErr?.message || uploadErr}`,
          );
        }
      }
    }

    if (created?.id && uploadedUrls.length > 0) {
      const updated = await this.jobsService.updateImages(
        created.id,
        uploadedUrls,
      );
      this.eventsGateway.notifyNewJob(updated);
      return updated;
    }

    this.eventsGateway.notifyNewJob(created);
    return created;
  }

  /** ตรวจสอบสถานะ — เสมอแบบมาสก์ (ไม่ส่งข้อมูลเต็ม/URL รูป) */
  @Get('status/:ticketNo')
  async getStatusPublic(@Param('ticketNo') ticketNo: string) {
    const job = await this.jobsService.findByTicketNoForStatus(ticketNo, false);
    if (!job) {
      throw new NotFoundException('ไม่พบข้อมูลการแจ้งซ่อม');
    }
    return job;
  }

  /** รายการงานตามเบอร์ผู้แจ้ง — สรุป (ไม่มี job id) */
  @Get('status-by-phone')
  async getStatusListByPhonePublic(@Query('phone') phone?: string) {
    const p = String(phone ?? '').trim();
    if (!p) {
      throw new BadRequestException('ต้องระบุ query phone');
    }
    return this.jobsService.findByReporterPhoneForStatusList(p, false);
  }
}

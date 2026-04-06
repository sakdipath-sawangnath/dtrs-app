import { BadRequestException, Controller, Get, Post, Param, Query, UseInterceptors, UploadedFiles, Body } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JobsService } from './jobs.service';
import { MinioService } from '../minio/minio.service';
import { EventsGateway } from '../events/events.gateway';
import { Prisma } from '@prisma/client';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateJobSchema } from './dto/create-job.dto';

/**
 * API สาธารณะสำหรับหน้า `/public/report` และ `/public/status` เท่านั้น
 * แยกจาก `JobsController` เพื่อไม่ให้ทับซ้อนกับเส้นที่ต้อง JWT
 */
@Controller('public/jobs')
export class PublicJobsController {
    constructor(
        private readonly jobsService: JobsService,
        private readonly minioService: MinioService,
        private readonly eventsGateway: EventsGateway,
    ) { }

    /** แจ้งซ่อม (multipart) — ไม่ต้อง JWT; รูป issue = images[], รูปโปรไฟล์ผู้แจ้ง = reporterAvatar */
    @Post()
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'images', maxCount: 10 },
            { name: 'reporterAvatar', maxCount: 1 },
        ]),
    )
    async createReport(
        @Body(new ZodValidationPipe(CreateJobSchema)) createJobDto: any,
        @UploadedFiles()
        files?: { images?: Express.Multer.File[]; reporterAvatar?: Express.Multer.File[] },
    ) {
        const issueFiles = files?.images ?? [];
        const reporterAvatar = files?.reporterAvatar?.[0];
        const baseData: Prisma.JobCreateInput = {
            ...createJobDto,
        };
        const created = await this.jobsService.createFromPublicReport(baseData as Record<string, unknown>, {
            reporterAvatar,
        });

        const uploadedUrls: string[] = [];
        if (created?.id && issueFiles.length > 0) {
            let index = 1;
            for (const file of issueFiles) {
                const url = await this.minioService.uploadJobImage(created.id, 'issue', index, file);
                uploadedUrls.push(url);
                index++;
            }
        }

        if (created?.id && uploadedUrls.length > 0) {
            const updated = await this.jobsService.updateImages(created.id, uploadedUrls);
            this.eventsGateway.notifyNewJob(updated);
            return updated;
        }

        this.eventsGateway.notifyNewJob(created);
        return created;
    }

    /** ตรวจสอบสถานะ — เสมอแบบมาสก์ (ไม่ส่งข้อมูลเต็ม/URL รูป) */
    @Get('status/:ticketNo')
    async getStatusPublic(@Param('ticketNo') ticketNo: string) {
        return this.jobsService.findByTicketNoForStatus(ticketNo, false);
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

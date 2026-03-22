import { BadRequestException, Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req, ForbiddenException, UseInterceptors, UploadedFiles, UsePipes, Query, ParseIntPipe, Res, StreamableFile } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JobsService } from './jobs.service';
import { UsersService } from '../users/users.service';
import { JobsPdfService } from './jobs-pdf.service';
import { MinioService } from '../minio/minio.service';
import { EventsGateway } from '../events/events.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
    UpdateJobStatusSchema,
    UpdateFixInfoSchema,
    AssignStaffSchema,
    UpdateOutOfContractSchema,
    ReopenJobSchema,
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
        private readonly usersService: UsersService,
    ) { }

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
     * ตรวจสอบสถานะด้วยเลขที่ใบแจ้งซ่อม — **ต้อง JWT** (หน้าในระบบหลังล็อกอิน)
     * หน้าสาธารณะใช้ `GET /api/public/jobs/status/:ticketNo` เท่านั้น
     */
    @UseGuards(JwtAuthGuard)
    @Get('status/:ticketNo')
    async getStatus(@Param('ticketNo') ticketNo: string) {
        return this.jobsService.findByTicketNoForStatus(ticketNo, true);
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
        const { buffer, contentType } = await this.jobsService.getJobImageBuffer(id, kind, index);
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
        // ใช้บทบาทจาก DB (roleRef.code) ไม่พึ่ง JWT อย่างเดียว — ให้ตรงกับ RBAC จริง
        const role = (await this.usersService.getEffectiveRoleCode(userId)) ?? '';
        // ADMIN: ลบงานกำลังแก้ไขได้ (หน้ารายการกำลังแก้ไข)
        if (role === 'ADMIN') {
            const deleted = await this.jobsService.tryDeleteInProgressJobByAdmin(id);
            if (deleted) {
                this.eventsGateway.notifyJobUpdate({ id, deleted: true });
                return { ok: true };
            }
        }
        // ลบงาน PENDING ที่ยังไม่มอบหมาย — เฉพาะ ADMIN / SUPERVISOR
        if (!['ADMIN', 'SUPERVISOR'].includes(role)) {
            throw new ForbiddenException('ไม่มีสิทธิ์ลบงานที่ยังไม่มีผู้รับผิดชอบ');
        }

        const result = await this.jobsService.deleteUnassignedJob(id);
        this.eventsGateway.notifyJobUpdate({ id, deleted: true });
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(UpdateJobStatusSchema)) body: { status: any },
    ) {
        const updated = await this.jobsService.updateStatus(+id, body.status);
        this.eventsGateway.notifyJobUpdate(updated);
        return updated;
    }

    /** Reopen: เสร็จสิ้น → กำลังแก้ไข (เฉพาะผู้รับงาน) */
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
        const updated = await this.jobsService.reopenJobByAssignee(+id, userId, body.reason);
        this.eventsGateway.notifyJobUpdate(updated);
        return updated;
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/fix')
    @UseInterceptors(FilesInterceptor('fixImages'))
    async updateFixInfo(
        @Req() req: ReqUser,
        @Param('id') id: string,
        @Body(new ZodValidationPipe(UpdateFixInfoSchema)) body: any,
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        const userId = req.user?.id;
        if (userId == null) {
            throw new ForbiddenException('ไม่มีสิทธิ์บันทึกข้อมูลการแก้ไข');
        }
        /** Reopen/บันทึกการแก้ไข — เฉพาะผู้รับงาน (assignedTo) เท่านั้น ไม่ยกเว้น ADMIN */
        await this.jobsService.assertUserIsAssigneeForFix(+id, userId);

        const uploadedUrls: string[] = [];
        if (files && files.length > 0) {
            let index = 1;
            for (const file of files) {
                const url = await this.minioService.uploadJobImage(+id, 'fix', index, file);
                uploadedUrls.push(url);
                index++;
            }
        }

        const updated = await this.jobsService.updateFixInfo(+id, {
            brokenPartType: body.brokenPartType ?? null,
            cause: body.cause ?? null,
            fixMethod: body.fixMethod ?? null,
            note: body.note ?? null,
            oldSerialNumber: body.oldSerialNumber ?? null,
            newSerialNumber: body.newSerialNumber ?? null,
            fixImagesUrls: uploadedUrls,
        });
        this.eventsGateway.notifyJobUpdate(updated);
        return updated;
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/assign')
    async assignStaff(
        @Req() req: ReqUser,
        @Param('id') id: string,
        @Body(new ZodValidationPipe(AssignStaffSchema)) body: { staffId: number },
    ) {
        const role = req.user?.role;
        const canAssignAny = role === 'ADMIN' || role === 'SUPERVISOR';
        if (!canAssignAny && role === 'STAFF') {
            if (body.staffId !== req.user.id) {
                throw new ForbiddenException('เจ้าหน้าที่สามารถรับงานตัวเองเท่านั้น');
            }
        } else if (!canAssignAny) {
            throw new ForbiddenException('ไม่มีสิทธิ์มอบหมายงาน');
        }
        const updated = await this.jobsService.assignStaff(+id, body.staffId);
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
        @Body(new ZodValidationPipe(UpdateOutOfContractSchema)) body: { isOutOfContract: boolean },
    ) {
        const role = req.user?.role;
        // ย้ายนอกสัญญาให้จัดการได้เฉพาะ manager/admin เท่านั้น
        if (!['ADMIN', 'SUPERVISOR'].includes(role)) {
            throw new ForbiddenException('ไม่มีสิทธิ์ย้ายนอกสัญญา');
        }

        const updated = await this.jobsService.moveToOutOfContract(+id, body.isOutOfContract);
        this.eventsGateway.notifyJobUpdate(updated);
        return updated;
    }
}

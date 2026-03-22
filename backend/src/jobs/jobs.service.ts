import {
    BadRequestException,
    ForbiddenException,
    Injectable,
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
import axios from 'axios';

@Injectable()
export class JobsService {
    constructor(
        private prisma: PrismaService,
        private sitesService: SitesService,
        private usersService: UsersService,
    ) { }

    async create(data: Prisma.JobCreateInput) {
        const province = (data.province as string)?.trim();
        const district = (data.district as string)?.trim();
        const location = (data.location as string)?.trim();
        if (province && district && location) {
            const exists = await this.sitesService.existsByLocation(province, district, location);
            if (!exists) {
                throw new BadRequestException('กรุณาเลือกสถานที่จากรายการที่กำหนด (จังหวัด/อำเภอ/หน่วยงาน ไม่ถูกต้อง)');
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

        const phone = (createData.reporterPhone as string | undefined)?.trim();
        if (phone) {
            const u = await this.usersService.findByPhone(phone);
            if (u?.id) {
                createData.reporter = { connect: { id: u.id } };
            }
        }

        return this.prisma.job.create({
            data: createData,
        });
    }

    async findAll() {
        return this.prisma.job.findMany({
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
        return this.prisma.job.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true },
                },
                reporter: {
                    select: { id: true, image: true },
                },
            },
        });
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
            ? (raw as unknown[]).filter((u): u is string => typeof u === 'string' && u.length > 0)
            : [];
        const url = urls[index];
        if (!url) {
            throw new NotFoundException('ไม่มีรูปในตำแหน่งนี้');
        }
        try {
            const resp = await axios.get<ArrayBuffer>(url, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 15 * 1024 * 1024,
                validateStatus: (s) => s >= 200 && s < 400,
            });
            const ct = (resp.headers['content-type'] as string) || 'image/jpeg';
            return { buffer: Buffer.from(resp.data), contentType: ct };
        } catch {
            throw new BadRequestException('ไม่สามารถโหลดรูปจากที่เก็บได้');
        }
    }

    /**
     * ค้นหาตามเลขที่ใบแจ้งซ่อม (หน้า /status)
     * - includeSensitive=false: สาธารณะ — มาสก์ PII/สถานที่, ไม่ส่ง URL รูป (ส่ง issueImageCount แทน), รายละเอียดปัญหาแสดงเต็ม
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
                    province: true,
                    district: true,
                    location: true,
                    reporterName: true,
                    reporterPhone: true,
                    reporterEmail: true,
                    images: true,
                    reporter: {
                        select: {
                            image: true,
                        },
                    },
                },
            });
            if (!job) {
                return null;
            }
            return { ...job, detailLevel: 'full' as const };
        }

        const job = await this.prisma.job.findUnique({
            where: { ticketNo },
            select: {
                ticketNo: true,
                status: true,
                reportDate: true,
                description: true,
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

        const provinceMasked = job.province ? maskTextForPublic(job.province) : null;
        const districtMasked = job.district ? maskTextForPublic(job.district) : null;
        const locationMasked = job.location ? maskTextForPublic(job.location) : null;

        return {
            ticketNo: job.ticketNo,
            status: job.status,
            reportDate: job.reportDate,
            description: job.description,
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

    async updateStatus(id: number, status: any) {
        return this.prisma.job.update({
            where: { id },
            data: { status },
        });
    }

    async updateImages(id: number, images: string[]) {
        return this.prisma.job.update({
            where: { id },
            data: { images: images as any },
        });
    }

    /**
     * บันทึก/แก้ไขข้อมูลการแก้ไข — อนุญาตเฉพาะผู้รับงาน (assignedTo) เท่านั้น
     */
    async assertUserIsAssigneeForFix(jobId: number, userId: number): Promise<void> {
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
                'เฉพาะผู้รับงาน (ผู้ที่ได้รับมอบหมายงานนี้) เท่านั้นที่บันทึกหรือแก้ไขข้อมูลการแก้ไขได้',
            );
        }
    }

    /**
     * Reopen: RESOLVED → IN_PROGRESS (เฉพาะผู้รับงาน) พร้อมบันทึกเหตุผลต่อท้าย fixNote
     */
    async reopenJobByAssignee(jobId: number, userId: number, reason: string) {
        await this.assertUserIsAssigneeForFix(jobId, userId);
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
            cause?: string | null;
            fixMethod?: string | null;
            note?: string | null;
            oldSerialNumber?: string | null;
            newSerialNumber?: string | null;
            fixImagesUrls?: string[];
        },
    ) {
        const current = await this.prisma.job.findUnique({
            where: { id },
            select: { status: true },
        });
        if (!current) {
            throw new NotFoundException(`ไม่พบงาน id=${id}`);
        }
        if (current.status === JobStatus.RESOLVED) {
            throw new BadRequestException(
                'งานปิดแล้ว หากต้องการแก้ไขโปรด Reopen เพื่อเปลี่ยนสถานะเป็นกำลังแก้ไขก่อน',
            );
        }

        const data: Prisma.JobUpdateInput = {
            status: JobStatus.RESOLVED,
            fixDate: new Date(),
        };

        if (payload.brokenPartType !== undefined) {
            data.brokenPart = payload.brokenPartType;
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

        return this.prisma.job.update({
            where: { id },
            data,
        });
    }

    async assignStaff(id: number, staffId: number) {
        return this.prisma.job.update({
            where: { id },
            data: { assignedToId: staffId, status: 'IN_PROGRESS' },
        });
    }

    /**
     * ย้ายงานไปนอกสัญญา แต่คงสถานะเป็น PENDING (ตาม requirement)
     */
    async moveToOutOfContract(id: number, isOutOfContract: boolean) {
        const job = await this.prisma.job.findUnique({ where: { id } });
        if (!job) throw new NotFoundException(`ไม่พบ Job id=${id}`);

        if (job.status !== JobStatus.PENDING && isOutOfContract === true) {
            throw new BadRequestException('อนุญาตให้ย้ายนอกสัญญาได้เฉพาะงานสถานะ PENDING เท่านั้น');
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
            throw new BadRequestException('อนุญาตให้ลบได้เฉพาะงานสถานะ PENDING เท่านั้น');
        }

        if (job.assignedToId != null) {
            throw new BadRequestException('อนุญาตให้ลบได้เฉพาะงานที่ยังไม่มีผู้รับผิดชอบ');
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
}

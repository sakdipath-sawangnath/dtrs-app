import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SitesService {
    constructor(private prisma: PrismaService) {}

    /** คืนเฉพาะฟิลด์ที่จำเป็นสำหรับ dropdown (ไม่ส่ง createdAt/updatedAt) */
    async findAll() {
        return this.prisma.site.findMany({
            select: { id: true, province: true, district: true, agency: true },
            orderBy: [{ province: 'asc' }, { district: 'asc' }, { agency: 'asc' }],
        });
    }

    /** ตรวจสอบว่าพื้นที่ (จังหวัด, อำเภอ, หน่วยงาน) มีในระบบหรือไม่ */
    async existsByLocation(province: string, district: string, agency: string): Promise<boolean> {
        if (!province?.trim() || !district?.trim() || !agency?.trim()) return false;
        const found = await this.prisma.site.findFirst({
            where: {
                province: province.trim(),
                district: district.trim(),
                agency: agency.trim(),
            },
        });
        return !!found;
    }

    async create(data: Prisma.SiteCreateInput) {
        return this.prisma.site.create({ data });
    }
}

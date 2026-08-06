import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSiteDto, UpdateSiteDto } from './dto/site.dto';

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
  async existsByLocation(
    province: string,
    district: string,
    agency: string,
  ): Promise<boolean> {
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

  async findOne(id: number) {
    return this.prisma.site.findUnique({
      where: { id },
      select: { id: true, province: true, district: true, agency: true },
    });
  }

  async create(data: CreateSiteDto) {
    const province = data.province.trim();
    const district = data.district.trim();
    const agency = data.agency.trim();

    const exists = await this.existsByLocation(province, district, agency);
    if (exists) throw new ConflictException('มีข้อมูล Site นี้อยู่แล้วในระบบ');

    return this.prisma.site.create({
      data: { province, district, agency } as Prisma.SiteCreateInput,
      select: { id: true, province: true, district: true, agency: true },
    });
  }

  async update(id: number, data: UpdateSiteDto) {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('ไม่พบ Site นี้');

    const province =
      data.province != null ? data.province.trim() : existing.province;
    const district =
      data.district != null ? data.district.trim() : existing.district;
    const agency = data.agency != null ? data.agency.trim() : existing.agency;

    const conflict = await this.prisma.site.findFirst({
      where: { province, district, agency },
      select: { id: true },
    });
    if (conflict && conflict.id !== id) {
      throw new ConflictException('มีข้อมูล Site นี้อยู่แล้วในระบบ');
    }

    return this.prisma.site.update({
      where: { id },
      data: { province, district, agency } as Prisma.SiteUpdateInput,
      select: { id: true, province: true, district: true, agency: true },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.site.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('ไม่พบ Site นี้');

    await this.prisma.site.delete({ where: { id } });
    return { ok: true };
  }

  /** ลบหลาย Site ตาม id (ไม่มี FK จาก Job — ปลอดภัยตาม schema ปัจจุบัน) */
  async removeMany(ids: number[]) {
    const unique = [...new Set(ids)].filter(
      (id) => Number.isInteger(id) && id > 0,
    );
    if (unique.length === 0) {
      return { deleted: 0 };
    }
    const result = await this.prisma.site.deleteMany({
      where: { id: { in: unique } },
    });
    return { deleted: result.count };
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSiteDto, UpdateSiteDto } from './dto/site.dto';

const siteSelect = {
  id: true,
  province: true,
  district: true,
  subdistrict: true,
  agency: true,
  station: true,
} as const;

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  /** คืนเฉพาะฟิลด์ที่จำเป็นสำหรับ dropdown (ไม่ส่ง createdAt/updatedAt) */
  async findAll() {
    return this.prisma.site.findMany({
      select: siteSelect,
      orderBy: [
        { province: 'asc' },
        { district: 'asc' },
        { subdistrict: 'asc' },
        { agency: 'asc' },
        { station: 'asc' },
      ],
    });
  }

  private sortThai(names: string[]): string[] {
    return [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, 'th'),
    );
  }

  /** Public cascade: รายการจังหวัดที่มีใน Site */
  async listOptionProvinces(): Promise<string[]> {
    const rows = await this.prisma.site.findMany({
      select: { province: true },
      distinct: ['province'],
    });
    return this.sortThai(rows.map((r) => r.province));
  }

  /** Public cascade: อำเภอในจังหวัด (จาก Site) */
  async listOptionDistricts(province: string): Promise<string[]> {
    const p = province.trim();
    if (!p) return [];
    const rows = await this.prisma.site.findMany({
      where: { province: p },
      select: { district: true },
      distinct: ['district'],
    });
    return this.sortThai(rows.map((r) => r.district));
  }

  /** Public cascade: ตำบลในจังหวัด+อำเภอ (เฉพาะค่าที่มีใน Site) */
  async listOptionSubdistricts(
    province: string,
    district: string,
  ): Promise<string[]> {
    const p = province.trim();
    const d = district.trim();
    if (!p || !d) return [];
    const rows = await this.prisma.site.findMany({
      where: { province: p, district: d },
      select: { subdistrict: true },
      distinct: ['subdistrict'],
    });
    return this.sortThai(
      rows.map((r) => (r.subdistrict ?? '').trim()).filter((s) => s.length > 0),
    );
  }

  /** Public cascade: สถานที่/หน่วยงาน */
  async listOptionAgencies(
    province: string,
    district: string,
    subdistrict?: string | null,
  ): Promise<string[]> {
    const p = province.trim();
    const d = district.trim();
    if (!p || !d) return [];
    const sd = (subdistrict ?? '').trim();
    const rows = await this.prisma.site.findMany({
      where: {
        province: p,
        district: d,
        ...(sd ? { subdistrict: sd } : {}),
      },
      select: { agency: true },
      distinct: ['agency'],
    });
    return this.sortThai(rows.map((r) => r.agency));
  }

  /** Public cascade: ชื่อสถานี */
  async listOptionStations(
    province: string,
    district: string,
    agency: string,
    subdistrict?: string | null,
  ): Promise<string[]> {
    const p = province.trim();
    const d = district.trim();
    const a = agency.trim();
    if (!p || !d || !a) return [];
    const sd = (subdistrict ?? '').trim();
    const rows = await this.prisma.site.findMany({
      where: {
        province: p,
        district: d,
        agency: a,
        ...(sd ? { subdistrict: sd } : {}),
      },
      select: { station: true },
      distinct: ['station'],
    });
    return this.sortThai(rows.map((r) => r.station));
  }

  /**
   * หา Site ตามคีย์สถานที่
   * - whenSubdistrictEmpty: 'null-or-blank' = unique ตอนสร้าง/แก้ Site (ว่างต้องชนเฉพาะแถวที่ตำบลว่าง)
   * - whenSubdistrictEmpty: 'any' = ตอนสร้าง Job / public report (ไม่เลือกตำบลยัง match แถวที่มีตำบลได้)
   */
  async findByLocation(
    province: string,
    district: string,
    agency: string,
    station: string,
    subdistrict?: string | null,
    opts?: { whenSubdistrictEmpty?: 'null-or-blank' | 'any' },
  ) {
    if (
      !province?.trim() ||
      !district?.trim() ||
      !agency?.trim() ||
      !station?.trim()
    ) {
      return null;
    }
    const sd = (subdistrict ?? '').trim();
    const emptyMode = opts?.whenSubdistrictEmpty ?? 'null-or-blank';
    const where: Prisma.SiteWhereInput = {
      province: province.trim(),
      district: district.trim(),
      agency: agency.trim(),
      station: station.trim(),
    };
    if (sd) {
      where.subdistrict = sd;
    } else if (emptyMode === 'null-or-blank') {
      where.OR = [{ subdistrict: null }, { subdistrict: '' }];
    }
    // emptyMode === 'any' → ไม่กรองตำบล
    return this.prisma.site.findFirst({
      where,
      select: siteSelect,
    });
  }

  /** ตรวจสอบว่าพื้นที่ (จังหวัด, อำเภอ, สถานที่/หน่วยงาน, ชื่อสถานี, ตำบล?) มีในระบบหรือไม่ */
  async existsByLocation(
    province: string,
    district: string,
    agency: string,
    station: string,
    subdistrict?: string | null,
    opts?: { whenSubdistrictEmpty?: 'null-or-blank' | 'any' },
  ): Promise<boolean> {
    const found = await this.findByLocation(
      province,
      district,
      agency,
      station,
      subdistrict,
      opts,
    );
    return !!found;
  }

  async findOne(id: number) {
    return this.prisma.site.findUnique({
      where: { id },
      select: siteSelect,
    });
  }

  async create(data: CreateSiteDto) {
    const province = data.province.trim();
    const district = data.district.trim();
    const agency = data.agency.trim();
    const station = data.station.trim();
    const subdistrict = (data.subdistrict ?? '').trim() || null;

    const exists = await this.existsByLocation(
      province,
      district,
      agency,
      station,
      subdistrict,
      { whenSubdistrictEmpty: 'null-or-blank' },
    );
    if (exists) throw new ConflictException('มีข้อมูล Site นี้อยู่แล้วในระบบ');

    return this.prisma.site.create({
      data: {
        province,
        district,
        agency,
        station,
        subdistrict,
      } as Prisma.SiteCreateInput,
      select: siteSelect,
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
    const station =
      data.station != null ? data.station.trim() : existing.station;
    const subdistrict =
      data.subdistrict != null
        ? data.subdistrict.trim() || null
        : existing.subdistrict;

    const conflict = await this.prisma.site.findFirst({
      where: {
        province,
        district,
        agency,
        station,
        OR: subdistrict
          ? [{ subdistrict }]
          : [{ subdistrict: null }, { subdistrict: '' }],
      },
      select: { id: true },
    });
    if (conflict && conflict.id !== id) {
      throw new ConflictException('มีข้อมูล Site นี้อยู่แล้วในระบบ');
    }

    return this.prisma.site.update({
      where: { id },
      data: {
        province,
        district,
        agency,
        station,
        subdistrict,
      } as Prisma.SiteUpdateInput,
      select: siteSelect,
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

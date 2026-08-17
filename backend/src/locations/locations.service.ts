import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateDistrictDto,
  CreateProvinceDto,
  CreateSubdistrictDto,
} from './dto/province-district.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  /** รายการจังหวัดอย่างเดียว (ไม่รวมอำเภอ/ตำบล — ใช้กับ cascade lazy-load) */
  async findProvinces() {
    const provinces = await this.prisma.province.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { districts: true } },
      },
    });
    return provinces.map((p) => ({
      id: p.id,
      name: p.name,
      districtCount: p._count.districts,
    }));
  }

  /** อำเภอของจังหวัดหนึ่ง (ไม่รวมตำบล) */
  async findDistrictsByProvince(provinceId: number) {
    const province = await this.prisma.province.findUnique({
      where: { id: provinceId },
      select: { id: true },
    });
    if (!province) {
      throw new NotFoundException('ไม่พบจังหวัดนี้');
    }
    const districts = await this.prisma.district.findMany({
      where: { provinceId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        provinceId: true,
        _count: { select: { subdistricts: true } },
      },
    });
    return districts.map((d) => ({
      id: d.id,
      name: d.name,
      provinceId: d.provinceId,
      subdistrictCount: d._count.subdistricts,
    }));
  }

  /** ตำบลของอำเภอหนึ่ง */
  async findSubdistrictsByDistrict(districtId: number) {
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
      select: { id: true },
    });
    if (!district) {
      throw new NotFoundException('ไม่พบอำเภอนี้');
    }
    return this.prisma.subdistrict.findMany({
      where: { districtId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, districtId: true },
    });
  }

  async createProvince(dto: CreateProvinceDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.province.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException('มีจังหวัดนี้ในระบบแล้ว');
    }
    return this.prisma.province.create({
      data: { name },
      select: { id: true, name: true },
    });
  }

  async createDistrict(provinceId: number, dto: CreateDistrictDto) {
    const province = await this.prisma.province.findUnique({
      where: { id: provinceId },
      select: { id: true },
    });
    if (!province) {
      throw new NotFoundException('ไม่พบจังหวัดนี้');
    }
    const name = dto.name.trim();
    const dup = await this.prisma.district.findFirst({
      where: { provinceId, name },
    });
    if (dup) {
      throw new ConflictException('มีอำเภอนี้ในจังหวัดนี้แล้ว');
    }
    return this.prisma.district.create({
      data: { provinceId, name },
      select: { id: true, name: true, provinceId: true },
    });
  }

  async createSubdistrict(districtId: number, dto: CreateSubdistrictDto) {
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
      select: { id: true },
    });
    if (!district) {
      throw new NotFoundException('ไม่พบอำเภอนี้');
    }
    const name = dto.name.trim();
    const dup = await this.prisma.subdistrict.findFirst({
      where: { districtId, name },
    });
    if (dup) {
      throw new ConflictException('มีตำบลนี้ในอำเภอนี้แล้ว');
    }
    return this.prisma.subdistrict.create({
      data: { districtId, name },
      select: { id: true, name: true, districtId: true },
    });
  }
}

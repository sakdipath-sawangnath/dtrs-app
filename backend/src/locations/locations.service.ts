import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDistrictDto, CreateProvinceDto } from './dto/province-district.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  /** รายการจังหวัดพร้อมอำเภอ — เรียงชื่อ ไทย */
  async findProvincesWithDistricts() {
    const provinces = await this.prisma.province.findMany({
      orderBy: { name: 'asc' },
      include: {
        districts: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
    });
    return provinces.map((p) => ({
      id: p.id,
      name: p.name,
      districts: p.districts,
    }));
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
}

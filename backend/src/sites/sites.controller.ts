import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  BulkDeleteSitesSchema,
  CreateSiteSchema,
  UpdateSiteSchema,
} from './dto/site.dto';
import type {
  BulkDeleteSitesDto,
  CreateSiteDto,
  UpdateSiteDto,
} from './dto/site.dto';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  /** Public: ตาราง dashboard / รายการเต็ม (ไม่ใช้บน public report cascade) */
  @Get()
  async findAll() {
    return this.sitesService.findAll();
  }

  /** Public cascade — จังหวัดที่มีใน Site */
  @Get('options/provinces')
  async optionProvinces() {
    return this.sitesService.listOptionProvinces();
  }

  /** Public cascade — อำเภอตามจังหวัด */
  @Get('options/districts')
  async optionDistricts(@Query('province') province?: string) {
    if (!province?.trim()) {
      throw new BadRequestException('กรุณาระบุ province');
    }
    return this.sitesService.listOptionDistricts(province);
  }

  /** Public cascade — ตำบลตามจังหวัด+อำเภอ */
  @Get('options/subdistricts')
  async optionSubdistricts(
    @Query('province') province?: string,
    @Query('district') district?: string,
  ) {
    if (!province?.trim() || !district?.trim()) {
      throw new BadRequestException('กรุณาระบุ province และ district');
    }
    return this.sitesService.listOptionSubdistricts(province, district);
  }

  /** Public cascade — สถานที่/หน่วยงาน (ตำบล optional) */
  @Get('options/agencies')
  async optionAgencies(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('subdistrict') subdistrict?: string,
  ) {
    if (!province?.trim() || !district?.trim()) {
      throw new BadRequestException('กรุณาระบุ province และ district');
    }
    return this.sitesService.listOptionAgencies(
      province,
      district,
      subdistrict,
    );
  }

  /** Public cascade — ชื่อสถานี */
  @Get('options/stations')
  async optionStations(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('agency') agency?: string,
    @Query('subdistrict') subdistrict?: string,
  ) {
    if (!province?.trim() || !district?.trim() || !agency?.trim()) {
      throw new BadRequestException('กรุณาระบุ province, district และ agency');
    }
    return this.sitesService.listOptionStations(
      province,
      district,
      agency,
      subdistrict,
    );
  }

  /** จัดการ Site: สร้าง (ต้องมี permission) */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('site.create')
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateSiteSchema)) createSiteDto: CreateSiteDto,
  ) {
    return this.sitesService.create(createSiteDto);
  }

  /** ลบหลาย Site (bulk) — ต้องมี permission site.delete */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('site.delete')
  @Post('bulk-delete')
  async removeMany(
    @Body(new ZodValidationPipe(BulkDeleteSitesSchema))
    body: BulkDeleteSitesDto,
  ) {
    return this.sitesService.removeMany(body.ids);
  }

  /** จัดการ Site: แก้ไข (ต้องมี permission) */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('site.update')
  @Patch(':id')
  async update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body(new ZodValidationPipe(UpdateSiteSchema)) body: UpdateSiteDto,
  ) {
    return this.sitesService.update(id, body);
  }

  /** จัดการ Site: ลบ (ต้องมี permission) */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('site.delete')
  @Delete(':id')
  async remove(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    return this.sitesService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
  ParseIntPipe,
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

  /** Public: หน้าแจ้งปัญหา (/report) ใช้ดึงรายการจังหวัด/อำเภอ/หน่วยงาน */
  @Get()
  async findAll() {
    return this.sitesService.findAll();
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

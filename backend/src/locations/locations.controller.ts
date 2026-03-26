import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateDistrictSchema,
  CreateProvinceSchema,
} from './dto/province-district.dto';
import type { CreateDistrictDto, CreateProvinceDto } from './dto/province-district.dto';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /** รายการจังหวัด + อำเภอ (อ่านได้โดยไม่ต้องล็อกอิน — ใช้กับ dropdown / หน้าแจ้งซ่อม) */
  @Get('provinces')
  async listProvinces() {
    return this.locationsService.findProvincesWithDistricts();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('site.create')
  @Post('provinces')
  async createProvince(
    @Body(new ZodValidationPipe(CreateProvinceSchema)) body: CreateProvinceDto,
  ) {
    return this.locationsService.createProvince(body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('site.create')
  @Post('provinces/:provinceId/districts')
  async createDistrict(
    @Param('provinceId', new ParseIntPipe({ errorHttpStatusCode: 400 }))
    provinceId: number,
    @Body(new ZodValidationPipe(CreateDistrictSchema)) body: CreateDistrictDto,
  ) {
    return this.locationsService.createDistrict(provinceId, body);
  }
}

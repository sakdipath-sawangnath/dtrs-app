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
  CreateSubdistrictSchema,
} from './dto/province-district.dto';
import type {
  CreateDistrictDto,
  CreateProvinceDto,
  CreateSubdistrictDto,
} from './dto/province-district.dto';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /** จังหวัดอย่างเดียว (public — cascade โหลดอำเภอ/ตำบลแยก) */
  @Get('provinces')
  async listProvinces() {
    return this.locationsService.findProvinces();
  }

  /** อำเภอของจังหวัด (public) */
  @Get('provinces/:provinceId/districts')
  async listDistricts(
    @Param('provinceId', new ParseIntPipe({ errorHttpStatusCode: 400 }))
    provinceId: number,
  ) {
    return this.locationsService.findDistrictsByProvince(provinceId);
  }

  /** ตำบลของอำเภอ (public) */
  @Get('districts/:districtId/subdistricts')
  async listSubdistricts(
    @Param('districtId', new ParseIntPipe({ errorHttpStatusCode: 400 }))
    districtId: number,
  ) {
    return this.locationsService.findSubdistrictsByDistrict(districtId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('location.create')
  @Post('provinces')
  async createProvince(
    @Body(new ZodValidationPipe(CreateProvinceSchema)) body: CreateProvinceDto,
  ) {
    return this.locationsService.createProvince(body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('location.create')
  @Post('provinces/:provinceId/districts')
  async createDistrict(
    @Param('provinceId', new ParseIntPipe({ errorHttpStatusCode: 400 }))
    provinceId: number,
    @Body(new ZodValidationPipe(CreateDistrictSchema)) body: CreateDistrictDto,
  ) {
    return this.locationsService.createDistrict(provinceId, body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('location.create')
  @Post('districts/:districtId/subdistricts')
  async createSubdistrict(
    @Param('districtId', new ParseIntPipe({ errorHttpStatusCode: 400 }))
    districtId: number,
    @Body(new ZodValidationPipe(CreateSubdistrictSchema))
    body: CreateSubdistrictDto,
  ) {
    return this.locationsService.createSubdistrict(districtId, body);
  }
}

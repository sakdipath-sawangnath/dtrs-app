import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AreasService } from './areas.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.areasService.findAll();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('site.create')
  @Post()
  async create(@Body() createAreaDto: Prisma.AreaCreateInput) {
    return this.areasService.create(createAreaDto);
  }
}

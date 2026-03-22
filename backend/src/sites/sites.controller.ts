import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SitesService } from './sites.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sites')
export class SitesController {
    constructor(private readonly sitesService: SitesService) {}

    /** Public: หน้าแจ้งปัญหา (/report) ใช้ดึงรายการจังหวัด/อำเภอ/หน่วยงาน */
    @Get()
    async findAll() {
        return this.sitesService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createSiteDto: Prisma.SiteCreateInput) {
        return this.sitesService.create(createSiteDto);
    }
}

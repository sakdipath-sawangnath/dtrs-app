import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AreasService } from './areas.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('areas')
export class AreasController {
    constructor(private readonly areasService: AreasService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll() {
        return this.areasService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createAreaDto: Prisma.AreaCreateInput) {
        return this.areasService.create(createAreaDto);
    }
}

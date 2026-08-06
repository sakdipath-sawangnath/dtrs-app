import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.area.findMany({
      include: {
        staff: {
          select: { id: true, name: true, username: true },
        },
      },
    });
  }

  async create(data: Prisma.AreaCreateInput) {
    return this.prisma.area.create({ data });
  }
}

import { Module } from '@nestjs/common';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsGuard } from '../auth/permissions.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AreasController],
  providers: [AreasService, PermissionsGuard],
})
export class AreasModule {}

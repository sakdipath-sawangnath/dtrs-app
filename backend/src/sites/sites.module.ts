import { Module } from '@nestjs/common';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsGuard } from '../auth/permissions.guard';

@Module({
  imports: [PrismaModule],
  controllers: [SitesController],
  providers: [SitesService, PermissionsGuard],
  exports: [SitesService],
})
export class SitesModule {}

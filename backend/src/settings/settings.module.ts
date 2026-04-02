import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailService } from './mail.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [PrismaModule, MinioModule],
  controllers: [SettingsController],
  providers: [SettingsService, MailService, PermissionsGuard],
  exports: [SettingsService, MailService],
})
export class SettingsModule {}

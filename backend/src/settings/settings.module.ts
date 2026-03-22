import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailService } from './mail.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [SettingsService, MailService],
  exports: [SettingsService, MailService],
})
export class SettingsModule {}

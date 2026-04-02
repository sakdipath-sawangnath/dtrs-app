import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TestEmailSmtpDto, UpdateEmailSmtpDto } from './dto/email-smtp.dto';
import { UpdateEmailTemplatesDto } from './dto/email-templates.dto';
import { UpdateDefaultPassDto } from './dto/default-pass.dto';
import { SettingsService } from './settings.service';
import {
  MinioOrphansDeleteSchema,
  MinioOrphansScanSchema,
} from '../jobs/dto/create-job.dto';
import type {
  MinioOrphansDeleteDto,
  MinioOrphansScanDto,
} from '../jobs/dto/create-job.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('menu.settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('email-smtp')
  async getEmailSmtp() {
    const data = await this.settingsService.getEmailSmtp();
    if (!data) {
      return {
        smtpHost: '',
        smtpPort: '587',
        username: '',
        secure: false,
        from: '',
        passwordSet: false,
        tlsRejectUnauthorized: true,
      };
    }
    return data;
  }

  @Put('email-smtp')
  async putEmailSmtp(@Body() dto: UpdateEmailSmtpDto) {
    return this.settingsService.updateEmailSmtp(dto);
  }

  @Get('email-templates')
  async getEmailTemplates() {
    return this.settingsService.getEmailTemplates();
  }

  @Put('email-templates')
  async putEmailTemplates(@Body() dto: UpdateEmailTemplatesDto) {
    return this.settingsService.updateEmailTemplates(dto);
  }

  @Get('default-pass')
  async getDefaultPass() {
    return this.settingsService.getDefaultPass();
  }

  @Put('default-pass')
  async putDefaultPass(@Body() dto: UpdateDefaultPassDto) {
    return this.settingsService.updateDefaultPass(dto);
  }

  @Post('email-smtp/test')
  async postTest(@Body() dto: TestEmailSmtpDto) {
    return this.settingsService.testEmailSmtp(dto);
  }

  @Post('minio/orphans/scan')
  async scanMinioOrphans(
    @Body(new ZodValidationPipe(MinioOrphansScanSchema))
    dto: MinioOrphansScanDto,
  ) {
    return this.settingsService.scanMinioOrphans(dto);
  }

  @Post('minio/orphans/delete')
  async deleteMinioOrphans(
    @Body(new ZodValidationPipe(MinioOrphansDeleteSchema))
    dto: MinioOrphansDeleteDto,
  ) {
    return this.settingsService.deleteSelectedOrphans(dto);
  }
}

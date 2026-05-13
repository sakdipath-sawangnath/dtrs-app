import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('app-meta')
  async getAppMeta() {
    return this.settingsService.getAppMeta();
  }
}

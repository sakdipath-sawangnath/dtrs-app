import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsPdfService } from './jobs-pdf.service';
import { JobsController } from './jobs.controller';
import { PublicJobsController } from './public-jobs.controller';
import { JobEmailNotificationService } from './job-email-notification.service';
import { SitesModule } from '../sites/sites.module';
import { MinioModule } from '../minio/minio.module';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [SitesModule, MinioModule, EventsModule, UsersModule, SettingsModule],
    providers: [JobsService, JobsPdfService, JobEmailNotificationService],
    controllers: [JobsController, PublicJobsController],
    exports: [JobsService],
})
export class JobsModule { }

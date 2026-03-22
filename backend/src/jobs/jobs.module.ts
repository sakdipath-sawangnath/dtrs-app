import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsPdfService } from './jobs-pdf.service';
import { JobsController } from './jobs.controller';
import { PublicJobsController } from './public-jobs.controller';
import { SitesModule } from '../sites/sites.module';
import { MinioModule } from '../minio/minio.module';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [SitesModule, MinioModule, EventsModule, UsersModule],
    providers: [JobsService, JobsPdfService],
    controllers: [JobsController, PublicJobsController],
    exports: [JobsService],
})
export class JobsModule { }

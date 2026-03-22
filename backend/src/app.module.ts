import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JobsModule } from './jobs/jobs.module';
import { EventsModule } from './events/events.module';
import { MinioModule } from './minio/minio.module';
import { SitesModule } from './sites/sites.module';
import { AreasModule } from './areas/areas.module';
import { RolesModule } from './roles/roles.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute
        },
      ],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    JobsModule,
    EventsModule,
    MinioModule,
    SitesModule,
    AreasModule,
    RolesModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule { }

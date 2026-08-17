import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/permissions.guard';
import { EventsGateway } from '../src/events/events.gateway';
import { JobsController } from '../src/jobs/jobs.controller';
import { JobsPdfService } from '../src/jobs/jobs-pdf.service';
import { JobsService } from '../src/jobs/jobs.service';
import { MinioService } from '../src/minio/minio.service';
import { RolesService } from '../src/roles/roles.service';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const GIF = Buffer.from('GIF89a', 'ascii');

class AllowAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 7, role: 'STAFF' };
    return true;
  }
}

class DenyAuthGuard implements CanActivate {
  canActivate(): boolean {
    return false;
  }
}

describe('PATCH /api/jobs/:id/issue-images (e2e)', () => {
  const jobsService = {
    assertUserCanUploadIssueImages: jest.fn(),
    getNonemptyIssueImageCount: jest.fn(),
    setIssueImages: jest.fn(),
  };
  const minioService = {
    uploadJobImage: jest.fn(),
  };
  const eventsGateway = {
    notifyJobUpdate: jest.fn(),
  };

  async function createApp(opts: {
    authenticated: boolean;
  }): Promise<INestApplication> {
    const moduleFixture = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        { provide: JobsService, useValue: jobsService },
        { provide: JobsPdfService, useValue: {} },
        { provide: MinioService, useValue: minioService },
        { provide: EventsGateway, useValue: eventsGateway },
        { provide: RolesService, useValue: {} },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
        {
          provide: APP_GUARD,
          useClass: opts.authenticated ? AllowAuthGuard : DenyAuthGuard,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(opts.authenticated ? AllowAuthGuard : DenyAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jobsService.assertUserCanUploadIssueImages.mockResolvedValue(undefined);
    jobsService.getNonemptyIssueImageCount.mockResolvedValue(0);
    jobsService.setIssueImages.mockResolvedValue({
      id: 9,
      images: ['http://minio.test/jobs/9/issue/1.jpg'],
    });
    minioService.uploadJobImage.mockResolvedValue(
      'http://minio.test/jobs/9/issue/1.jpg',
    );
  });

  it('requires auth (403/401 without token)', async () => {
    const app = await createApp({ authenticated: false });
    try {
      await request(app.getHttpServer())
        .patch('/api/jobs/9/issue-images')
        .attach('images', JPEG, {
          filename: 'a.jpg',
          contentType: 'image/jpeg',
        })
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });
    } finally {
      await app.close();
    }
  });

  it('accepts JPEG and appends issue image', async () => {
    const app = await createApp({ authenticated: true });
    try {
      const res = await request(app.getHttpServer())
        .patch('/api/jobs/9/issue-images')
        .attach('images', JPEG, {
          filename: 'a.jpg',
          contentType: 'image/jpeg',
        })
        .expect(200);

      expect(jobsService.assertUserCanUploadIssueImages).toHaveBeenCalledWith(
        9,
        7,
      );
      expect(minioService.uploadJobImage).toHaveBeenCalled();
      expect(jobsService.setIssueImages).toHaveBeenCalled();
      expect(res.body?.data?.id).toBe(9);
    } finally {
      await app.close();
    }
  });

  it('rejects GIF (400)', async () => {
    const app = await createApp({ authenticated: true });
    try {
      const res = await request(app.getHttpServer())
        .patch('/api/jobs/9/issue-images')
        .attach('images', GIF, { filename: 'a.gif', contentType: 'image/gif' })
        .expect(400);
      expect(String(res.body?.error?.message ?? '')).toMatch(
        /JPG, PNG, WebP หรือ HEIC/,
      );
    } finally {
      await app.close();
    }
  });

  it('rejects when existing + new images exceed 3', async () => {
    jobsService.getNonemptyIssueImageCount.mockResolvedValue(2);
    const app = await createApp({ authenticated: true });
    try {
      const res = await request(app.getHttpServer())
        .patch('/api/jobs/9/issue-images')
        .attach('images', JPEG, {
          filename: 'a.jpg',
          contentType: 'image/jpeg',
        })
        .attach('images', JPEG, {
          filename: 'b.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);
      expect(String(res.body?.error?.message ?? '')).toMatch(/สูงสุด 3 รูป/);
    } finally {
      await app.close();
    }
  });
});

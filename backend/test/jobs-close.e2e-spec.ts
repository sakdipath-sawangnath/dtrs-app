import {
  BadRequestException,
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
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const awaitingSignatureJob = {
  id: 42,
  ticketNo: '8a72fbd7',
  status: 'IN_PROGRESS',
  fixEnvironment: 'INDOOR',
  brokenPart: 'Hardware',
  cause: 'สายหลุด',
  fixMethod: 'ต่อสายใหม่',
  fixImages: [
    'http://minio.test/jobs/42/fix/1.jpg',
    'http://minio.test/jobs/42/fix/2.jpg',
  ],
};

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

describe('PATCH /api/jobs/:id/fix and /close (e2e)', () => {
  const jobsService = {
    findAll: jest.fn(),
    assertUserCanFix: jest.fn(),
    getNonemptyFixImageCount: jest.fn(),
    saveFixInfo: jest.fn(),
    assertJobFixReadyToClose: jest.fn(),
    closeJob: jest.fn(),
    updateStatus: jest.fn(),
  };
  const minioService = {
    uploadJobImage: jest.fn(),
    uploadJobReporterSignature: jest.fn(),
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
    jobsService.assertUserCanFix.mockResolvedValue(undefined);
    jobsService.getNonemptyFixImageCount.mockResolvedValue(0);
    jobsService.saveFixInfo.mockResolvedValue(awaitingSignatureJob);
    jobsService.assertJobFixReadyToClose.mockResolvedValue(undefined);
    jobsService.closeJob.mockResolvedValue({
      ...awaitingSignatureJob,
      status: 'RESOLVED',
      reporterSignature: 'http://minio.test/jobs/42/signature.png',
    });
    jobsService.findAll.mockResolvedValue([awaitingSignatureJob]);
    minioService.uploadJobImage.mockImplementation(
      async (jobId: number, kind: string, index: number) =>
        `http://minio.test/jobs/${jobId}/${kind}/${index}.jpg`,
    );
    minioService.uploadJobReporterSignature.mockResolvedValue(
      'http://minio.test/jobs/42/signature.png',
    );
  });

  it('requires auth on /close (401/403 without token)', async () => {
    const app = await createApp({ authenticated: false });
    try {
      await request(app.getHttpServer())
        .patch('/api/jobs/42/close')
        .attach('reporterSignature', PNG, {
          filename: 'sig.png',
          contentType: 'image/png',
        })
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });
    } finally {
      await app.close();
    }
  });

  it('PATCH /fix keeps IN_PROGRESS and does not call closeJob', async () => {
    const app = await createApp({ authenticated: true });
    try {
      const res = await request(app.getHttpServer())
        .patch('/api/jobs/42/fix')
        .field('fixEnvironment', 'INDOOR')
        .field('brokenPartType', 'Hardware')
        .field('cause', 'สายหลุด')
        .field('fixMethod', 'ต่อสายใหม่')
        .attach('fixImages', JPEG, {
          filename: 'a.jpg',
          contentType: 'image/jpeg',
        })
        .attach('fixImages', JPEG, {
          filename: 'b.jpg',
          contentType: 'image/jpeg',
        })
        .expect(200);

      expect(jobsService.assertUserCanFix).toHaveBeenCalledWith(42, 7);
      expect(jobsService.saveFixInfo).toHaveBeenCalled();
      expect(jobsService.closeJob).not.toHaveBeenCalled();
      expect(res.body?.data?.status).toBe('IN_PROGRESS');
    } finally {
      await app.close();
    }
  });

  it('GET /list returns IN_PROGRESS job with complete fix fields (รอเซ็นผู้แจ้ง)', async () => {
    const app = await createApp({ authenticated: true });
    try {
      const res = await request(app.getHttpServer())
        .get('/api/jobs/list')
        .expect(200);

      const job = res.body?.data?.[0];
      expect(job.status).toBe('IN_PROGRESS');
      expect(job.fixEnvironment).toBe('INDOOR');
      expect(job.brokenPart).toBe('Hardware');
      expect(job.cause).toBe('สายหลุด');
      expect(job.fixMethod).toBe('ต่อสายใหม่');
      expect(job.fixImages).toHaveLength(2);
    } finally {
      await app.close();
    }
  });

  it('PATCH /close rejects when fix info is incomplete (before MinIO upload)', async () => {
    jobsService.assertJobFixReadyToClose.mockRejectedValue(
      new BadRequestException('กรุณาระบุสาเหตุ'),
    );
    const app = await createApp({ authenticated: true });
    try {
      const res = await request(app.getHttpServer())
        .patch('/api/jobs/42/close')
        .attach('reporterSignature', PNG, {
          filename: 'sig.png',
          contentType: 'image/png',
        })
        .expect(400);

      expect(jobsService.closeJob).not.toHaveBeenCalled();
      expect(minioService.uploadJobReporterSignature).not.toHaveBeenCalled();
      expect(String(res.body?.error?.message ?? '')).toMatch(/สาเหตุ/);
    } finally {
      await app.close();
    }
  });

  it('PATCH /close rejects when reporter signature is missing', async () => {
    const app = await createApp({ authenticated: true });
    try {
      const res = await request(app.getHttpServer())
        .patch('/api/jobs/42/close')
        .expect(400);

      expect(jobsService.closeJob).not.toHaveBeenCalled();
      expect(String(res.body?.error?.message ?? '')).toMatch(/ลายเซ็นผู้แจ้ง/);
    } finally {
      await app.close();
    }
  });

  it('PATCH /close with PNG signature sets RESOLVED', async () => {
    const app = await createApp({ authenticated: true });
    try {
      const res = await request(app.getHttpServer())
        .patch('/api/jobs/42/close')
        .attach('reporterSignature', PNG, {
          filename: 'sig.png',
          contentType: 'image/png',
        })
        .expect(200);

      expect(jobsService.assertJobFixReadyToClose).toHaveBeenCalledWith(42);
      expect(minioService.uploadJobReporterSignature).toHaveBeenCalled();
      expect(jobsService.closeJob).toHaveBeenCalledWith(
        42,
        'http://minio.test/jobs/42/signature.png',
        7,
        expect.any(String),
      );
      expect(res.body?.data?.status).toBe('RESOLVED');
    } finally {
      await app.close();
    }
  });
});

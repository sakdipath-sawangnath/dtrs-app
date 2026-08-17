import { INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { EventsGateway } from '../src/events/events.gateway';
import { JobsService } from '../src/jobs/jobs.service';
import { PublicJobsController } from '../src/jobs/public-jobs.controller';
import { MinioService } from '../src/minio/minio.service';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const GIF = Buffer.from('GIF89a', 'ascii');

const VALID_FIELDS = {
  province: 'กรุงเทพมหานคร',
  district: 'จตุจักร',
  agency: 'การรถไฟ',
  location: 'สถานีทดสอบ',
  description: 'จอ dist ดับ ไม่มีภาพ ต้องซ่อม',
  reporterName: 'ทดสอบ ผู้แจ้ง',
  reporterPhone: '0812345678',
  reporterEmail: '',
};

describe('POST /api/public/jobs upload (e2e)', () => {
  let app: INestApplication;
  const jobsService = {
    createFromPublicReport: jest.fn(),
    updateImages: jest.fn(),
  };
  const minioService = {
    uploadJobImage: jest.fn(),
  };
  const eventsGateway = {
    notifyNewJob: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [PublicJobsController],
      providers: [
        { provide: JobsService, useValue: jobsService },
        { provide: MinioService, useValue: minioService },
        { provide: EventsGateway, useValue: eventsGateway },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jobsService.createFromPublicReport.mockResolvedValue({
      id: 42,
      ticketNo: 'deadbeef',
    });
    jobsService.updateImages.mockImplementation(
      async (_id: number, urls: string[]) => ({
        id: 42,
        ticketNo: 'deadbeef',
        images: urls,
      }),
    );
    minioService.uploadJobImage.mockResolvedValue(
      'http://minio.test/jobs/42/issue/1.jpg',
    );
  });

  function attachFields(req: request.Test): request.Test {
    for (const [key, value] of Object.entries(VALID_FIELDS)) {
      req.field(key, value);
    }
    return req;
  }

  it('accepts JPEG issue image and uploads to MinIO', async () => {
    const res = await attachFields(
      request(app.getHttpServer()).post('/api/public/jobs'),
    )
      .attach('images', JPEG, {
        filename: 'issue.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(jobsService.createFromPublicReport).toHaveBeenCalled();
    expect(minioService.uploadJobImage).toHaveBeenCalledTimes(1);
    expect(jobsService.updateImages).toHaveBeenCalledWith(42, [
      'http://minio.test/jobs/42/issue/1.jpg',
    ]);
    expect(res.body?.data?.ticketNo).toBe('deadbeef');
  });

  it('rejects GIF with Thai type error (400)', async () => {
    const res = await attachFields(
      request(app.getHttpServer()).post('/api/public/jobs'),
    )
      .attach('images', GIF, { filename: 'x.gif', contentType: 'image/gif' })
      .expect(400);

    expect(minioService.uploadJobImage).not.toHaveBeenCalled();
    expect(String(res.body?.error?.message ?? res.body?.message)).toMatch(
      /JPG, PNG, WebP หรือ HEIC/,
    );
  });

  it('rejects file over 5MB via Multer LIMIT_FILE_SIZE (400)', async () => {
    const huge = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);
    huge[0] = 0xff;
    huge[1] = 0xd8;
    huge[2] = 0xff;
    const res = await attachFields(
      request(app.getHttpServer()).post('/api/public/jobs'),
    )
      .attach('images', huge, {
        filename: 'big.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);

    expect(String(res.body?.error?.message ?? '')).toMatch(/5MB/);
  });

  it('rejects more than 3 issue images (400)', async () => {
    let req = attachFields(
      request(app.getHttpServer()).post('/api/public/jobs'),
    );
    for (let i = 0; i < 4; i++) {
      req = req.attach('images', JPEG, {
        filename: `n${i}.jpg`,
        contentType: 'image/jpeg',
      });
    }
    const res = await req.expect(400);
    expect(String(res.body?.error?.message ?? '')).toMatch(/3 รูป/);
  });
});

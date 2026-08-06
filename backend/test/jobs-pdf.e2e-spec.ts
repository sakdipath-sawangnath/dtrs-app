import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JobsPdfService } from '../src/jobs/jobs-pdf.service';

describe('Jobs PDF routes (e2e)', () => {
  let app: INestApplication<App>;
  const mockPdf = Buffer.from('%PDF-1.4 e2e-mock');

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JobsPdfService)
      .useValue({
        generateReportPdf: jest.fn().mockResolvedValue(mockPdf),
        generateDashboardSummaryPdf: jest.fn().mockResolvedValue({
          buffer: mockPdf,
          filename: 'dashboard-summary-test.pdf',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-BE-02: GET /api/jobs/:id/report-pdf requires auth (401 without token)', () => {
    return request(app.getHttpServer())
      .get('/api/jobs/1/report-pdf')
      .expect(401);
  });

  it('TC-BE-04: GET /api/jobs/reports/summary-pdf requires auth (401 without token)', () => {
    return request(app.getHttpServer())
      .get('/api/jobs/reports/summary-pdf?periodType=month&month=2026-01')
      .expect(401);
  });
});

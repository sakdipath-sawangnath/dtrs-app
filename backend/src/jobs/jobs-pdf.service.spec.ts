import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { JobsPdfService } from './jobs-pdf.service';

jest.mock('puppeteer-core', () => ({
  __esModule: true,
  default: {
    launch: jest.fn(),
  },
}));

// jest.mock is hoisted — get the mock via requireMock (not outer const in factory)
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- jest mock shape
const launchMock: jest.Mock = jest.requireMock('puppeteer-core').default.launch;

describe('JobsPdfService (puppeteer-core / PDF)', () => {
  let service: JobsPdfService;
  let prisma: { job: { findUnique: jest.Mock; findMany: jest.Mock } };
  let rolesService: { getPermissionsForUser: jest.Mock };

  const mockPdfBytes = Buffer.from('%PDF-1.4 mock');
  const mockPage = {
    setExtraHTTPHeaders: jest.fn(),
    goto: jest.fn(),
    setContent: jest.fn(),
    emulateMediaType: jest.fn(),
    pdf: jest.fn().mockResolvedValue(mockPdfBytes),
  };
  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    launchMock.mockResolvedValue(mockBrowser);

    prisma = {
      job: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    rolesService = {
      getPermissionsForUser: jest
        .fn()
        .mockResolvedValue(['menu.dashboard', 'job.viewContractTabs']),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsPdfService,
        { provide: PrismaService, useValue: prisma },
        { provide: RolesService, useValue: rolesService },
      ],
    }).compile();

    service = module.get(JobsPdfService);
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
    delete process.env.FRONTEND_BASE_URL;
  });

  describe('generateReportPdf (TC-BE-02)', () => {
    it('throws BadRequestException when jwt is empty', async () => {
      await expect(service.generateReportPdf(1, '')).rejects.toThrow(
        BadRequestException,
      );
      expect(launchMock).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when job missing', async () => {
      prisma.job.findUnique.mockResolvedValue(null);
      await expect(service.generateReportPdf(99, 'token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when job is not RESOLVED', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 1, status: 'PENDING' });
      await expect(service.generateReportPdf(1, 'token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns PDF buffer via puppeteer-core when job is RESOLVED', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 5, status: 'RESOLVED' });
      process.env.FRONTEND_BASE_URL = 'http://frontend:3000';

      const result = await service.generateReportPdf(5, 'jwt-token');

      expect(result.subarray(0, 4).toString()).toBe('%PDF');
      expect(launchMock).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith(
        'http://frontend:3000/print/jobs/5',
        expect.any(Object),
      );
      expect(mockPage.setExtraHTTPHeaders).toHaveBeenCalledWith({
        Authorization: 'Bearer jwt-token',
      });
      expect(mockPage.emulateMediaType).toHaveBeenCalledWith('print');
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('generateDashboardSummaryPdf (TC-BE-04)', () => {
    it('returns PDF buffer and filename for month period', async () => {
      const { buffer, filename } = await service.generateDashboardSummaryPdf(
        {
          periodType: 'month',
          month: '2026-01',
        },
        1,
      );

      expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
      expect(filename).toMatch(/^dashboard-summary-/);
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'A4', printBackground: true }),
      );
      expect(mockBrowser.close).toHaveBeenCalled();
      const html = String(mockPage.setContent.mock.calls[0][0]);
      expect(html).toContain('นอกสัญญา');
    });

    it('excludes out-of-contract jobs and KPI without job.viewContractTabs', async () => {
      rolesService.getPermissionsForUser.mockResolvedValue(['menu.dashboard']);

      await service.generateDashboardSummaryPdf(
        { periodType: 'month', month: '2026-01' },
        42,
      );

      expect(rolesService.getPermissionsForUser).toHaveBeenCalledWith(42);
      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: { isOutOfContract: true },
          }),
        }),
      );
      const html = String(mockPage.setContent.mock.calls[0][0]);
      expect(html).not.toContain('>นอกสัญญา<');
    });

    it('throws BadRequestException for invalid month', async () => {
      await expect(
        service.generateDashboardSummaryPdf(
          {
            periodType: 'month',
            month: 'invalid',
          },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('puppeteer-core launch (TC-BE-06)', () => {
    it('passes no-sandbox args when launching browser', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 1, status: 'RESOLVED' });

      await service.generateDashboardSummaryPdf(
        {
          periodType: 'year',
          year: '2026',
        },
        1,
      );

      expect(launchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          headless: true,
          args: expect.arrayContaining([
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ]),
        }),
      );
    });
  });
});

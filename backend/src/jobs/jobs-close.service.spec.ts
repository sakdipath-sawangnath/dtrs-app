import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus } from '@prisma/client';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { SitesService } from '../sites/sites.service';
import { UsersService } from '../users/users.service';
import { MinioService } from '../minio/minio.service';
import { JobEmailNotificationService } from './job-email-notification.service';
import { RolesService } from '../roles/roles.service';

describe('JobsService saveFixInfo / closeJob', () => {
  let service: JobsService;
  let jobFindUnique: jest.Mock;
  let jobUpdate: jest.Mock;
  let notifyClosed: jest.Mock;
  let assertHasStaffSignature: jest.Mock;

  const inProgressRow = {
    status: JobStatus.IN_PROGRESS,
    assignedToId: 7,
  };

  const readyToCloseRow = {
    ...inProgressRow,
    fixEnvironment: 'INDOOR',
    brokenPart: 'Hardware',
    cause: 'สายหลุด',
    fixMethod: 'ต่อสายใหม่',
    fixImages: [
      'https://example.invalid/1.jpg',
      'https://example.invalid/2.jpg',
    ],
  };

  const savedJob = {
    id: 42,
    status: JobStatus.IN_PROGRESS,
    assignedTo: null,
    assignedBy: null,
    reporter: null,
  };

  beforeEach(async () => {
    jobFindUnique = jest.fn();
    jobUpdate = jest.fn();
    notifyClosed = jest.fn();
    assertHasStaffSignature = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: {
            job: {
              findUnique: jobFindUnique,
              update: jobUpdate,
            },
          },
        },
        { provide: SitesService, useValue: {} },
        {
          provide: UsersService,
          useValue: { assertHasStaffSignature },
        },
        {
          provide: MinioService,
          useValue: {
            rewriteStorageUrlForClient: (url: string | null | undefined) =>
              url ?? null,
          },
        },
        {
          provide: JobEmailNotificationService,
          useValue: { notifyClosed },
        },
        { provide: RolesService, useValue: {} },
      ],
    }).compile();

    service = module.get(JobsService);
  });

  describe('saveFixInfo', () => {
    it('keeps IN_PROGRESS and does not notify closed', async () => {
      jobFindUnique
        .mockResolvedValueOnce(inProgressRow)
        .mockResolvedValueOnce(savedJob);
      jobUpdate.mockResolvedValue({});

      const result = await service.saveFixInfo(42, {
        brokenPartType: 'Hardware',
        fixEnvironment: 'INDOOR',
        cause: 'สายหลุด',
        fixMethod: 'ต่อสายใหม่',
        actorUserId: 7,
      });

      expect(result.status).toBe(JobStatus.IN_PROGRESS);
      expect(jobUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            status: JobStatus.RESOLVED,
          }),
        }),
      );
      expect(notifyClosed).not.toHaveBeenCalled();
    });
  });

  describe('assertJobFixReadyToClose', () => {
    it('rejects when cause is missing', async () => {
      jobFindUnique.mockResolvedValue({
        ...readyToCloseRow,
        cause: '  ',
      });

      await expect(service.assertJobFixReadyToClose(42)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('closeJob', () => {
    it('sets RESOLVED and notifies closed when fix data is complete', async () => {
      const closedJob = { ...savedJob, status: JobStatus.RESOLVED };
      jobFindUnique
        .mockResolvedValueOnce(readyToCloseRow)
        .mockResolvedValueOnce(closedJob);
      jobUpdate.mockResolvedValue({ id: 42, status: JobStatus.RESOLVED });

      const result = await service.closeJob(
        42,
        'https://example.invalid/sig.png',
        7,
        'jwt',
      );

      expect(result.status).toBe(JobStatus.RESOLVED);
      expect(jobUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: JobStatus.RESOLVED,
            reporterSignature: 'https://example.invalid/sig.png',
          }),
        }),
      );
      expect(notifyClosed).toHaveBeenCalledWith(42, 'jwt');
    });

    it('does not close when signature url is empty', async () => {
      jobFindUnique.mockResolvedValue(readyToCloseRow);

      await expect(service.closeJob(42, '  ', 7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(jobUpdate).not.toHaveBeenCalled();
      expect(notifyClosed).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('rejects RESOLVED and points callers to PATCH /close', async () => {
      jobFindUnique.mockResolvedValue({
        status: JobStatus.IN_PROGRESS,
        assignedToId: 7,
      });

      await expect(service.updateStatus(42, 'RESOLVED')).rejects.toThrow(
        /PATCH \/jobs\/:id\/close/,
      );
    });
  });
});

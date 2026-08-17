import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JobStatus } from '@prisma/client';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { SitesService } from '../sites/sites.service';
import { UsersService } from '../users/users.service';
import { MinioService } from '../minio/minio.service';
import { JobEmailNotificationService } from './job-email-notification.service';
import { RolesService } from '../roles/roles.service';

describe('JobsService issue images helpers (Meeting Phase D)', () => {
  /** เรียก method ผ่าน prototype โดยไม่ต้อง bootstrap Nest DI ทั้งก้อน */
  const count = (images: unknown) =>
    JobsService.prototype.countNonemptyIssueImages.call(
      {} as JobsService,
      images,
    );

  it('counts nonempty string URLs only', () => {
    expect(count(['a', '', '  ', 'b', null, 1])).toBe(2);
  });

  it('returns 0 for non-array', () => {
    expect(count(null)).toBe(0);
    expect(count(undefined)).toBe(0);
    expect(count({ url: 'x' })).toBe(0);
  });
});

describe('JobsService issue image upload (job.issue.upload)', () => {
  let service: JobsService;
  let prisma: {
    job: { findUnique: jest.Mock; update: jest.Mock };
  };
  let rolesService: { getPermissionsForUser: jest.Mock };

  beforeEach(async () => {
    prisma = {
      job: { findUnique: jest.fn(), update: jest.fn() },
    };
    rolesService = { getPermissionsForUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SitesService, useValue: {} },
        { provide: UsersService, useValue: {} },
        {
          provide: MinioService,
          useValue: {
            rewriteStorageUrlForClient: (url?: string) => url,
          },
        },
        { provide: JobEmailNotificationService, useValue: {} },
        { provide: RolesService, useValue: rolesService },
      ],
    }).compile();

    service = module.get(JobsService);
  });

  describe('assertUserCanUploadIssueImages', () => {
    it('throws Forbidden when permission missing', async () => {
      rolesService.getPermissionsForUser.mockResolvedValue(['job.fix.self']);
      await expect(
        service.assertUserCanUploadIssueImages(1, 9),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.job.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFound when job missing', async () => {
      rolesService.getPermissionsForUser.mockResolvedValue([
        'job.issue.upload',
      ]);
      prisma.job.findUnique.mockResolvedValue(null);
      await expect(
        service.assertUserCanUploadIssueImages(99, 7),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequest when status is RESOLVED', async () => {
      rolesService.getPermissionsForUser.mockResolvedValue([
        'job.issue.upload',
      ]);
      prisma.job.findUnique.mockResolvedValue({
        id: 1,
        status: JobStatus.RESOLVED,
      });
      await expect(
        service.assertUserCanUploadIssueImages(1, 7),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when status is CANCELLED', async () => {
      rolesService.getPermissionsForUser.mockResolvedValue([
        'job.issue.upload',
      ]);
      prisma.job.findUnique.mockResolvedValue({
        id: 1,
        status: JobStatus.CANCELLED,
      });
      await expect(
        service.assertUserCanUploadIssueImages(1, 7),
      ).rejects.toThrow(/รอดำเนินการหรือกำลังแก้ไข/);
    });

    it('allows PENDING with job.issue.upload even if unassigned', async () => {
      rolesService.getPermissionsForUser.mockResolvedValue([
        'job.issue.upload',
      ]);
      prisma.job.findUnique.mockResolvedValue({
        id: 568,
        status: JobStatus.PENDING,
      });
      await expect(
        service.assertUserCanUploadIssueImages(568, 7),
      ).resolves.toBeUndefined();
    });

    it('allows IN_PROGRESS with job.issue.upload', async () => {
      rolesService.getPermissionsForUser.mockResolvedValue([
        'job.issue.upload',
      ]);
      prisma.job.findUnique.mockResolvedValue({
        id: 2,
        status: JobStatus.IN_PROGRESS,
      });
      await expect(
        service.assertUserCanUploadIssueImages(2, 7),
      ).resolves.toBeUndefined();
    });
  });

  describe('setIssueImages', () => {
    it('appends URLs and caps at 3', async () => {
      prisma.job.findUnique.mockResolvedValue({
        id: 1,
        images: ['https://minio/a.jpg', 'https://minio/b.jpg'],
      });
      prisma.job.update.mockResolvedValue({
        id: 1,
        images: [
          'https://minio/a.jpg',
          'https://minio/b.jpg',
          'https://minio/c.jpg',
        ],
        assignedTo: null,
        assignedBy: null,
        reporter: null,
      });

      const result = await service.setIssueImages(1, [
        'https://minio/c.jpg',
        'https://minio/d.jpg',
      ]);

      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            images: [
              'https://minio/a.jpg',
              'https://minio/b.jpg',
              'https://minio/c.jpg',
            ],
          },
        }),
      );
      expect(result.images).toHaveLength(3);
    });

    it('treats null images as empty then appends', async () => {
      prisma.job.findUnique.mockResolvedValue({ id: 1, images: null });
      prisma.job.update.mockResolvedValue({
        id: 1,
        images: ['https://minio/a.jpg'],
        assignedTo: null,
        assignedBy: null,
        reporter: null,
      });

      await service.setIssueImages(1, ['https://minio/a.jpg']);
      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { images: ['https://minio/a.jpg'] },
        }),
      );
    });
  });
});

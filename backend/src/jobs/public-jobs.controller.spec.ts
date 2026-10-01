import { Test, TestingModule } from '@nestjs/testing';
import { PublicJobsController } from './public-jobs.controller';
import { JobsService } from './jobs.service';
import { MinioService } from '../minio/minio.service';
import { EventsGateway } from '../events/events.gateway';
import { RolesService } from '../roles/roles.service';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';

describe('PublicJobsController & OOC Access Security', () => {
  let controller: PublicJobsController;
  let jobsService: Partial<JobsService>;
  let rolesService: Partial<RolesService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    jobsService = {
      findByTicketNoForStatus: jest.fn(),
      findByReporterPhoneForStatusList: jest.fn(),
      createFromPublicReport: jest.fn(),
      updateImages: jest.fn(),
    };

    rolesService = {
      getPermissionsForUser: jest.fn(),
    };

    jwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicJobsController],
      providers: [
        { provide: JobsService, useValue: jobsService },
        { provide: MinioService, useValue: {} },
        { provide: EventsGateway, useValue: { notifyNewJob: jest.fn() } },
        { provide: RolesService, useValue: rolesService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    controller = module.get<PublicJobsController>(PublicJobsController);
  });

  describe('getStatusPublic', () => {
    it('returns 404 NotFoundException when ticket is out-of-contract or not found', async () => {
      (jobsService.findByTicketNoForStatus as jest.Mock).mockResolvedValue(null);

      await expect(controller.getStatusPublic('RQ-OOC-20260001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns masked job detail for valid in-contract job', async () => {
      const mockJob = {
        id: 10,
        ticketNo: 'RQ-CM-20260001',
        detailLevel: 'masked',
      };
      (jobsService.findByTicketNoForStatus as jest.Mock).mockResolvedValue(mockJob);

      const result = await controller.getStatusPublic('RQ-CM-20260001');
      expect(result).toEqual(mockJob);
    });
  });

  describe('createReport with isOutOfContract flag', () => {
    it('throws ForbiddenException when anonymous user submits isOutOfContract: true', async () => {
      const mockReq = {
        headers: {},
      } as unknown as Request;

      const dto = {
        isOutOfContract: 'true',
        description: 'Test OOC problem description',
        reporterName: 'Attacker',
        reporterPhone: '0812345678',
      };

      await expect(controller.createReport(mockReq, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when authenticated user lacks menu.outOfContract permission', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      } as unknown as Request;

      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 99 });
      (rolesService.getPermissionsForUser as jest.Mock).mockResolvedValue([
        'menu.profile',
        'menu.report',
      ]);

      const dto = {
        isOutOfContract: true,
        description: 'Test OOC problem description',
        reporterName: 'Regular User',
        reporterPhone: '0812345678',
      };

      await expect(controller.createReport(mockReq, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows creation when authenticated user has menu.outOfContract permission', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer valid-staff-token',
        },
      } as unknown as Request;

      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 1 });
      (rolesService.getPermissionsForUser as jest.Mock).mockResolvedValue([
        'menu.outOfContract',
      ]);

      const mockCreated = { id: 101, requestTicketNo: 'RQ-OOC-20260001' };
      (jobsService.createFromPublicReport as jest.Mock).mockResolvedValue(mockCreated);

      const dto = {
        isOutOfContract: true,
        description: 'Authorized OOC problem description',
        reporterName: 'Staff Member',
        reporterPhone: '0812345678',
      };

      const result = await controller.createReport(mockReq, dto);
      expect(result).toEqual(mockCreated);
    });
  });
});

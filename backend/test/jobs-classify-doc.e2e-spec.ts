import {
  BadRequestException,
  CanActivate,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/permissions.guard';
import { PERMISSIONS_KEY } from '../src/auth/permissions.decorator';
import { EventsGateway } from '../src/events/events.gateway';
import { MinioService } from '../src/minio/minio.service';
import { RolesService } from '../src/roles/roles.service';
import { JobsController } from '../src/jobs/jobs.controller';
import { PublicJobsController } from '../src/jobs/public-jobs.controller';
import { JobsPdfService } from '../src/jobs/jobs-pdf.service';
import { JobsService } from '../src/jobs/jobs.service';
import { JobEmailNotificationService } from '../src/jobs/job-email-notification.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { SitesService } from '../src/sites/sites.service';
import { UsersService } from '../src/users/users.service';
import {
  bangkokYearMonth,
  isFormalDocTicketNo,
} from '../src/jobs/doc-ticket-no';

const ADMIN_ID = 7;
const STAFF_ID = 9;
const HEX_TICKET = 'a1b2c3d4';

class FakeJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = String(req.headers.authorization ?? '');
    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = header.slice(7).trim();
    if (token === 'admin') {
      req.user = { id: ADMIN_ID, role: 'ADMIN' };
      return true;
    }
    if (token === 'staff') {
      req.user = { id: STAFF_ID, role: 'STAFF' };
      return true;
    }
    throw new UnauthorizedException();
  }
}

class FakePermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const required = Reflect.getMetadata(
      PERMISSIONS_KEY,
      context.getHandler(),
    ) as string[] | undefined;
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest();
    const role = String(req.user?.role ?? '').toUpperCase();
    const codes =
      role === 'ADMIN' || role === 'SUPERVISOR'
        ? ['job.classifyDoc', 'job.updateStatus']
        : [];
    if (required.some((code) => !codes.includes(code))) {
      throw new ForbiddenException('ไม่มีสิทธิ์ดำเนินการ');
    }
    return true;
  }
}

const publicReportBody = {
  province: 'สงขลา',
  district: 'หาดใหญ่',
  agency: 'ที่ทำการบ้านผู้ใหญ่บ้าน',
  location: 'หมู่ 1 สถานีทดสอบ',
  description: 'รายละเอียดปัญหาอย่างน้อยสิบตัวอักษร',
  reporterName: 'ผู้แจ้ง',
  reporterPhone: '0812345678',
  reporterEmail: '',
};

describe('Jobs Doc No / classify-doc (e2e HTTP)', () => {
  let app: INestApplication<App>;
  let jobsService: {
    createFromPublicReport: jest.Mock;
    assignStaff: jest.Mock;
    moveToOutOfContract: jest.Mock;
    classifyDoc: jest.Mock;
    updateStatus: jest.Mock;
    updateImages: jest.Mock;
  };

  beforeAll(async () => {
    jobsService = {
      createFromPublicReport: jest.fn().mockResolvedValue({
        id: 101,
        ticketNo: HEX_TICKET,
        status: 'PENDING',
        isOutOfContract: false,
      }),
      assignStaff: jest
        .fn()
        .mockImplementation(async (id: number, staffId: number) => ({
          id,
          ticketNo: HEX_TICKET,
          assignedToId: staffId,
          status: 'IN_PROGRESS',
        })),
      moveToOutOfContract: jest
        .fn()
        .mockImplementation(async (id: number, isOutOfContract: boolean) => ({
          id,
          ticketNo: HEX_TICKET,
          isOutOfContract,
          status: 'PENDING',
        })),
      classifyDoc: jest
        .fn()
        .mockImplementation(async (id: number, isOutOfContract: boolean) => {
          if (id === 11) {
            throw new BadRequestException(
              'จำแนกเอกสารได้เฉพาะงานสถานะเสร็จสิ้น (RESOLVED)',
            );
          }
          if (id === 12) {
            throw new ConflictException('งานนี้จำแนกเอกสารแล้ว');
          }
          return {
            id,
            ticketNo: isOutOfContract
              ? `${bangkokYearMonth()}0001`
              : 'CM-SHF-2002-0001',
            isOutOfContract,
            status: 'RESOLVED',
          };
        }),
      updateStatus: jest
        .fn()
        .mockImplementation(async (_id: number, status: string) => {
          if (status === 'RESOLVED') {
            throw new BadRequestException(
              'ปิดงานกรุณาใช้ PATCH /jobs/:id/close พร้อมลายเซ็นผู้แจ้ง — ไม่รองรับการตั้ง RESOLVED ผ่านเปลี่ยนสถานะโดยตรง',
            );
          }
          return { id: 10, status };
        }),
      updateImages: jest.fn(),
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [JobsController, PublicJobsController],
      providers: [
        { provide: JobsService, useValue: jobsService },
        { provide: JobsPdfService, useValue: {} },
        { provide: MinioService, useValue: { uploadJobImage: jest.fn() } },
        {
          provide: EventsGateway,
          useValue: { notifyJobUpdate: jest.fn(), notifyNewJob: jest.fn() },
        },
        {
          provide: RolesService,
          useValue: {
            getPermissionsForUser: jest.fn(async (userId: number) =>
              userId === ADMIN_ID
                ? ['job.assign', 'job.classifyDoc']
                : ['menu.pending'],
            ),
          },
        },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useClass(FakePermissionsGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/public/jobs creates with hex ticketNo (not Running Doc No)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/jobs')
      .send(publicReportBody)
      .expect(201);

    expect(jobsService.createFromPublicReport).toHaveBeenCalled();
    expect(res.body.data.ticketNo).toBe(HEX_TICKET);
    expect(isFormalDocTicketNo(res.body.data.ticketNo)).toBe(false);
  });

  it('PATCH /api/jobs/:id/assign keeps hex ticketNo (does not generate Doc No)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/jobs/101/assign')
      .set('Authorization', 'Bearer admin')
      .send({ staffId: 3 })
      .expect(200);

    expect(jobsService.assignStaff).toHaveBeenCalledWith(101, 3, ADMIN_ID);
    expect(res.body.data.ticketNo).toBe(HEX_TICKET);
    expect(isFormalDocTicketNo(res.body.data.ticketNo)).toBe(false);
  });

  it('PATCH /api/jobs/:id/out-of-contract keeps hex ticketNo', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/jobs/101/out-of-contract')
      .set('Authorization', 'Bearer admin')
      .send({ isOutOfContract: true })
      .expect(200);

    expect(jobsService.moveToOutOfContract).toHaveBeenCalledWith(
      101,
      true,
      ADMIN_ID,
    );
    expect(res.body.data.ticketNo).toBe(HEX_TICKET);
  });

  it('PATCH /api/jobs/:id/classify-doc in-contract → CM-SHF-2002- running', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/jobs/10/classify-doc')
      .set('Authorization', 'Bearer admin')
      .send({ isOutOfContract: false })
      .expect(200);

    expect(jobsService.classifyDoc).toHaveBeenCalledWith(10, false, ADMIN_ID);
    expect(res.body.data.ticketNo).toBe('CM-SHF-2002-0001');
    expect(isFormalDocTicketNo(res.body.data.ticketNo)).toBe(true);
  });

  it('PATCH /api/jobs/:id/classify-doc out-of-contract → YYYYMM running', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/jobs/10/classify-doc')
      .set('Authorization', 'Bearer admin')
      .send({ isOutOfContract: true })
      .expect(200);

    expect(jobsService.classifyDoc).toHaveBeenCalledWith(10, true, ADMIN_ID);
    expect(res.body.data.ticketNo).toMatch(/^\d{10,}$/);
    expect(res.body.data.ticketNo.startsWith(bangkokYearMonth())).toBe(true);
    expect(isFormalDocTicketNo(res.body.data.ticketNo)).toBe(true);
  });

  it('classify-doc on non-RESOLVED → 400', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/jobs/11/classify-doc')
      .set('Authorization', 'Bearer admin')
      .send({ isOutOfContract: false })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(String(res.body.error.message)).toMatch(/RESOLVED|เสร็จสิ้น/);
  });

  it('classify-doc when already classified → 409', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/jobs/12/classify-doc')
      .set('Authorization', 'Bearer admin')
      .send({ isOutOfContract: false })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(String(res.body.error.message)).toMatch(/จำแนกเอกสารแล้ว/);
  });

  it('classify-doc without JWT → 401', async () => {
    await request(app.getHttpServer())
      .patch('/api/jobs/10/classify-doc')
      .send({ isOutOfContract: false })
      .expect(401);

    expect(jobsService.classifyDoc).not.toHaveBeenCalled();
  });

  it('classify-doc without job.classifyDoc (STAFF) → 403', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/jobs/10/classify-doc')
      .set('Authorization', 'Bearer staff')
      .send({ isOutOfContract: false })
      .expect(403);

    expect(jobsService.classifyDoc).not.toHaveBeenCalled();
    expect(String(res.body.error.message)).toMatch(/ไม่มีสิทธิ์/);
  });

  it('classify-doc missing isOutOfContract → 400', async () => {
    await request(app.getHttpServer())
      .patch('/api/jobs/10/classify-doc')
      .set('Authorization', 'Bearer admin')
      .send({})
      .expect(400);

    expect(jobsService.classifyDoc).not.toHaveBeenCalled();
  });

  it('PATCH /api/jobs/:id/status RESOLVED is blocked', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/jobs/10/status')
      .set('Authorization', 'Bearer admin')
      .send({ status: 'RESOLVED' })
      .expect(400);

    expect(jobsService.updateStatus).toHaveBeenCalledWith(
      10,
      'RESOLVED',
      'admin',
    );
    expect(String(res.body.error.message)).toMatch(/close|RESOLVED/);
  });
});

describe('JobsService Doc No (create / assign / classify)', () => {
  let service: JobsService;
  let prisma: {
    job: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let usersService: {
    assertHasStaffSignature: jest.Mock;
    findByPhone: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      job: {
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: 1,
          status: 'PENDING',
          ...data,
        })),
      },
      $transaction: jest.fn(),
    };
    usersService = {
      assertHasStaffSignature: jest.fn().mockResolvedValue(undefined),
      findByPhone: jest.fn().mockResolvedValue(null),
    };

    service = new JobsService(
      prisma as unknown as PrismaService,
      { findByLocation: jest.fn() } as unknown as SitesService,
      usersService as unknown as UsersService,
      {
        rewriteStorageUrlForClient: (u?: string) => u,
      } as unknown as MinioService,
      {
        notifyReported: jest.fn(),
        notifyAssigned: jest.fn(),
      } as unknown as JobEmailNotificationService,
      {} as unknown as RolesService,
    );
  });

  it('create() assigns hex 8-char ticketNo and ignores client ticketNo', async () => {
    const created = await service.create({
      description: 'รายละเอียดปัญหาอย่างน้อยสิบตัวอักษร',
      reporterName: 'ผู้แจ้ง',
      reporterPhone: '0812345678',
      ticketNo: 'CM-SHF-2002-9999',
    } as never);

    expect(prisma.job.create).toHaveBeenCalled();
    const saved = prisma.job.create.mock.calls[0][0].data;
    expect(saved.ticketNo).toMatch(/^[0-9a-f]{8}$/);
    expect(saved.ticketNo).not.toBe('CM-SHF-2002-9999');
    expect(isFormalDocTicketNo(created.ticketNo)).toBe(false);
  });

  it('assignStaff() does not write ticketNo', async () => {
    const tx = {
      job: {
        findUnique: jest.fn().mockResolvedValue({
          assignedToId: null,
          status: 'PENDING',
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 5,
          ticketNo: HEX_TICKET,
          ...data,
        })),
      },
    };
    prisma.$transaction.mockImplementation(
      async (fn: (t: typeof tx) => unknown) => fn(tx),
    );

    const updated = await service.assignStaff(5, 3, ADMIN_ID);

    expect(usersService.assertHasStaffSignature).toHaveBeenCalledWith(ADMIN_ID);
    expect(tx.job.update.mock.calls[0][0].data.ticketNo).toBeUndefined();
    expect(updated.ticketNo).toBe(HEX_TICKET);
  });

  it('moveToOutOfContract() does not write ticketNo', async () => {
    const tx = {
      job: {
        findUnique: jest.fn().mockResolvedValue({
          id: 5,
          status: 'PENDING',
          ticketNo: HEX_TICKET,
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 5,
          ticketNo: HEX_TICKET,
          status: 'PENDING',
          ...data,
        })),
      },
    };
    prisma.$transaction.mockImplementation(
      async (fn: (t: typeof tx) => unknown) => fn(tx),
    );

    const updated = await service.moveToOutOfContract(5, true, ADMIN_ID);

    expect(tx.job.update.mock.calls[0][0].data.ticketNo).toBeUndefined();
    expect(updated.ticketNo).toBe(HEX_TICKET);
    expect(updated.isOutOfContract).toBe(true);
  });

  it('classifyDoc() in-contract replaces hex with CM-SHF-2002- running', async () => {
    const tx = {
      job: {
        findUnique: jest.fn().mockImplementation(async ({ where }) => {
          if (where.id === 10) {
            return { id: 10, status: 'RESOLVED', ticketNo: HEX_TICKET };
          }
          if (where.ticketNo) return null;
          return null;
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 10,
          status: 'RESOLVED',
          ...data,
        })),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ lastValue: 0 }]),
    };
    prisma.$transaction.mockImplementation(
      async (fn: (t: typeof tx) => unknown) => fn(tx),
    );

    const updated = await service.classifyDoc(10, false, ADMIN_ID);

    expect(updated.ticketNo).toBe('CM-SHF-2002-0001');
    expect(updated.isOutOfContract).toBe(false);
    expect(isFormalDocTicketNo(updated.ticketNo)).toBe(true);
  });

  it('classifyDoc() out-of-contract uses YYYYMM + running', async () => {
    const tx = {
      job: {
        findUnique: jest.fn().mockImplementation(async ({ where }) => {
          if (where.id === 10) {
            return { id: 10, status: 'RESOLVED', ticketNo: HEX_TICKET };
          }
          if (where.ticketNo) return null;
          return null;
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: 10,
          status: 'RESOLVED',
          ...data,
        })),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ lastValue: 0 }]),
    };
    prisma.$transaction.mockImplementation(
      async (fn: (t: typeof tx) => unknown) => fn(tx),
    );

    const updated = await service.classifyDoc(10, true, ADMIN_ID);

    expect(updated.ticketNo).toBe(`${bangkokYearMonth()}0001`);
    expect(updated.isOutOfContract).toBe(true);
  });

  it('classifyDoc() rejects non-RESOLVED', async () => {
    const tx = {
      job: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          status: 'PENDING',
          ticketNo: HEX_TICKET,
        }),
        update: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(
      async (fn: (t: typeof tx) => unknown) => fn(tx),
    );

    await expect(
      service.classifyDoc(10, false, ADMIN_ID),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.job.update).not.toHaveBeenCalled();
  });

  it('classifyDoc() rejects when already classified', async () => {
    const tx = {
      job: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          status: 'RESOLVED',
          ticketNo: 'CM-SHF-2002-0007',
        }),
        update: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(
      async (fn: (t: typeof tx) => unknown) => fn(tx),
    );

    await expect(
      service.classifyDoc(10, false, ADMIN_ID),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.job.update).not.toHaveBeenCalled();
  });
});

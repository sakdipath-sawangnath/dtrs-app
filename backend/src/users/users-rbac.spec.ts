import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { RolesService } from '../roles/roles.service';
import { Role } from '../common/role.constants';

describe('UsersService RBAC / last ADMIN', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      count: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: MinioService, useValue: {} },
        { provide: RolesService, useValue: {} },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('blocks deleting the last built-in ADMIN', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: Role.ADMIN });
    prisma.user.count.mockResolvedValue(1);

    await expect(service.remove(1)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('allows deleting an ADMIN when another ADMIN remains', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: Role.ADMIN });
    prisma.user.count.mockResolvedValue(2);
    prisma.user.delete.mockResolvedValue({});

    await expect(service.remove(1)).resolves.toEqual({ ok: true });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('allows deleting ADMIN_1 without the last-ADMIN guard', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 8, role: 'ADMIN_1' });
    prisma.user.delete.mockResolvedValue({});

    await expect(service.remove(8)).resolves.toEqual({ ok: true });
    expect(prisma.user.count).not.toHaveBeenCalled();
  });
});

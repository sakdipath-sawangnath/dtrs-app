import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { RolesService } from '../roles/roles.service';

describe('UsersService signature gate (Meeting Phase E)', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock } };
  let rolesService: { getPermissionsForUser: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
    };
    rolesService = { getPermissionsForUser: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: MinioService, useValue: {} },
        { provide: RolesService, useValue: rolesService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('passes when user has signature URL', async () => {
    prisma.user.findUnique.mockResolvedValue({
      signature: 'https://minio.example/users/1/signature.png',
    });
    await expect(service.assertHasStaffSignature(1)).resolves.toBeUndefined();
  });

  it('throws Forbidden when signature missing', async () => {
    prisma.user.findUnique.mockResolvedValue({ signature: null });
    await expect(service.assertHasStaffSignature(1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws Forbidden when signature is blank', async () => {
    prisma.user.findUnique.mockResolvedValue({ signature: '   ' });
    await expect(service.assertHasStaffSignature(2)).rejects.toThrow(/ลายเซ็น/);
  });

  it('throws Forbidden when user row missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.assertHasStaffSignature(99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('assertCanViewSignature allows self', async () => {
    await expect(service.assertCanViewSignature(5, 5)).resolves.toBeUndefined();
    expect(rolesService.getPermissionsForUser).not.toHaveBeenCalled();
  });

  it('assertCanViewSignature allows staff with job menu', async () => {
    rolesService.getPermissionsForUser.mockResolvedValue(['menu.pending']);
    await expect(service.assertCanViewSignature(1, 9)).resolves.toBeUndefined();
  });

  it('assertCanViewSignature forbids USER without staff menus', async () => {
    rolesService.getPermissionsForUser.mockResolvedValue([
      'menu.profile',
      'menu.report',
      'menu.status',
    ]);
    await expect(service.assertCanViewSignature(1, 9)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../prisma/prisma.service';
import { RBAC_ROLE_PERMISSION_CODES } from '../roles/roles.service';

describe('PermissionsGuard (users CRUD / custom roles)', () => {
  let guard: PermissionsGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let prisma: {
    user: { findUnique: jest.Mock };
    rolePermission: { findMany: jest.Mock };
  };

  const ctx = (user?: { id?: number; role?: string }): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    prisma = {
      user: { findUnique: jest.fn() },
      rolePermission: { findMany: jest.fn() },
    };
    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      prisma as unknown as PrismaService,
    );
  });

  it('allows when no permissions are required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    await expect(guard.canActivate(ctx({ id: 1 }))).resolves.toBe(true);
  });

  it('rejects missing JWT user id', async () => {
    reflector.getAllAndOverride.mockReturnValue(['menu.users']);
    await expect(guard.canActivate(ctx(undefined))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('allows ADMIN_1 when RolePermission includes menu.users', async () => {
    reflector.getAllAndOverride.mockReturnValue(['menu.users']);
    prisma.user.findUnique.mockResolvedValue({
      roleId: 12,
      role: 'ADMIN_1',
    });
    prisma.rolePermission.findMany.mockResolvedValue([
      { permission: { code: 'menu.users' } },
      { permission: { code: 'menu.roles' } },
    ]);

    await expect(
      guard.canActivate(ctx({ id: 5, role: 'ADMIN_1' })),
    ).resolves.toBe(true);
    expect(prisma.rolePermission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { roleId: 12 } }),
    );
  });

  it('forbids ADMIN_1 when menu.users is missing from RolePermission', async () => {
    reflector.getAllAndOverride.mockReturnValue(['menu.users']);
    prisma.user.findUnique.mockResolvedValue({
      roleId: 12,
      role: 'ADMIN_1',
    });
    prisma.rolePermission.findMany.mockResolvedValue([
      { permission: { code: 'menu.dashboard' } },
    ]);

    await expect(
      guard.canActivate(ctx({ id: 5, role: 'ADMIN_1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids GET /roles (menu.roles) when the user only has menu.users', async () => {
    reflector.getAllAndOverride.mockReturnValue(['menu.roles']);
    prisma.user.findUnique.mockResolvedValue({
      roleId: 12,
      role: 'ADMIN_1',
    });
    prisma.rolePermission.findMany.mockResolvedValue([
      { permission: { code: 'menu.users' } },
    ]);

    await expect(
      guard.canActivate(ctx({ id: 5, role: 'ADMIN_1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('falls back to built-in ADMIN codes when roleId is null', async () => {
    reflector.getAllAndOverride.mockReturnValue(['menu.users']);
    prisma.user.findUnique.mockResolvedValue({ roleId: null, role: 'ADMIN' });

    await expect(
      guard.canActivate(ctx({ id: 1, role: 'ADMIN' })),
    ).resolves.toBe(true);
    expect(prisma.rolePermission.findMany).not.toHaveBeenCalled();
    expect(RBAC_ROLE_PERMISSION_CODES.ADMIN).toContain('menu.users');
  });

  it('allows when user has at least one of permissions_any', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === 'permissions_any'
        ? ['job.classifyDoc.contract', 'job.classifyDoc.outOfContract']
        : undefined,
    );
    prisma.user.findUnique.mockResolvedValue({ roleId: 12, role: 'STAFF_1' });
    prisma.rolePermission.findMany.mockResolvedValue([
      { permission: { code: 'job.classifyDoc.contract' } },
    ]);

    await expect(
      guard.canActivate(ctx({ id: 5, role: 'STAFF_1' })),
    ).resolves.toBe(true);
  });

  it('forbids when user lacks all permissions_any', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === 'permissions_any'
        ? ['job.classifyDoc.contract', 'job.classifyDoc.outOfContract']
        : undefined,
    );
    prisma.user.findUnique.mockResolvedValue({ roleId: 12, role: 'STAFF_1' });
    prisma.rolePermission.findMany.mockResolvedValue([
      { permission: { code: 'menu.dashboard' } },
    ]);

    await expect(
      guard.canActivate(ctx({ id: 5, role: 'STAFF_1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

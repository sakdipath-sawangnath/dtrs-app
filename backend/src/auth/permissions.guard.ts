import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

// Guard ตรวจสอบ Permission.code จากตาราง rolePermission/permission
// ใช้ร่วมกับ JwtAuthGuard เพื่อกันไม่ให้ผู้ใช้เรียก CRUD โดยตรงแม้ซ่อนเมนูใน Sidebar
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  private readonly defaultCodesByEnumRole: Record<string, string[]> = {
    ADMIN: [
      'menu.profile',
      'menu.report',
      'menu.status',
      'menu.dashboard',
      'menu.pending',
      'menu.myJobs',
      'menu.inProgress',
      'menu.all',
      'menu.outOfContract',
      'menu.users',
      'menu.settings',
      'menu.roles',
      'menu.sites',
      'job.assign',
      'job.deleteUnassigned',
      'job.fix.self',
      'job.fix.any',
      'job.reopen.self',
      'job.reopen.any',
      'site.create',
      'site.update',
      'site.delete',
    ],
    STAFF: [
      'menu.dashboard',
      'menu.pending',
      'menu.myJobs',
      'menu.inProgress',
      'menu.all',
      'menu.outOfContract',
      'job.fix.self',
      'job.reopen.self',
    ],
    USER: ['menu.profile', 'menu.report', 'menu.status'],
    SUPERVISOR: [
      'menu.dashboard',
      'menu.pending',
      'menu.myJobs',
      'menu.inProgress',
      'menu.all',
      'menu.outOfContract',
      'menu.sites',
      'job.assign',
      'job.deleteUnassigned',
      'job.fix.self',
      'job.fix.any',
      'job.reopen.self',
      'job.reopen.any',
      'site.create',
      'site.update',
      'site.delete',
    ],
  };

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { id?: number; role?: string };
    if (!user?.id) throw new UnauthorizedException();

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { roleId: true, role: true },
    });
    if (!dbUser) throw new UnauthorizedException();

    let permissionCodes: string[] = [];

    if (dbUser.roleId != null) {
      const rows = await this.prisma.rolePermission.findMany({
        where: { roleId: dbUser.roleId },
        include: { permission: { select: { code: true } } },
      });
      permissionCodes = rows.map((r) => r.permission.code);
    } else {
      const enumRole = dbUser.role ? String(dbUser.role).toUpperCase() : '';
      permissionCodes = this.defaultCodesByEnumRole[enumRole] ?? [];
    }

    // ต้องมีครบทุก permission ที่ประกาศ
    const missing = required.filter((code) => !permissionCodes.includes(code));
    if (missing.length > 0) {
      throw new ForbiddenException('ไม่มีสิทธิ์ดำเนินการ');
    }

    return true;
  }
}


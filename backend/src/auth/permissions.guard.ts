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
import { RBAC_ROLE_PERMISSION_CODES } from '../roles/roles.service';

// Guard ตรวจสอบ Permission.code จากตาราง rolePermission/permission
// ใช้ร่วมกับ JwtAuthGuard เพื่อกันไม่ให้ผู้ใช้เรียก CRUD โดยตรงแม้ซ่อนเมนูใน Sidebar
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

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
      permissionCodes = RBAC_ROLE_PERMISSION_CODES[enumRole] ?? [];
    }

    // ต้องมีครบทุก permission ที่ประกาศ
    const missing = required.filter((code) => !permissionCodes.includes(code));
    if (missing.length > 0) {
      throw new ForbiddenException('ไม่มีสิทธิ์ดำเนินการ');
    }

    return true;
  }
}


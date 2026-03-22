import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // กันปัญหา seed ซ้อนจาก concurrent requests (เช่น /roles และ /roles/permissions เรียกพร้อมกัน)
  private static rbacSeedInFlight: Promise<void> | null = null;

  /**
   * กันปัญหา seeddata หาย/ยังไม่ถูกสร้าง
   * - ทำเฉพาะเมื่อตาราง AppRole ว่าง
   * - ทำเฉพาะ dev (ไม่กระทบ prod)
   */
  private async ensureRbacSeedIfEmpty(): Promise<void> {
    if (process.env.NODE_ENV === "production") return;

    if (RolesService.rbacSeedInFlight) {
      await RolesService.rbacSeedInFlight;
      return;
    }

    RolesService.rbacSeedInFlight = (async () => {
    const existingRoles = await this.prisma.appRole.count();
    if (existingRoles > 0) return;

    const MENU_PERMISSIONS = [
      { code: "menu.profile", name: "โปรไฟล์", category: "menu" },
      { code: "menu.report", name: "แจ้งปัญหา", category: "menu" },
      { code: "menu.status", name: "ตรวจสอบสถานะ", category: "menu" },
      { code: "menu.dashboard", name: "ภาพรวม", category: "menu" },
      { code: "menu.pending", name: "รอดำเนินการ", category: "menu" },
      { code: "menu.myJobs", name: "งานที่รับผิดชอบ", category: "menu" },
      { code: "menu.inProgress", name: "กำลังแก้ไข", category: "menu" },
      { code: "menu.all", name: "ประวัติทั้งหมด", category: "menu" },
      { code: "menu.outOfContract", name: "นอกสัญญา", category: "menu" },
      { code: "menu.users", name: "จัดการผู้ใช้", category: "menu" },
      { code: "menu.settings", name: "ตั้งค่าระบบ", category: "menu" },
      { code: "menu.roles", name: "จัดการบทบาทและสิทธิ์", category: "menu" },
    ] as const;

    const ACTION_PERMISSIONS = [
      { code: "job.assign", name: "มอบหมายงาน", category: "job" },
      { code: "job.deleteUnassigned", name: "ลบงานที่ยังไม่มีผู้รับผิดชอบ", category: "job" },
    ] as const;

    const ALL_PERMISSIONS = [...MENU_PERMISSIONS, ...ACTION_PERMISSIONS];

    const DEFAULT_ROLES = [
      { code: "ADMIN", name: "ผู้ดูแลระบบ", description: "เข้าถึงทุกเมนู รวมจัดการผู้ใช้และตั้งค่าระบบ" },
      { code: "STAFF", name: "ช่างเทคนิค", description: "ภาพรวม, รอดำเนินการ, กำลังแก้ไข, ประวัติ, นอกสัญญา" },
      { code: "USER", name: "ผู้แจ้งซ่อม", description: "เฉพาะ โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ" },
      { code: "SUPERVISOR", name: "หัวหน้างาน", description: "เทียบเท่าเจ้าหน้าที่ แต่สามารถมอบหมายงานให้เจ้าหน้าที่ได้" },
    ] as const;

    const STAFF_MENUS = MENU_PERMISSIONS.map((p) => p.code).filter(
      (c) => !["menu.users", "menu.settings", "menu.roles"].includes(c)
    );

    const ROLE_PERMISSION_CODES: Record<string, string[]> = {
      ADMIN: [...MENU_PERMISSIONS.map((p) => p.code), ...ACTION_PERMISSIONS.map((p) => p.code)],
      STAFF: STAFF_MENUS,
      USER: ["menu.profile", "menu.report", "menu.status"],
      SUPERVISOR: [...STAFF_MENUS, ...ACTION_PERMISSIONS.map((p) => p.code)],
    };

    // 1) Upsert permissions
    // หมายเหตุ: กันกรณี race condition ยังคงเกิด (เช่นภายใต้ transaction/lock ของ DB)
    for (const p of ALL_PERMISSIONS) {
      try {
        await this.prisma.permission.upsert({
          where: { code: p.code },
          create: { code: p.code, name: p.name, category: p.category },
          update: { name: p.name, category: p.category },
        });
      } catch (err: any) {
        // P2002 = unique constraint failed
        if (err?.code === "P2002") continue;
        throw err;
      }
    }

    const permissions = await this.prisma.permission.findMany();
    const permByCode = Object.fromEntries(permissions.map((p) => [p.code, p.id]));

    // 2) Upsert roles
    const roleIds: Record<string, number> = {};
    for (const r of DEFAULT_ROLES) {
      const role = await this.prisma.appRole.upsert({
        where: { code: r.code },
        create: { code: r.code, name: r.name, description: r.description },
        update: { name: r.name, description: r.description },
      });
      roleIds[r.code] = role.id;
    }

    // 3) Assign role permissions
    for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSION_CODES)) {
      const roleId = roleIds[roleCode];
      if (!roleId) continue;
      const permissionIds = permCodes.map((code) => permByCode[code]).filter(Boolean) as number[];
      if (permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
          skipDuplicates: true,
        });
      }
    }

    // 4) Sync user.roleId จาก user.role enum
    const users = await this.prisma.user.findMany({ select: { id: true, role: true } });
    const enumToRoleId: Record<string, number | undefined> = {
      ADMIN: roleIds.ADMIN,
      STAFF: roleIds.STAFF,
      USER: roleIds.USER,
      SUPERVISOR: roleIds.SUPERVISOR,
    };
    for (const u of users) {
      const roleId = enumToRoleId[u.role as string];
      if (roleId != null) {
        await this.prisma.user.update({ where: { id: u.id }, data: { roleId } });
      }
    }
    })();

    try {
      await RolesService.rbacSeedInFlight;
    } finally {
      RolesService.rbacSeedInFlight = null;
    }
  }

  async findAllRoles() {
    await this.ensureRbacSeedIfEmpty();
    return this.prisma.appRole.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { users: true, permissions: true } },
      },
    });
  }

  async findRoleById(id: number) {
    const role = await this.prisma.appRole.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException('ไม่พบบทบาทนี้');
    return role;
  }

  async getRolePermissionIds(roleId: number) {
    const rows = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });
    return rows.map((r) => r.permissionId);
  }

  async setRolePermissions(roleId: number, permissionIds: number[]) {
    const role = await this.prisma.appRole.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('ไม่พบบทบาทนี้');
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      });
    }
    return this.getRolePermissionIds(roleId);
  }

  async createRole(data: { code: string; name: string; description?: string }) {
    const code = data.code.trim().toUpperCase();
    const existing = await this.prisma.appRole.findUnique({ where: { code } });
    if (existing) throw new ConflictException('รหัสบทบาทนี้มีแล้ว');
    return this.prisma.appRole.create({
      data: { code, name: data.name.trim(), description: data.description?.trim() || null },
    });
  }

  async updateRole(id: number, data: { name?: string; description?: string }) {
    const role = await this.prisma.appRole.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('ไม่พบบทบาทนี้');
    return this.prisma.appRole.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        description: data.description?.trim(),
      },
    });
  }

  async deleteRole(id: number) {
    const role = await this.prisma.appRole.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
    if (!role) throw new NotFoundException('ไม่พบบทบาทนี้');
    if (role._count.users > 0) throw new ConflictException('ไม่สามารถลบบทบาทที่มีผู้ใช้ผูกอยู่');
    await this.prisma.appRole.delete({ where: { id } });
    return { ok: true };
  }

  async findAllPermissions() {
    await this.ensureRbacSeedIfEmpty();
    return this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
  }

  /** สิทธิ์ของ user ตาม roleId (หรือตาม enum role ถ้าไม่มี roleId) */
  async getPermissionsForUser(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, role: true, roleRef: true },
    });
    if (!user) return [];
    if (user.roleId && user.roleRef) {
      const rolePerms = await this.prisma.rolePermission.findMany({
        where: { roleId: user.roleId },
        include: { permission: true },
      });
      return rolePerms.map((rp) => rp.permission.code);
    }
    // Fallback: ใช้ enum role (ค่าเริ่มต้นก่อน migrate)
    const defaultCodes: Record<string, string[]> = {
      ADMIN: ['menu.profile', 'menu.report', 'menu.status', 'menu.dashboard', 'menu.pending', 'menu.inProgress', 'menu.all', 'menu.outOfContract', 'menu.users', 'menu.settings', 'menu.roles', 'job.assign', 'job.deleteUnassigned'],
      STAFF: ['menu.dashboard', 'menu.pending', 'menu.inProgress', 'menu.all', 'menu.outOfContract'],
      USER: ['menu.profile', 'menu.report', 'menu.status'],
      SUPERVISOR: ['menu.dashboard', 'menu.pending', 'menu.inProgress', 'menu.all', 'menu.outOfContract', 'job.assign', 'job.deleteUnassigned'],
    };
    return defaultCodes[user.role] ?? [];
  }
}

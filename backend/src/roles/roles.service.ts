import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** แคตตาล็อก Permission — ต้องสอดคล้องกับ `scripts/seed-roles-permissions.ts` */
const RBAC_MENU_PERMISSIONS = [
  { code: 'menu.profile', name: 'โปรไฟล์', category: 'menu' },
  { code: 'menu.report', name: 'แจ้งปัญหา', category: 'menu' },
  { code: 'menu.status', name: 'ตรวจสอบสถานะ', category: 'menu' },
  { code: 'menu.dashboard', name: 'ภาพรวม', category: 'menu' },
  { code: 'menu.pending', name: 'รอดำเนินการ', category: 'menu' },
  { code: 'menu.myJobs', name: 'งานที่รับผิดชอบ', category: 'menu' },
  { code: 'menu.inProgress', name: 'กำลังแก้ไข', category: 'menu' },
  { code: 'menu.all', name: 'ประวัติทั้งหมด', category: 'menu' },
  { code: 'menu.outOfContract', name: 'นอกสัญญา', category: 'menu' },
  { code: 'menu.sites', name: 'จัดการ Site', category: 'menu' },
  { code: 'menu.users', name: 'จัดการผู้ใช้', category: 'menu' },
  { code: 'menu.settings', name: 'ตั้งค่าระบบ', category: 'menu' },
  { code: 'menu.roles', name: 'จัดการบทบาทและสิทธิ์', category: 'menu' },
] as const;

const RBAC_ACTION_PERMISSIONS = [
  { code: 'job.assign', name: 'มอบหมายงาน', category: 'job' },
  { code: 'job.deleteUnassigned', name: 'ลบงานที่ยังไม่มีผู้รับผิดชอบ', category: 'job' },
  { code: 'job.updateStatus', name: 'เปลี่ยนสถานะงาน', category: 'job' },
  { code: 'job.backfillDate', name: 'แก้ไขวันเวลาย้อนหลังของงาน', category: 'job' },
  { code: 'job.deleteInProgress', name: 'ลบงานกำลังแก้ไข (ผู้ดูแล)', category: 'job' },
  { code: 'job.cancel', name: 'ยกเลิกงานรอดำเนินการ (PENDING)', category: 'job' },
  { code: 'job.fix.self', name: 'บันทึก/ปิดงาน (เฉพาะงานที่รับผิดชอบ)', category: 'job' },
  { code: 'job.fix.any', name: 'บันทึก/ปิดงาน (ทุกงาน)', category: 'job' },
  { code: 'job.reopen.self', name: 'Reopen งาน (เฉพาะงานที่รับผิดชอบ)', category: 'job' },
  { code: 'job.reopen.any', name: 'Reopen งาน (ทุกงาน)', category: 'job' },
  { code: 'site.create', name: 'เพิ่ม Site', category: 'site' },
  { code: 'site.update', name: 'แก้ไข Site', category: 'site' },
  { code: 'site.delete', name: 'ลบ Site', category: 'site' },
] as const;

const RBAC_ACTION_CODES_ALL = RBAC_ACTION_PERMISSIONS.map((p) => p.code);
/** SUPERVISOR ไม่ได้ลบงาน IN_PROGRESS แบบผู้ดูแล (เฉพาะ ADMIN) */
const RBAC_ACTION_CODES_SUPERVISOR = RBAC_ACTION_CODES_ALL.filter(
  (c) => c !== 'job.deleteInProgress' && c !== 'job.backfillDate',
);

const RBAC_ALL_PERMISSIONS = [...RBAC_MENU_PERMISSIONS, ...RBAC_ACTION_PERMISSIONS];

const RBAC_DEFAULT_ROLES = [
  {
    code: 'ADMIN',
    name: 'ผู้ดูแลระบบ',
    description: 'เข้าถึงทุกเมนู รวมจัดการผู้ใช้และตั้งค่าระบบ',
    badgeTextColor: '#DBEAFE',
    badgeBgColor: '#1E3A8A',
  },
  {
    code: 'STAFF',
    name: 'ช่างเทคนิค',
    description: 'ภาพรวม, รอดำเนินการ, กำลังแก้ไข, ประวัติ, นอกสัญญา',
    badgeTextColor: '#DCFCE7',
    badgeBgColor: '#166534',
  },
  {
    code: 'USER',
    name: 'ผู้แจ้งซ่อม',
    description: 'เฉพาะ โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ',
    badgeTextColor: '#FFEDD5',
    badgeBgColor: '#9A3412',
  },
  {
    code: 'SUPERVISOR',
    name: 'หัวหน้างาน',
    description: 'เทียบเท่าเจ้าหน้าที่ แต่สามารถมอบหมายงานให้เจ้าหน้าที่ได้',
    badgeTextColor: '#E0E7FF',
    badgeBgColor: '#3730A3',
  },
] as const;

const RBAC_STAFF_MENU_CODES = RBAC_MENU_PERMISSIONS.map((p) => p.code).filter(
  (c) => !['menu.users', 'menu.settings', 'menu.roles', 'menu.sites'].includes(c),
);

/** export ให้ PermissionsGuard ใช้ชุดเดียวกับ enum user (ไม่มี roleId) */
export const RBAC_ROLE_PERMISSION_CODES: Record<string, string[]> = {
  ADMIN: [...RBAC_MENU_PERMISSIONS.map((p) => p.code), ...RBAC_ACTION_CODES_ALL],
  STAFF: [
    ...RBAC_STAFF_MENU_CODES,
    'job.fix.self',
    'job.reopen.self',
    'job.updateStatus',
  ],
  USER: ['menu.profile', 'menu.report', 'menu.status'],
  SUPERVISOR: [...RBAC_STAFF_MENU_CODES, 'menu.sites', ...RBAC_ACTION_CODES_SUPERVISOR],
};

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  // กันปัญหา seed ซ้อนจาก concurrent requests (เช่น /roles และ /roles/permissions เรียกพร้อมกัน)
  private static rbacSeedInFlight: Promise<void> | null = null;
  private static permissionCatalogSyncInFlight: Promise<void> | null = null;

  private normalizeHexColorOrNull(input?: string): string | null {
    if (input == null) return null;
    const v = String(input).trim();
    if (!v) return null;
    const hex = v.startsWith('#') ? v : `#${v}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      throw new BadRequestException('รูปแบบสีไม่ถูกต้อง (ต้องเป็น #RRGGBB)');
    }
    return hex.toUpperCase();
  }

  async onModuleInit() {
    await this.ensurePermissionCatalogSynced();
  }

  /**
   * Upsert แถว Permission ให้ครบ (รวม menu.sites, site.*) ทุก environment
   * ถ้ามี code ใหม่ที่เพิ่งถูกสร้าง — ผูกให้บทบาทมาตรฐานเท่าที่ seed กำหนด (createMany skipDuplicates)
   * ไม่ลบหรือคืนสิทธิ์ที่ถอดจาก role เดิม
   */
  private async ensurePermissionCatalogSynced(): Promise<void> {
    if (RolesService.permissionCatalogSyncInFlight) {
      await RolesService.permissionCatalogSyncInFlight;
      return;
    }

    RolesService.permissionCatalogSyncInFlight = (async () => {
      const existingBefore = await this.prisma.permission.findMany({
        select: { code: true },
      });
      const beforeCodes = new Set(existingBefore.map((p) => p.code));

      for (const p of RBAC_ALL_PERMISSIONS) {
        try {
          await this.prisma.permission.upsert({
            where: { code: p.code },
            create: { code: p.code, name: p.name, category: p.category },
            update: { name: p.name, category: p.category },
          });
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code;
          if (code === 'P2002') continue;
          throw err;
        }
      }

      const newCodes = RBAC_ALL_PERMISSIONS.map((x) => x.code).filter(
        (c) => !beforeCodes.has(c),
      );
      if (newCodes.length === 0) return;

      const newCodeSet = new Set<string>(newCodes);
      const allPerms = await this.prisma.permission.findMany({
        select: { id: true, code: true },
      });
      const idByCode = Object.fromEntries(allPerms.map((p) => [p.code, p.id]));

      const builtIn = await this.prisma.appRole.findMany({
        where: { code: { in: ['ADMIN', 'STAFF', 'USER', 'SUPERVISOR'] } },
        select: { id: true, code: true },
      });

      for (const r of builtIn) {
        const allowed = RBAC_ROLE_PERMISSION_CODES[r.code];
        if (!allowed) continue;
        const toLink = allowed.filter((c) => newCodeSet.has(c));
        const rows = toLink
          .map((code) => {
            const permissionId = idByCode[code];
            return permissionId != null
              ? { roleId: r.id, permissionId }
              : null;
          })
          .filter((x): x is { roleId: number; permissionId: number } => x != null);
        if (rows.length > 0) {
          await this.prisma.rolePermission.createMany({
            data: rows,
            skipDuplicates: true,
          });
        }
      }
    })();

    try {
      await RolesService.permissionCatalogSyncInFlight;
    } finally {
      RolesService.permissionCatalogSyncInFlight = null;
    }
  }

  /**
   * กันปัญหา seeddata หาย/ยังไม่ถูกสร้าง
   * - ทำเฉพาะเมื่อตาราง AppRole ว่าง
   * - ทำเฉพาะ dev (ไม่กระทบ prod)
   */
  private async ensureRbacSeedIfEmpty(): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;

    if (RolesService.rbacSeedInFlight) {
      await RolesService.rbacSeedInFlight;
      return;
    }

    RolesService.rbacSeedInFlight = (async () => {
      const existingRoles = await this.prisma.appRole.count();
      if (existingRoles > 0) return;

      for (const p of RBAC_ALL_PERMISSIONS) {
        try {
          await this.prisma.permission.upsert({
            where: { code: p.code },
            create: { code: p.code, name: p.name, category: p.category },
            update: { name: p.name, category: p.category },
          });
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code;
          if (code === 'P2002') continue;
          throw err;
        }
      }

      const permissions = await this.prisma.permission.findMany();
      const permByCode = Object.fromEntries(permissions.map((p) => [p.code, p.id]));

      const roleIds: Record<string, number> = {};
      for (const r of RBAC_DEFAULT_ROLES) {
        const role = await this.prisma.appRole.upsert({
          where: { code: r.code },
          create: {
            code: r.code,
            name: r.name,
            description: r.description,
            badgeTextColor: r.badgeTextColor,
            badgeBgColor: r.badgeBgColor,
          },
          update: {
            name: r.name,
            description: r.description,
            badgeTextColor: r.badgeTextColor,
            badgeBgColor: r.badgeBgColor,
          },
        });
        roleIds[r.code] = role.id;
      }

      for (const [roleCode, permCodes] of Object.entries(RBAC_ROLE_PERMISSION_CODES)) {
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

  async createRole(data: {
    code: string;
    name: string;
    description?: string;
    badgeTextColor?: string;
    badgeBgColor?: string;
  }) {
    const code = data.code.trim().toUpperCase();
    const existing = await this.prisma.appRole.findUnique({ where: { code } });
    if (existing) throw new ConflictException('รหัสบทบาทนี้มีแล้ว');
    const badgeTextColor = this.normalizeHexColorOrNull(data.badgeTextColor);
    const badgeBgColor = this.normalizeHexColorOrNull(data.badgeBgColor);
    return this.prisma.appRole.create({
      data: {
        code,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        badgeTextColor,
        badgeBgColor,
      },
    });
  }

  async updateRole(
    id: number,
    data: { name?: string; description?: string; badgeTextColor?: string; badgeBgColor?: string },
  ) {
    const role = await this.prisma.appRole.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('ไม่พบบทบาทนี้');
    const updateData: {
      name?: string;
      description?: string;
      badgeTextColor?: string | null;
      badgeBgColor?: string | null;
    } = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.badgeTextColor !== undefined) {
      updateData.badgeTextColor = this.normalizeHexColorOrNull(data.badgeTextColor);
    }
    if (data.badgeBgColor !== undefined) {
      updateData.badgeBgColor = this.normalizeHexColorOrNull(data.badgeBgColor);
    }
    return this.prisma.appRole.update({
      where: { id },
      data: updateData,
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
    await this.ensurePermissionCatalogSynced();
    await this.ensureRbacSeedIfEmpty();
    return this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
  }

  async findPublicRoleStyles() {
    const rows = await this.prisma.appRole.findMany({
      orderBy: { id: 'asc' },
      select: {
        code: true,
        name: true,
        badgeTextColor: true,
        badgeBgColor: true,
      },
    });
    return rows.map((r) => ({
      code: String(r.code || '').toUpperCase(),
      name: r.name,
      badgeTextColor: this.normalizeHexColorOrNull(r.badgeTextColor ?? undefined),
      badgeBgColor: this.normalizeHexColorOrNull(r.badgeBgColor ?? undefined),
    }));
  }

  /** สิทธิ์ของ user ตาม roleId (หรือตาม enum role ถ้าไม่มี roleId) */
  async getPermissionsForUser(userId: number): Promise<string[]> {
    await this.ensurePermissionCatalogSynced();
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
      // สิทธิ์ตามที่กำหนดใน DB เท่านั้น (หน้า /dashboard/roles) — ไม่บังคับเมนูจากโค้ด
      return rolePerms.map((rp) => rp.permission.code);
    }
    const roleKey = user.role != null ? String(user.role).toUpperCase() : '';
    return RBAC_ROLE_PERMISSION_CODES[roleKey] ?? [];
  }
}

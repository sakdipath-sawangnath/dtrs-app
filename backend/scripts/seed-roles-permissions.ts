/**
 * Seed ตาราง AppRole, Permission, RolePermission
 * และ sync User.roleId จาก User.role (enum)
 *
 * รัน: cd backend && npx ts-node scripts/seed-roles-permissions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MENU_PERMISSIONS = [
  { code: 'menu.profile', name: 'โปรไฟล์', category: 'menu' },
  { code: 'menu.report', name: 'แจ้งปัญหา', category: 'menu' },
  { code: 'menu.status', name: 'ตรวจสอบสถานะ', category: 'menu' },
  { code: 'menu.dashboard', name: 'ภาพรวม', category: 'menu' },
  { code: 'menu.pending', name: 'รอดำเนินการ', category: 'menu' },
  { code: 'menu.myJobs', name: 'งานที่รับผิดชอบ', category: 'menu' },
  { code: 'menu.inProgress', name: 'กำลังแก้ไข', category: 'menu' },
  { code: 'menu.all', name: 'ประวัติทั้งหมด', category: 'menu' },
  { code: 'menu.outOfContract', name: 'นอกสัญญา', category: 'menu' },
  { code: 'menu.users', name: 'จัดการผู้ใช้', category: 'menu' },
  { code: 'menu.settings', name: 'ตั้งค่าระบบ', category: 'menu' },
  { code: 'menu.roles', name: 'จัดการบทบาทและสิทธิ์', category: 'menu' },
] as const;

const ACTION_PERMISSIONS = [
  { code: 'job.assign', name: 'มอบหมายงาน', category: 'job' },
  { code: 'job.deleteUnassigned', name: 'ลบงานที่ยังไม่มีผู้รับผิดชอบ', category: 'job' },
] as const;

const ALL_PERMISSIONS = [...MENU_PERMISSIONS, ...ACTION_PERMISSIONS];

const DEFAULT_ROLES = [
  { code: 'ADMIN', name: 'ผู้ดูแลระบบ', description: 'เข้าถึงทุกเมนู รวมจัดการผู้ใช้และตั้งค่าระบบ' },
  { code: 'STAFF', name: 'ช่างเทคนิค', description: 'ภาพรวม, รอดำเนินการ, กำลังแก้ไข, ประวัติ, นอกสัญญา' },
  { code: 'USER', name: 'ผู้แจ้งซ่อม', description: 'เฉพาะ โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ' },
  { code: 'SUPERVISOR', name: 'หัวหน้างาน', description: 'เทียบเท่าเจ้าหน้าที่ แต่สามารถมอบหมายงานให้เจ้าหน้าที่ได้' },
] as const;

const STAFF_MENUS = MENU_PERMISSIONS.map((p) => p.code).filter((c) => !['menu.users', 'menu.settings', 'menu.roles'].includes(c));

// ADMIN ได้ทุก permission, STAFF ได้แค่เมนู, USER ได้แค่ profile/report/status, SUPERVISOR = STAFF + job.assign (+ อื่นๆของกลุ่ม job)
const ROLE_PERMISSION_CODES: Record<string, string[]> = {
  ADMIN: [...MENU_PERMISSIONS.map((p) => p.code), ...ACTION_PERMISSIONS.map((p) => p.code)],
  STAFF: STAFF_MENUS,
  USER: ['menu.profile', 'menu.report', 'menu.status'],
  SUPERVISOR: [...STAFF_MENUS, ...ACTION_PERMISSIONS.map((p) => p.code)],
};

async function main() {
  console.log('สร้าง Permission...');
  for (const p of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: { name: p.name, category: p.category },
    });
  }
  const permissions = await prisma.permission.findMany();
  const permByCode = Object.fromEntries(permissions.map((p) => [p.code, p.id]));

  console.log('สร้าง AppRole...');
  const roleIds: Record<string, number> = {};
  for (const r of DEFAULT_ROLES) {
    const role = await prisma.appRole.upsert({
      where: { code: r.code },
      create: r,
      update: { name: r.name, description: r.description },
    });
    roleIds[r.code] = role.id;
  }

  console.log('ผูก Permission ให้ Role...');
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSION_CODES)) {
    const roleId = roleIds[roleCode];
    if (!roleId) continue;
    for (const code of permCodes) {
      const permissionId = permByCode[code];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        create: { roleId, permissionId },
        update: {},
      });
    }
  }

  console.log('Sync User.roleId จาก User.role (enum)...');
  const enumToRoleId: Record<string, number> = {
    ADMIN: roleIds.ADMIN!,
    STAFF: roleIds.STAFF!,
    USER: roleIds.USER!,
    SUPERVISOR: roleIds.SUPERVISOR!,
  };
  const users = await prisma.user.findMany({ select: { id: true, role: true } });
  for (const u of users) {
    const roleId = enumToRoleId[u.role];
    if (roleId != null) {
      await prisma.user.update({ where: { id: u.id }, data: { roleId } });
    }
  }
  console.log('เสร็จ:', users.length, 'users อัปเดต roleId');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

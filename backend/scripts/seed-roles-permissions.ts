/**
 * Seed ตาราง AppRole, Permission, RolePermission
 * และ sync User.roleId จาก User.role (enum)
 *
 * รัน: cd backend && npx ts-node scripts/seed-roles-permissions.ts
 */

import { PrismaClient } from '@prisma/client';
import { grantClassifyDocChildrenToRolesWithParent } from '../src/roles/classify-doc-permission-inherit';

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
  { code: 'menu.sites', name: 'จัดการ Site', category: 'menu' },
  {
    code: 'menu.locations',
    name: 'จัดการข้อมูล Master (พื้นที่)',
    category: 'menu',
  },
  { code: 'menu.users', name: 'จัดการผู้ใช้', category: 'menu' },
  { code: 'menu.settings', name: 'ตั้งค่าระบบ', category: 'menu' },
  { code: 'menu.roles', name: 'จัดการบทบาทและสิทธิ์', category: 'menu' },
  { code: 'menu.userGuide', name: 'คู่มือระบบ', category: 'menu' },
] as const;

const ACTION_PERMISSIONS = [
  { code: 'job.assign', name: 'มอบหมายงาน', category: 'job' },
  {
    code: 'job.viewContractTabs',
    name: 'ดูแท็บสัญญา/นอกสัญญา',
    category: 'job',
  },
  { code: 'job.classifyDoc', name: 'จำแนกเอกสาร', category: 'job' },
  {
    code: 'job.classifyDoc.contract',
    name: 'จำแนกเอกสาร — ในสัญญา',
    category: 'job',
  },
  {
    code: 'job.classifyDoc.outOfContract',
    name: 'จำแนกเอกสาร — นอกสัญญา',
    category: 'job',
  },
  {
    code: 'job.deleteUnassigned',
    name: 'ลบงานที่ยังไม่มีผู้รับผิดชอบ',
    category: 'job',
  },
  { code: 'job.updateStatus', name: 'เปลี่ยนสถานะงาน', category: 'job' },
  {
    code: 'job.backfillDate',
    name: 'แก้ไขวันเวลาย้อนหลังของงาน',
    category: 'job',
  },
  {
    code: 'job.deleteInProgress',
    name: 'ลบงานกำลังแก้ไข (ผู้ดูแล)',
    category: 'job',
  },
  {
    code: 'job.cancel',
    name: 'ยกเลิกงานรอดำเนินการ (PENDING)',
    category: 'job',
  },
  { code: 'job.issue.upload', name: 'อัปโหลดรูปปัญหาที่แจ้ง', category: 'job' },
  {
    code: 'job.fix.self',
    name: 'บันทึก/ปิดงาน (เฉพาะงานที่รับผิดชอบ)',
    category: 'job',
  },
  { code: 'job.fix.any', name: 'บันทึก/ปิดงาน (ทุกงาน)', category: 'job' },
  {
    code: 'job.reopen.self',
    name: 'Reopen งาน (เฉพาะงานที่รับผิดชอบ)',
    category: 'job',
  },
  { code: 'job.reopen.any', name: 'Reopen งาน (ทุกงาน)', category: 'job' },
  { code: 'site.create', name: 'เพิ่ม Site', category: 'site' },
  { code: 'site.update', name: 'แก้ไข Site', category: 'site' },
  { code: 'site.delete', name: 'ลบ Site', category: 'site' },
  {
    code: 'location.create',
    name: 'เพิ่มจังหวัด/อำเภอ/ตำบล',
    category: 'location',
  },
] as const;

const ACTION_CODES_ALL = ACTION_PERMISSIONS.map((p) => p.code);
const ACTION_CODES_SUPERVISOR = ACTION_CODES_ALL.filter(
  (c) =>
    c !== 'job.deleteInProgress' &&
    c !== 'job.backfillDate' &&
    c !== 'job.issue.upload',
);

const ALL_PERMISSIONS = [...MENU_PERMISSIONS, ...ACTION_PERMISSIONS];

const DEFAULT_ROLES = [
  {
    code: 'ADMIN',
    name: 'ผู้ดูแลระบบ',
    description: 'เข้าถึงทุกเมนู รวมจัดการผู้ใช้และตั้งค่าระบบ',
  },
  {
    code: 'STAFF',
    name: 'ช่างเทคนิค',
    description: 'ภาพรวม, รอดำเนินการ, กำลังแก้ไข, ประวัติ, นอกสัญญา',
  },
  {
    code: 'USER',
    name: 'ผู้แจ้งซ่อม',
    description: 'เฉพาะ โปรไฟล์, แจ้งปัญหา, ตรวจสอบสถานะ',
  },
  {
    code: 'SUPERVISOR',
    name: 'หัวหน้างาน',
    description: 'เทียบเท่าเจ้าหน้าที่ แต่สามารถมอบหมายงานให้เจ้าหน้าที่ได้',
  },
] as const;

const STAFF_MENUS = MENU_PERMISSIONS.map((p) => p.code).filter(
  (c) =>
    ![
      'menu.users',
      'menu.settings',
      'menu.roles',
      'menu.userGuide',
      'menu.sites',
      'menu.locations',
    ].includes(c),
);

// ADMIN ได้ทุก permission; SUPERVISOR ไม่มี job.deleteInProgress (เฉพาะ ADMIN)
const ROLE_PERMISSION_CODES: Record<string, string[]> = {
  ADMIN: [...MENU_PERMISSIONS.map((p) => p.code), ...ACTION_CODES_ALL],
  STAFF: [
    ...STAFF_MENUS,
    'job.viewContractTabs',
    'job.fix.self',
    'job.reopen.self',
    'job.updateStatus',
  ],
  USER: ['menu.profile', 'menu.report', 'menu.status'],
  SUPERVISOR: [
    ...STAFF_MENUS,
    'menu.sites',
    'menu.locations',
    ...ACTION_CODES_SUPERVISOR,
  ],
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

  console.log('Inherit job.classifyDoc.* ให้บทบาทที่มี job.classifyDoc...');
  await grantClassifyDocChildrenToRolesWithParent(prisma);

  console.log('Sync User.roleId จาก User.role (enum)...');
  const enumToRoleId: Record<string, number> = {
    ADMIN: roleIds.ADMIN,
    STAFF: roleIds.STAFF,
    USER: roleIds.USER,
    SUPERVISOR: roleIds.SUPERVISOR,
  };
  const users = await prisma.user.findMany({
    select: { id: true, role: true },
  });
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

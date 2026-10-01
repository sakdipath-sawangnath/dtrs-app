/**
 * Centralized Typed Permissions Module
 * Single source of truth for authorization checks in the frontend
 */

export const PERMISSIONS = {
  OOC_VIEW: 'ooc:view',
  OOC_EXPORT: 'ooc:export',
  OOC_CLASSIFY: 'ooc:classify',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** สิทธิ์มาตรฐานของระบบใน backend สำหรับงานนอกสัญญา */
export const BACKEND_PERMISSIONS = {
  MENU_OUT_OF_CONTRACT: 'menu.outOfContract',
  VIEW_CONTRACT_TABS: 'job.viewContractTabs',
  CLASSIFY_OUT_OF_CONTRACT: 'job.classifyDoc.outOfContract',
} as const;

/** บทบาทเริ่มต้นที่ได้รับสิทธิ์งานนอกสัญญาตาม seed และ roles.service.ts */
export const DEFAULT_OUT_OF_CONTRACT_ROLES = ['ADMIN', 'STAFF', 'SUPERVISOR'] as const;

export interface SessionUser {
  id?: string | number | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  permissions?: string[] | null;
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden: Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * ตรวจสอบว่าผู้ใช้มีสิทธิ์ตามที่ระบุหรือไม่
 * ห้าม hardcode ชื่อ role ใน components ให้เรียกผ่าน can() เท่านั้น
 */
export function can(user: SessionUser | null | undefined, permission: Permission): boolean {
  if (!user) return false;

  const role = String(user.role ?? '').trim().toUpperCase();
  // บทบาท USER ไม่มีสิทธิ์งานนอกสัญญาทุกกรณี
  if (role === 'USER') {
    return false;
  }

  const perms = user.permissions;

  // หากมีรายการ permissions จาก backend (/roles/me/permissions) ตรวจสอบสิทธิ์โดยตรง
  if (Array.isArray(perms) && perms.length > 0) {
    switch (permission) {
      case PERMISSIONS.OOC_VIEW:
        return perms.includes(BACKEND_PERMISSIONS.MENU_OUT_OF_CONTRACT);
      case PERMISSIONS.OOC_EXPORT:
        return perms.includes(BACKEND_PERMISSIONS.VIEW_CONTRACT_TABS);
      case PERMISSIONS.OOC_CLASSIFY:
        return perms.includes(BACKEND_PERMISSIONS.CLASSIFY_OUT_OF_CONTRACT);
      default:
        return false;
    }
  }

  // หาก permissions เป็น null/undefined หรือยังโหลดไม่เสร็จ (fallback ไปยังบทบาทมาตรฐาน)
  const isDefaultAllowedRole = DEFAULT_OUT_OF_CONTRACT_ROLES.some((r) => r === role);
  if (!isDefaultAllowedRole) {
    return false;
  }

  switch (permission) {
    case PERMISSIONS.OOC_VIEW:
    case PERMISSIONS.OOC_EXPORT:
      return true;
    case PERMISSIONS.OOC_CLASSIFY:
      return role === 'ADMIN' || role === 'SUPERVISOR';
    default:
      return false;
  }
}

/**
 * ยืนยันสิทธิ์ หากไม่มีสิทธิ์จะ throw ForbiddenError ทันที
 */
export function assertCan(user: SessionUser | null | undefined, permission: Permission): void {
  if (!can(user, permission)) {
    throw new ForbiddenError(`User lacks required permission: ${permission}`);
  }
}

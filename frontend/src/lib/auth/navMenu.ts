import { can, PERMISSIONS, type SessionUser } from '@/lib/auth/permissions';

export interface NavMenuItem {
  label: string;
  href: string;
}

export const STEP_MENU_BASE: readonly NavMenuItem[] = [
  { label: 'แจ้งปัญหา', href: '/public/report' },
  { label: 'ตรวจสอบสถานะ', href: '/public/status' },
];

export const MENU_OVERVIEW: NavMenuItem = { label: 'ภาพรวม', href: '/dashboard' };
export const MENU_OOC: NavMenuItem = { label: 'งานนอกสัญญา', href: '/public/report-ooc' };

/**
 * คำนวณรายการเมนูในแถบนำทางหลักตามสถานะล็อกอินและสิทธิ์ของผู้ใช้
 * หากผู้ใช้ไม่มีสิทธิ์ PERMISSIONS.OOC_VIEW จะไม่มีการ emit เมนู MENU_OOC เด็ดขาด
 */
export function computeStepMenu(
  isLoggedIn: boolean,
  sessionUser: SessionUser | null | undefined,
): readonly NavMenuItem[] {
  if (!isLoggedIn) {
    return STEP_MENU_BASE;
  }

  const showOoc = can(sessionUser, PERMISSIONS.OOC_VIEW);

  if (showOoc) {
    return [MENU_OVERVIEW, STEP_MENU_BASE[0], MENU_OOC, STEP_MENU_BASE[1]];
  }

  return [MENU_OVERVIEW, STEP_MENU_BASE[0], STEP_MENU_BASE[1]];
}

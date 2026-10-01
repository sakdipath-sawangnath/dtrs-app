/** สิทธิ์ที่ API และเมนูใช้กับงานนอกสัญญา */
export const MENU_OUT_OF_CONTRACT_PERMISSION = "menu.outOfContract";

export const DEFAULT_OUT_OF_CONTRACT_ROLES = ["ADMIN", "STAFF", "SUPERVISOR"] as const;

export type OutOfContractAccess = {
  /** false = กำลังโหลดสิทธิ์จาก API (permissions === null) */
  ready: boolean;
  canAccess: boolean;
};

export function resolveOutOfContractAccess(input: {
  permissions: string[] | null;
  userRole: string;
}): OutOfContractAccess {
  const role = String(input.userRole ?? "").trim().toUpperCase();
  const perms = input.permissions;

  // ขณะที่ permissions ยังโหลดไม่เสร็จ (null):
  if (perms === null) {
    const isBuiltinAllowed = DEFAULT_OUT_OF_CONTRACT_ROLES.some((r) => r === role);
    return { ready: false, canAccess: isBuiltinAllowed };
  }

  // เมื่อ permissions โหลดแล้ว: ตรวจสอบจาก permissions list ก่อน (ตามการตั้งค่าใน /roles)
  if (Array.isArray(perms) && perms.length > 0) {
    return { ready: true, canAccess: perms.includes(MENU_OUT_OF_CONTRACT_PERMISSION) };
  }

  // ถ้า permissions list ว่าง (fallback บทบาทมาตรฐาน)
  const isBuiltinAllowed = DEFAULT_OUT_OF_CONTRACT_ROLES.some((r) => r === role);
  return { ready: true, canAccess: isBuiltinAllowed };
}

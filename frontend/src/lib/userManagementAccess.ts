/** สิทธิ์ที่ API ใช้กับ GET/POST/PATCH/DELETE /users */
export const MENU_USERS_PERMISSION = "menu.users";

export type UserRoleOption = { value: string; label: string };

export type UserManagementAccess = {
  /** false = ยังไม่รู้สิทธิ์ (กำลังโหลด) — ห้ามแสดง「ดูอย่างเดียว」เป็นคำตอบสุดท้าย */
  ready: boolean;
  canManage: boolean;
};

export function resolveUserManagementAccess(input: {
  permissions: string[] | null;
  userRole: string;
}): UserManagementAccess {
  const role = String(input.userRole ?? "").trim().toUpperCase();
  const perms = input.permissions;

  if (perms === null) {
    return { ready: false, canManage: role === "ADMIN" };
  }

  const canManage =
    perms.length > 0
      ? perms.includes(MENU_USERS_PERMISSION)
      : role === "ADMIN";
  return { ready: true, canManage };
}

export function usersManagementSubtitle(access: UserManagementAccess): string {
  if (access.canManage) {
    return "เพิ่ม/แก้ไข/ลบผู้ใช้ และกำหนด Role (ADMIN, STAFF, USER)";
  }
  if (!access.ready) {
    return "รายชื่อผู้ใช้และบทบาท";
  }
  return "รายชื่อผู้ใช้และบทบาท (ดูอย่างเดียว)";
}

/** รวมบทบาทมาตรฐานกับแคตตาล็อกจาก `/roles/public-styles` (ไม่ต้องมี menu.roles) */
export function mergeUserRoleOptions(
  builtin: UserRoleOption[],
  catalog: Array<{ code: string; name?: string | null }>,
): UserRoleOption[] {
  const map = new Map<string, UserRoleOption>();
  for (const o of builtin) {
    const value = String(o.value || "").toUpperCase().trim();
    if (!value) continue;
    map.set(value, { value, label: o.label });
  }
  for (const row of catalog) {
    const code = String(row.code || "").toUpperCase().trim();
    if (!code) continue;
    const name = row.name?.trim();
    map.set(code, { value: code, label: name ? name : code });
  }
  return [...map.values()];
}

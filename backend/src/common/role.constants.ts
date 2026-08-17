/** Built-in role codes (เดิมจาก Prisma enum Role) — บทบาทที่สร้างเองใช้ AppRole.code */
export const Role = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  USER: 'USER',
  SUPERVISOR: 'SUPERVISOR',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const BUILTIN_ROLE_CODES: readonly string[] = Object.values(Role);

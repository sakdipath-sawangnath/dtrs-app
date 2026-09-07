/**
 * ตัด audit จาก Reopen ที่ backend ต่อท้าย fixNote
 * รูปแบบ: `[Reopen <stamp>] <reason>` — ทั้งทั้งบรรทัดและกลางบรรทัด
 * ไม่ให้โผล่ในรายงาน PDF (ยังเก็บใน DB / หน้าแก้ไขงานตามเดิม)
 */
const REOPEN_AUDIT_RE = /\[Reopen[^\]]*\][^\n]*/g;

export function stripReopenAuditFromFixNote(
  note: string | null | undefined,
): string {
  if (!note) return "";
  return note
    .replace(REOPEN_AUDIT_RE, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join("\n")
    .trim();
}

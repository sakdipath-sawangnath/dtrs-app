/**
 * Security Audit Logging Utility
 * บันทึกประวัติการพยายามเข้าถึงทรัพยากรที่ไม่มีสิทธิ์ในระดับ WARN
 * โดยไม่บันทึกข้อมูลอ่อนไหวหรือเนื้อหาของงาน
 */

export interface SecurityAuditEntry {
  event: 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'UNAUTHENTICATED_ACCESS_ATTEMPT' | 'OOC_ACCESS_DENIED';
  userId?: string | number | null;
  role?: string | null;
  path: string;
  timestamp: string;
  ip?: string | null;
  reason?: string;
}

export function logSecurityAudit(entry: Omit<SecurityAuditEntry, 'timestamp'>): void {
  const payload: SecurityAuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // ส่งออก structured log ในระดับ WARN
  console.warn(`[SECURITY AUDIT] ${JSON.stringify(payload)}`);
}

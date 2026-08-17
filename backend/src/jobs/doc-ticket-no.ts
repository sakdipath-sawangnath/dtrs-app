/**
 * Doc No helpers (Meeting-11082026 Phase C)
 * — pure functions สำหรับ unit test โดยไม่ต้อง mock Prisma
 */

/** padStart(4) แล้วโตตามค่าจริง (ไม่มีเพดาน) */
export function formatDocRunning(n: number): string {
  if (!Number.isFinite(n) || n < 1) {
    throw new RangeError('running ต้องเป็นจำนวนเต็ม ≥ 1');
  }
  return String(Math.trunc(n)).padStart(4, '0');
}

/**
 * ในสัญญา: CM-SHF-2002-XXXX
 * นอกสัญญา: YYYYMM + running
 */
export function formatDocTicketNo(params: {
  isOutOfContract: boolean;
  running: number;
  /** YYYYMM (Asia/Bangkok) — จำเป็นเมื่อ isOutOfContract */
  periodYm?: string;
}): string {
  const running = formatDocRunning(params.running);
  if (params.isOutOfContract) {
    const period = (params.periodYm ?? '').trim();
    if (!/^\d{6}$/.test(period)) {
      throw new RangeError('periodYm ต้องเป็น YYYYMM 6 หลัก');
    }
    return `${period}${running}`;
  }
  return `CM-SHF-2002-${running}`;
}

const IN_CONTRACT_PREFIX = 'CM-SHF-2002-';

/**
 * เลขทางการหลังจำแนกเอกสาร — ไม่ใช่ hex 8 ตัวตอนสร้างงาน
 * ในสัญญา: CM-SHF-2002- + running ≥4 หลัก
 * นอกสัญญา: YYYYMM + running ≥4 หลัก (รวมอย่างน้อย 10 หลัก)
 */
export function isFormalDocTicketNo(
  ticketNo: string | null | undefined,
): boolean {
  const s = (ticketNo ?? '').trim();
  if (!s) return false;
  if (s.startsWith(IN_CONTRACT_PREFIX)) {
    return /^\d{4,}$/.test(s.slice(IN_CONTRACT_PREFIX.length));
  }
  return /^\d{10,}$/.test(s);
}

/** YYYYMM ตาม Asia/Bangkok */
export function bangkokYearMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${y}${m}`;
}

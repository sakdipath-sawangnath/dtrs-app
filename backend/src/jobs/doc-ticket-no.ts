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

export const REQUEST_TICKET_PREFIX = 'RQ-CM-';
export const REQUEST_TICKET_RE = /^RQ-CM-\d{4}\d{4,}$/;

/**
 * รูปแบบเลขที่ใบแจ้งซ่อมเริ่มต้น (Reference No.): RQ-CM-YYYYXXXX
 * - RQ-CM = fixed prefix
 * - YYYY = 4-digit year (Asia/Bangkok)
 * - XXXX = 4-digit sequential running number
 */
export function formatRequestTicketNo(params: {
  year: string;
  running: number;
}): string {
  const year = (params.year ?? '').trim();
  if (!/^\d{4}$/.test(year)) {
    throw new RangeError('year ต้องเป็น YYYY 4 หลัก');
  }
  const running = formatDocRunning(params.running);
  return `${REQUEST_TICKET_PREFIX}${year}${running}`;
}

export function isRequestTicketNo(
  ticketNo: string | null | undefined,
): boolean {
  const s = (ticketNo ?? '').trim();
  return REQUEST_TICKET_RE.test(s);
}

/**
 * ในสัญญา: CM-SHF-YYYY-XXXX (YYYY = Asia/Bangkok ณ วันจำแนก; running ไม่รีเซ็ต)
 * นอกสัญญา: YYYYMM + running
 */
export function formatDocTicketNo(params: {
  isOutOfContract: boolean;
  running: number;
  /** YYYYMM (Asia/Bangkok) — จำเป็นเมื่อ isOutOfContract */
  periodYm?: string;
  /** YYYY (Asia/Bangkok) — จำเป็นเมื่อในสัญญา */
  periodYear?: string;
}): string {
  const running = formatDocRunning(params.running);
  if (params.isOutOfContract) {
    const period = (params.periodYm ?? '').trim();
    if (!/^\d{6}$/.test(period)) {
      throw new RangeError('periodYm ต้องเป็น YYYYMM 6 หลัก');
    }
    return `${period}${running}`;
  }
  const year = (params.periodYear ?? '').trim();
  if (!/^\d{4}$/.test(year)) {
    throw new RangeError('periodYear ต้องเป็น YYYY 4 หลัก');
  }
  return `CM-SHF-${year}-${running}`;
}

/** เลขในสัญญา: CM-SHF-YYYY- + running ≥4 หลัก (รวมเลขเก่า CM-SHF-2002-…) */
const IN_CONTRACT_DOC_RE = /^CM-SHF-\d{4}-\d{4,}$/;

/**
 * เลขทางการหลังจำแนกเอกสาร — ไม่ใช่ hex 8 ตัวตอนสร้างงาน
 * ในสัญญา: CM-SHF-YYYY- + running ≥4 หลัก
 * นอกสัญญา: YYYYMM + running ≥4 หลัก (รวมอย่างน้อย 10 หลัก)
 */
export function isFormalDocTicketNo(
  ticketNo: string | null | undefined,
): boolean {
  const s = (ticketNo ?? '').trim();
  if (!s) return false;
  if (IN_CONTRACT_DOC_RE.test(s)) return true;
  return /^\d{10,}$/.test(s);
}

/** YYYY ตาม Asia/Bangkok */
export function bangkokYear(now: Date = new Date()): string {
  return bangkokYearMonth(now).slice(0, 4);
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

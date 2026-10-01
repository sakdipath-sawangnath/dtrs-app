export const REQUEST_TICKET_PREFIX = "RQ-CM-";
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
  const year = (params.year ?? "").trim();
  if (!/^\d{4}$/.test(year)) {
    throw new RangeError("year ต้องเป็น YYYY 4 หลัก");
  }
  if (!Number.isFinite(params.running) || params.running < 1) {
    throw new RangeError("running ต้องเป็นจำนวนเต็ม ≥ 1");
  }
  const running = String(Math.trunc(params.running)).padStart(4, "0");
  return `${REQUEST_TICKET_PREFIX}${year}${running}`;
}

export function isRequestTicketNo(
  ticketNo: string | null | undefined,
): boolean {
  const s = (ticketNo ?? "").trim();
  return REQUEST_TICKET_RE.test(s);
}

export const REQUEST_OOC_TICKET_PREFIX = "RQ-OOC-";
export const REQUEST_OOC_TICKET_RE = /^RQ-OOC-\d{4}\d{4,}$/;

/**
 * รูปแบบเลขที่ใบแจ้งซ่อมนอกสัญญาเริ่มต้น: RQ-OOC-YYYYXXXX
 */
export function formatRequestOocTicketNo(params: {
  year: string;
  running: number;
}): string {
  const year = (params.year ?? "").trim();
  if (!/^\d{4}$/.test(year)) {
    throw new RangeError("year ต้องเป็น YYYY 4 หลัก");
  }
  if (!Number.isFinite(params.running) || params.running < 1) {
    throw new RangeError("running ต้องเป็นจำนวนเต็ม ≥ 1");
  }
  const running = String(Math.trunc(params.running)).padStart(4, "0");
  return `${REQUEST_OOC_TICKET_PREFIX}${year}${running}`;
}

export function isRequestOocTicketNo(
  ticketNo: string | null | undefined,
): boolean {
  const s = (ticketNo ?? "").trim();
  return REQUEST_OOC_TICKET_RE.test(s);
}

export function isAnyRequestTicketNo(
  ticketNo: string | null | undefined,
): boolean {
  return isRequestTicketNo(ticketNo) || isRequestOocTicketNo(ticketNo);
}

export const OOC_DOC_RE = /^OOC-\d{4}-\d{4,}$/;

/**
 * รูปแบบเลขเอกสารทางการนอกสัญญาใหม่: OOC-YYYY-XXXX
 */
export function formatOocDocTicketNo(params: {
  year: string;
  running: number;
}): string {
  const year = (params.year ?? "").trim();
  if (!/^\d{4}$/.test(year)) {
    throw new RangeError("year ต้องเป็น YYYY 4 หลัก");
  }
  if (!Number.isFinite(params.running) || params.running < 1) {
    throw new RangeError("running ต้องเป็นจำนวนเต็ม ≥ 1");
  }
  const running = String(Math.trunc(params.running)).padStart(4, "0");
  return `OOC-${year}-${running}`;
}

/** เลขในสัญญา: CM-SHF-YYYY- + running ≥4 หลัก (รวมเลขเก่า CM-SHF-2002-…) */
export const IN_CONTRACT_DOC_RE = /^CM-SHF-\d{4}-\d{4,}$/;

/**
 * เลขทางการหลังจำแนกเอกสาร (ไม่ใช่ RQ-CM หรือ RQ-OOC หรือ hex ตอนสร้างงาน)
 * ในสัญญา: CM-SHF-YYYY-XXXX · นอกสัญญา: OOC-YYYY-XXXX หรือ legacy YYYYMM####
 */
export function isFormalDocTicketNo(
  ticketNo: string | null | undefined,
): boolean {
  const s = (ticketNo ?? "").trim();
  if (!s) return false;
  if (IN_CONTRACT_DOC_RE.test(s)) return true;
  if (OOC_DOC_RE.test(s)) return true;
  return /^\d{10,}$/.test(s);
}

/**
 * งานนอกสัญญาที่จำแนกเลขทางการแล้ว (RESOLVED + formal ticket).
 * ใช้ตรวจ semantic / unit test — ไม่ใช้ซ่อนรายการจาก `/dashboard/all` หรือ `/my-jobs` แล้ว
 * (คิวย่อ `/dashboard/out-of-contract` กรองด้วย `isFormalDocTicketNo` โดยตรง)
 */
export function isClassifiedOutOfContractResolved(job: {
  status?: string;
  isOutOfContract?: boolean;
  ticketNo?: string | null;
}): boolean {
  return (
    job.status === "RESOLVED" &&
    job.isOutOfContract === true &&
    isFormalDocTicketNo(job.ticketNo)
  );
}

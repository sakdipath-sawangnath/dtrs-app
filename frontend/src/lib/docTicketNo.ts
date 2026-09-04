/** เลขในสัญญา: CM-SHF-YYYY- + running ≥4 หลัก (รวมเลขเก่า CM-SHF-2002-…) */
const IN_CONTRACT_DOC_RE = /^CM-SHF-\d{4}-\d{4,}$/;

/**
 * เลขทางการหลังจำแนกเอกสาร (ไม่ใช่ hex 8 ตัวตอนสร้างงาน)
 * ในสัญญา: CM-SHF-YYYY-XXXX · นอกสัญญา: YYYYMM####
 */
export function isFormalDocTicketNo(
  ticketNo: string | null | undefined,
): boolean {
  const s = (ticketNo ?? "").trim();
  if (!s) return false;
  if (IN_CONTRACT_DOC_RE.test(s)) return true;
  return /^\d{10,}$/.test(s);
}

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

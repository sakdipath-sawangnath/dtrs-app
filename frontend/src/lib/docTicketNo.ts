const IN_CONTRACT_PREFIX = "CM-SHF-2002-";

/**
 * เลขทางการหลังจำแนกเอกสาร (ไม่ใช่ hex 8 ตัวตอนสร้างงาน)
 */
export function isFormalDocTicketNo(
  ticketNo: string | null | undefined,
): boolean {
  const s = (ticketNo ?? "").trim();
  if (!s) return false;
  if (s.startsWith(IN_CONTRACT_PREFIX)) {
    return /^\d{4,}$/.test(s.slice(IN_CONTRACT_PREFIX.length));
  }
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

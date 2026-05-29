/** งานที่ยังไม่มีผู้รับผิดชอบและสามารถมอบหมาย/รับงานได้ (รวมข้อมูล import เก่า) */
export function jobNeedsAssignee(job: {
  status: string;
  assignedTo?: unknown | null;
}): boolean {
  if (job.assignedTo) return false;
  return (
    job.status === "PENDING" ||
    job.status === "IN_PROGRESS" ||
    job.status === "RESOLVED"
  );
}

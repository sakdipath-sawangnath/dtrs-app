/** สอดคล้องกับ `JobsService` ฝั่ง backfill-dates — ใช้ Asia/Bangkok (+07 ไม่มี DST) */

export const JOB_BACKFILL_MIN_YEAR = 2000;

export function getEndOfTodayBangkok(): Date {
  const ymd = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${ymd}T23:59:59.999+07:00`);
}

export function getStartOfMinBackfillDateBangkok(): Date {
  return new Date(`${JOB_BACKFILL_MIN_YEAR}-01-01T00:00:00.000+07:00`);
}

/**
 * @returns ข้อความ error ภาษาไทย หรือ null ถ้าผ่าน
 */
export function validateBackfillDate(
  d: Date,
  fieldName: "reportDate" | "fixDate",
): string | null {
  const start = getStartOfMinBackfillDateBangkok();
  const end = getEndOfTodayBangkok();
  if (d.getTime() < start.getTime()) {
    return fieldName === "reportDate"
      ? `วันที่แจ้งต้องไม่ก่อนปี ${JOB_BACKFILL_MIN_YEAR} — กรุณาตรวจสอบปี`
      : `วันที่ปิดงานต้องไม่ก่อนปี ${JOB_BACKFILL_MIN_YEAR} — กรุณาตรวจสอบปี`;
  }
  if (d.getTime() > end.getTime()) {
    return fieldName === "reportDate"
      ? "วันที่แจ้งต้องไม่เกินวันนี้ (ตามเวลาไทย) — ตรวจสอบปีหรือวันที่ในอนาคต"
      : "วันที่ปิดงานต้องไม่เกินวันนี้ (ตามเวลาไทย) — ตรวจสอบปีหรือวันที่ในอนาคต";
  }
  return null;
}

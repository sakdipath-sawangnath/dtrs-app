/**
 * ใช้ร่วมสคริปต์ audit/fix วันที่ Job — สอดคล้อง JobsService (Bangkok + backfill)
 */
import { crc32 } from 'node:zlib';

export const BACKFILL_MIN_YEAR = 2000;

/** สิ้นวันปัจจุบันตาม Asia/Bangkok — เทียบกับค่า UTC ใน DB */
export function getEndOfTodayBangkok(): Date {
  const ymd = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${ymd}T23:59:59.999+07:00`);
}

export function bangkokYmd(d: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function bangkokCalendarYear(d: Date): number {
  return parseInt(bangkokYmd(d).slice(0, 4), 10);
}

/** ช่วง [gte, lt) UTC ที่ครอบปีปฏิทิน Bangkok = calendarYear เต็มปี */
export function bangkokYearUtcBounds(calendarYear: number): {
  gte: Date;
  lt: Date;
} {
  const gte = new Date(`${calendarYear - 1}-12-31T17:00:00.000Z`);
  const lt = new Date(`${calendarYear}-12-31T17:00:00.000Z`);
  return { gte, lt };
}

export function formatBangkokDisplay(d: Date): string {
  return d.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function crc32Unsigned(input: string): number {
  return crc32(Buffer.from(input, 'utf8')) >>> 0;
}

/** นาที ±(10..15) — สอดคล้อง MySQL CRC32 */
export function offsetMinutes(label: string): number {
  const c = crc32Unsigned(label);
  const sign = c % 2 === 0 ? 1 : -1;
  const mag = 10 + (c % 6);
  return sign * mag;
}

/** สลับเดือน↔วัน + ลดปี 1 (กฎเดียวกับ fix-job-dates / SQL batch) */
export function transformCorruptedDate(d: Date): Date {
  const ny = d.getFullYear() - 1;
  const monthIndex = d.getDate() - 1;
  const day = d.getMonth() + 1;
  return new Date(
    ny,
    monthIndex,
    day,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds(),
  );
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

export function getStartOfMinBackfillDateBangkok(): Date {
  return new Date(`${BACKFILL_MIN_YEAR}-01-01T00:00:00.000+07:00`);
}

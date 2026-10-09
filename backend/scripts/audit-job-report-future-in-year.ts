/**
 * ตรวจ Job ที่วันที่แจ้ง (reportDate) ตกในปีปฏิทินไทย (Asia/Bangkok) ตาม AUDIT_YEAR
 * แล้วเทียบกับ "สิ้นวันนี้" ตามเวลาไทย — หาเคสที่แจ้ง **ล่วงหน้า** (ไม่ควรเกิด)
 * มักมาจากการสลับเดือน/วัน หรือปีผิดตอนกรอก/import
 *
 * สคริปต์นี้ **อ่านอย่างเดียว (dry-run เสมอ)** ไม่มีการอัปเดตฐานข้อมูล
 * แก้ข้อมูลชุดเดียวกัน: `fix-job-report-future-audited.ts` (dry / APPLY_WRITE)
 *
 * รัน (จาก backend):
 *   npx ts-node scripts/audit-job-report-future-in-year.ts
 *
 * ปีที่ตรวจ (ค่าเริ่มต้น 2026):
 *   $env:AUDIT_YEAR = "2026"; npx ts-node scripts/audit-job-report-future-in-year.ts
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  bangkokCalendarYear,
  bangkokYearUtcBounds,
  formatBangkokDisplay,
  getEndOfTodayBangkok,
} from './lib/jobBangkokAndCorruptionFix';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const rawYear = process.env.AUDIT_YEAR?.trim() ?? '2026';
  const auditYear = parseInt(rawYear, 10);
  if (!Number.isInteger(auditYear) || auditYear < 2000 || auditYear > 2100) {
    console.error('AUDIT_YEAR ต้องเป็นตัวเลขปี 2000–2100');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('ไม่พบ DATABASE_URL — ตั้งใน backend/.env');
    process.exit(1);
  }

  const endTodayBkk = getEndOfTodayBangkok();
  const { gte, lt } = bangkokYearUtcBounds(auditYear);

  console.log(
    '--- audit-job-report-future-in-year (อ่านอย่างเดียว / dry-run) ---',
  );
  console.log(`AUDIT_YEAR (ปฏิทิน Bangkok): ${auditYear}`);
  console.log(
    `สิ้นวันนี้ Bangkok (เทียบกับ reportDate): ${endTodayBkk.toISOString()}  ≈  ${formatBangkokDisplay(endTodayBkk)}`,
  );
  console.log('');

  const candidates = await prisma.job.findMany({
    where: {
      reportDate: { not: null, gte, lt },
    },
    select: {
      id: true,
      ticketNo: true,
      status: true,
      reportDate: true,
      createdAt: true,
    },
    orderBy: { id: 'asc' },
  });

  const inYear = candidates.filter(
    (j) => j.reportDate && bangkokCalendarYear(j.reportDate) === auditYear,
  );

  const invalid = inYear.filter(
    (j) => j.reportDate && j.reportDate.getTime() > endTodayBkk.getTime(),
  );

  console.log(
    `รวม Job ที่มี reportDate ในช่วง UTC รอบปี ${auditYear} (Bangkok): ${inYear.length} แถว`,
  );
  console.log(
    `เคส "แจ้งล่วงหน้า" (reportDate > สิ้นวันนี้ Bangkok): ${invalid.length} แถว`,
  );
  console.log('');

  if (invalid.length === 0) {
    console.log('ไม่พบรายการผิดเงื่อนไข');
    return;
  }

  for (const j of invalid) {
    const rd = j.reportDate!;
    const msPast = rd.getTime() - endTodayBkk.getTime();
    const daysRough = msPast / (24 * 60 * 60 * 1000);
    console.log({
      id: j.id,
      ticketNo: j.ticketNo,
      status: j.status,
      reportDateUtc: rd.toISOString(),
      reportDateBangkok: formatBangkokDisplay(rd),
      createdAtUtc: j.createdAt.toISOString(),
      approxDaysFutureVsEndTodayBkk: Math.round(daysRough * 10) / 10,
      note: 'น่าสงสัยว่าสลับเดือน/วันหรือปีผิด — ตรวจเอกสารก่อนแก้ (ใช้ backfill หรือสคริปต์ fix-job-report-future-audited.ts)',
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

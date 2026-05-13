/**
 * แก้ reportDate เฉพาะ Job ที่ audit-job-report-future-in-year จับได้:
 * - ปีปฏิทิน Bangkok = AUDIT_YEAR (ค่าเริ่มต้น 2026)
 * - reportDate > สิ้นวันนี้ Bangkok (แจ้งล่วงหน้า)
 *
 * ใช้กฎเดียวกับ fix-job-dates-by-tickets: สลับเดือน↔วัน + ปี −1 + เลื่อน ±10..15 นาที
 * อัปเดตเฉพาะ reportDate (ไม่แตะ fixDate)
 *
 * ค่าเริ่มต้น dry-run — ตั้ง APPLY_WRITE=1 เพื่อเขียนจริง (และอย่าตั้ง DRY_RUN)
 * ถ้าเทอร์มินัลค้าง APPLY_WRITE จากรอบก่อน ให้ใส่ DRY_RUN=1 เพื่อบังคับ dry-run
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  addMinutes,
  BACKFILL_MIN_YEAR,
  bangkokCalendarYear,
  bangkokYearUtcBounds,
  formatBangkokDisplay,
  getEndOfTodayBangkok,
  getStartOfMinBackfillDateBangkok,
  offsetMinutes,
  transformCorruptedDate,
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

  /** DRY_RUN มีลำดับสูงกว่า APPLY_WRITE — กัน env ค้างจากเทอร์มินัล */
  const forceDry =
    process.env.DRY_RUN === '1' ||
    process.env.DRY_RUN === 'true' ||
    process.env.DRY_RUN === 'yes';
  const applyWrite =
    !forceDry &&
    (process.env.APPLY_WRITE === '1' || process.env.APPLY_WRITE === 'true');
  const dry = !applyWrite;

  if (!process.env.DATABASE_URL) {
    console.error('ไม่พบ DATABASE_URL — ตั้งใน backend/.env');
    process.exit(1);
  }

  const endTodayBkk = getEndOfTodayBangkok();
  const minBkk = getStartOfMinBackfillDateBangkok();
  const { gte, lt } = bangkokYearUtcBounds(auditYear);

  console.log('--- fix-job-report-future-audited ---');
  console.log(`AUDIT_YEAR (Bangkok): ${auditYear}`);
  console.log(
    dry
      ? 'โหมด DRY_RUN — ตั้ง APPLY_WRITE=1 เพื่ออัปเดตจริง'
      : 'โหมดเขียน DB (APPLY_WRITE=1)',
  );
  console.log(`สิ้นวันนี้ Bangkok: ${formatBangkokDisplay(endTodayBkk)}`);
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
      fixDate: true,
    },
    orderBy: { id: 'asc' },
  });

  const inYear = candidates.filter(
    (j) => j.reportDate && bangkokCalendarYear(j.reportDate) === auditYear,
  );

  const invalid = inYear.filter(
    (j) => j.reportDate && j.reportDate.getTime() > endTodayBkk.getTime(),
  );

  console.log(`แถวที่ตรงเงื่อนไข audit (ล่วงหน้า): ${invalid.length} แถว`);
  console.log('');

  let wouldUpdate = 0;
  let skippedStillFuture = 0;
  let skippedTooOld = 0;
  let skippedNoChange = 0;

  for (const j of invalid) {
    const rd = j.reportDate!;
    const tn = j.ticketNo ?? String(j.id);
    const nextReport = addMinutes(
      transformCorruptedDate(rd),
      offsetMinutes(`${tn}:report`),
    );

    if (nextReport.getTime() > endTodayBkk.getTime()) {
      skippedStillFuture += 1;
      console.warn({
        id: j.id,
        ticketNo: tn,
        reportAfterBangkok: formatBangkokDisplay(nextReport),
        note: 'หลังแปลงยังล่วงหน้า — ข้าม (ต้องตรวจมือ / กฎอื่น)',
      });
      continue;
    }

    if (nextReport.getTime() < minBkk.getTime()) {
      skippedTooOld += 1;
      console.warn({
        id: j.id,
        ticketNo: tn,
        reportAfter: nextReport.toISOString(),
        note: `หลังแปลงก่อนปี ${BACKFILL_MIN_YEAR} — ข้าม`,
      });
      continue;
    }

    if (nextReport.getTime() === rd.getTime()) {
      skippedNoChange += 1;
      continue;
    }

    wouldUpdate += 1;
    console.log({
      id: j.id,
      ticketNo: tn,
      status: j.status,
      reportBeforeUtc: rd.toISOString(),
      reportBeforeBangkok: formatBangkokDisplay(rd),
      reportAfterUtc: nextReport.toISOString(),
      reportAfterBangkok: formatBangkokDisplay(nextReport),
      fixDateUnchanged: j.fixDate?.toISOString() ?? null,
    });

    if (!dry) {
      await prisma.job.update({
        where: { id: j.id },
        data: { reportDate: nextReport },
      });
    }
  }

  console.log('');
  console.log({
    invalidRows: invalid.length,
    willUpdateReportDate: wouldUpdate,
    skippedStillFutureAfterTransform: skippedStillFuture,
    skippedBeforeMinYear: skippedTooOld,
    skippedUnchanged: skippedNoChange,
  });

  if (dry) {
    console.log('จบ dry-run (ไม่เขียน DB)');
  } else {
    console.log(`อัปเดต reportDate สำเร็จ ${wouldUpdate} แถว`);
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

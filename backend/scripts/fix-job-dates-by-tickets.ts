/**
 * แก้ reportDate / fixDate (import ผิดปี + สลับวัน/เดือน)
 *
 * กฎเดียวกับ fix-job-report-fix-dates-ticket-batch.sql:
 * - ปีใหม่ = ปีเดิม - 1
 * - เดือนใหม่ = ค่า "วัน" เดิมของวันที่นั้น, วันใหม่ = ค่า "เดือน" เดิม
 * - เลื่อนเวลา ±10..15 นาที (zlib.crc32 สอดคล้อง MySQL CRC32 สำหรับ ASCII)
 *
 * ─── โหมด 1: ตาม ticketNo (เดิม) ───
 *   cd backend && npx ts-node scripts/fix-job-dates-by-tickets.ts
 *   Dry:  $env:DRY_RUN="true";  npx ts-node scripts/fix-job-dates-by-tickets.ts
 *   เขียน: ไม่ตั้ง DRY_RUN หรือ DRY_RUN=false
 *
 * ─── โหมด 2: ทุกแถวที่ YEAR(reportDate) หรือ YEAR(fixDate) = ปีที่ระบุ (แนะนำ dry ก่อน) ───
 *   Dry (ค่าเริ่มต้น — ไม่เขียน DB จนกว่าจะใส่ APPLY_WRITE):
 *     $env:FIX_BY_YEAR="2027"; npx ts-node scripts/fix-job-dates-by-tickets.ts
 *   เขียนจริง:
 *     $env:FIX_BY_YEAR="2027"; $env:APPLY_WRITE="1"; npx ts-node scripts/fix-job-dates-by-tickets.ts
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  addMinutes,
  offsetMinutes,
  transformCorruptedDate,
} from './lib/jobBangkokAndCorruptionFix';

config({ path: resolve(__dirname, '../.env') });

const TICKET_NOS = [
  'aac2ae38',
  'f0b086b8',
  'ce12b801',
  '8fb4b3e8',
  '7837b3ce',
  '2ff34106',
  'dc812481',
  'c2af005f',
  'befefd0e',
  '31ee4891',
  '34325a8a',
  '2b032122',
  'b7f8817e',
  '6585dd12',
  'f03f0524',
] as const;

/** แถวจาก ticket list ไม่มี fixReport/fixFix; แถวจาก FIX_BY_YEAR มีคอลัมน์ 0/1 จาก MySQL */
type JobDateRow = {
  id: number;
  ticketNo: string | null;
  reportDate: Date | null;
  fixDate: Date | null;
  fixReport?: number | bigint | null;
  fixFix?: number | bigint | null;
};

function flagTrue(v: number | bigint | null | undefined): boolean {
  if (v == null) return false;
  return Number(v) === 1;
}

const prisma = new PrismaClient();

function parseFixByYear(): number | null {
  const raw = process.env.FIX_BY_YEAR?.trim();
  if (!raw) return null;
  const y = Number(raw);
  if (!Number.isInteger(y) || y < 1990 || y > 2100) {
    console.error('FIX_BY_YEAR ต้องเป็นตัวเลขปี เช่น 2027 (ช่วง 1990–2100)');
    process.exit(1);
  }
  return y;
}

async function loadJobsByYear(year: number): Promise<JobDateRow[]> {
  return prisma.$queryRaw<JobDateRow[]>(Prisma.sql`
    SELECT
      id,
      ticketNo,
      reportDate,
      fixDate,
      (reportDate IS NOT NULL AND YEAR(reportDate) = ${year}) AS fixReport,
      (fixDate IS NOT NULL AND YEAR(fixDate) = ${year}) AS fixFix
    FROM Job
    WHERE
      (reportDate IS NOT NULL AND YEAR(reportDate) = ${year})
      OR (fixDate IS NOT NULL AND YEAR(fixDate) = ${year})
    ORDER BY id ASC
  `);
}

async function main() {
  const fixYear = parseFixByYear();
  const isByYear = fixYear != null;

  /** โหมดปี: ค่าเริ่มต้น dry-run — ต้อง APPLY_WRITE=1 จึงจะเขียน */
  const applyWrite =
    process.env.APPLY_WRITE === '1' || process.env.APPLY_WRITE === 'true';

  const dryTicketMode =
    process.env.DRY_RUN === '1' ||
    process.env.DRY_RUN === 'true' ||
    process.env.DRY_RUN === 'yes';

  const dry = isByYear ? !applyWrite : dryTicketMode;

  if (!process.env.DATABASE_URL) {
    console.error('ไม่พบ DATABASE_URL — ตั้งใน backend/.env แล้วรันใหม่');
    process.exit(1);
  }

  if (isByYear) {
    console.log(
      `โหมด FIX_BY_YEAR=${fixYear} — ใช้ YEAR() ของ MySQL ตรงกับ session time zone ของเซิร์ฟเวอร์`,
    );
    console.log(
      dry
        ? '--- DRY_RUN (ไม่เขียน DB) — ตั้ง APPLY_WRITE=1 เพื่ออัปเดตจริง ---'
        : '--- อัปเดตฐานข้อมูล (APPLY_WRITE=1) ---',
    );
  } else {
    console.log(
      dry
        ? '--- DRY_RUN (ไม่เขียน DB) โหมด ticketNo ---'
        : '--- อัปเดตฐานข้อมูล โหมด ticketNo ---',
    );
  }

  let rows: JobDateRow[];

  if (isByYear) {
    rows = await loadJobsByYear(fixYear);
  } else {
    rows = await prisma.job.findMany({
      where: { ticketNo: { in: [...TICKET_NOS] } },
      select: {
        id: true,
        ticketNo: true,
        reportDate: true,
        fixDate: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  if (rows.length === 0) {
    console.error(
      isByYear
        ? `ไม่พบ Job ที่ YEAR(reportDate) หรือ YEAR(fixDate) = ${fixYear}`
        : 'ไม่พบ Job ที่ ticketNo ตรงกับชุดที่ระบุ',
    );
    process.exit(1);
  }

  if (!isByYear) {
    const foundSet = new Set(rows.map((j) => j.ticketNo).filter(Boolean));
    const missing = TICKET_NOS.filter((t) => !foundSet.has(t));
    if (missing.length) {
      console.warn('ไม่พบ ticketNo ในฐาน:', missing.join(', '));
    }
  }

  let updated = 0;

  for (const j of rows) {
    const tn = j.ticketNo ?? String(j.id);

    let nextReport: Date | null = j.reportDate;
    let nextFix: Date | null = j.fixDate;

    if (isByYear) {
      if (flagTrue(j.fixReport) && j.reportDate) {
        nextReport = addMinutes(
          transformCorruptedDate(j.reportDate),
          offsetMinutes(`${tn}:report`),
        );
      }
      if (flagTrue(j.fixFix) && j.fixDate) {
        nextFix = addMinutes(
          transformCorruptedDate(j.fixDate),
          offsetMinutes(`${tn}:fix`),
        );
      }
    } else {
      if (!j.reportDate) {
        console.warn(`ข้าม id=${j.id} ticketNo=${tn} (reportDate เป็น null)`);
        continue;
      }
      nextReport = addMinutes(
        transformCorruptedDate(j.reportDate),
        offsetMinutes(`${tn}:report`),
      );
      nextFix =
        j.fixDate == null
          ? null
          : addMinutes(
              transformCorruptedDate(j.fixDate),
              offsetMinutes(`${tn}:fix`),
            );
    }

    const sameReport =
      (j.reportDate == null && nextReport == null) ||
      (j.reportDate != null &&
        nextReport != null &&
        j.reportDate.getTime() === nextReport.getTime());
    const sameFix =
      (j.fixDate == null && nextFix == null) ||
      (j.fixDate != null &&
        nextFix != null &&
        j.fixDate.getTime() === nextFix.getTime());

    if (sameReport && sameFix) {
      console.log({
        id: j.id,
        ticketNo: tn,
        note: 'ไม่เปลี่ยน (ค่าหลังแปลงเท่ากับเดิม)',
      });
      continue;
    }

    const logPayload: Record<string, unknown> = {
      id: j.id,
      ticketNo: tn,
      reportBefore: j.reportDate?.toISOString() ?? null,
      reportAfter: nextReport?.toISOString() ?? null,
      fixBefore: j.fixDate?.toISOString() ?? null,
      fixAfter: nextFix?.toISOString() ?? null,
    };
    if (isByYear) {
      logPayload.fixReportField = flagTrue(j.fixReport);
      logPayload.fixFixField = flagTrue(j.fixFix);
    }
    console.log(logPayload);

    if (!dry) {
      await prisma.job.update({
        where: { id: j.id },
        data: {
          reportDate: nextReport,
          fixDate: nextFix,
        },
      });
      updated += 1;
    }
  }

  if (dry) {
    console.log('จบ dry-run (ไม่มีการเขียน DB)');
  } else {
    console.log(`อัปเดตสำเร็จ ${updated} แถว`);
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

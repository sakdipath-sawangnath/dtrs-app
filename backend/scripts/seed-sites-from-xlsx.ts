/**
 * นำเข้า Site จาก Sites.xlsx (sheet `info`)
 * แมป: จังหวัด→province, อำเภอ→district, ตำบล→subdistrict,
 *       สถานที่/หน่วยงาน→agency, ชื่อสถานี→station
 *
 * รัน (ใน backend/):
 *   npm run script:seed-sites-xlsx
 *   npm run script:seed-sites-xlsx:dry
 *   npm run script:seed-sites-xlsx:clear   # ลบ Site ทั้งหมดก่อน — สำรอง DB ก่อน
 *
 *   Unix: DRY_RUN=1 npm run script:seed-sites-xlsx
 *   PowerShell: $env:DRY_RUN="1"; npm run script:seed-sites-xlsx
 *   หรือ: npx ts-node scripts/seed-sites-from-xlsx.ts --dry-run
 */

import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { loadWorkbookXlsx, worksheetToRecords } from './excel-sheet';

const cliArgs = new Set(process.argv.slice(2));
const prisma = new PrismaClient();
const DATA_FILE = path.join(__dirname, 'data', 'Sites.xlsx');
const SHEET = 'info';
const DRY_RUN =
  cliArgs.has('--dry-run') ||
  process.env.DRY_RUN === '1' ||
  process.env.DRY_RUN === 'true';
const CLEAR =
  cliArgs.has('--clear') ||
  process.env.CLEAR_SITES_BEFORE_IMPORT === '1' ||
  process.env.CLEAR_SITES_BEFORE_IMPORT === 'true';

const COL = {
  province: 'จังหวัด',
  district: 'อำเภอ',
  subdistrict: 'ตำบล',
  agency: 'สถานที่/หน่วยงาน',
  station: 'ชื่อสถานี',
} as const;

type SiteRow = {
  province: string;
  district: string;
  subdistrict: string | null;
  agency: string;
  station: string;
};

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v).trim();
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function parseRows(records: Record<string, unknown>[]): SiteRow[] {
  const out: SiteRow[] = [];
  const seen = new Set<string>();

  for (const rec of records) {
    const province = cellStr(rec[COL.province]);
    const district = cellStr(rec[COL.district]);
    const agency = cellStr(rec[COL.agency]);
    const station = cellStr(rec[COL.station]);
    const subRaw = cellStr(rec[COL.subdistrict]);
    const subdistrict = subRaw || null;

    if (!province || !district || !agency || !station) continue;

    const key = [province, district, subdistrict ?? '', agency, station].join(
      '\0',
    );
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ province, district, subdistrict, agency, station });
  }
  return out;
}

async function findExisting(row: SiteRow) {
  const sd = row.subdistrict?.trim() ?? '';
  return prisma.site.findFirst({
    where: {
      province: row.province,
      district: row.district,
      agency: row.agency,
      station: row.station,
      OR: sd
        ? [{ subdistrict: sd }]
        : [{ subdistrict: null }, { subdistrict: '' }],
    },
    select: { id: true },
  });
}

async function main() {
  const wb = await loadWorkbookXlsx(DATA_FILE);
  const ws = wb.getWorksheet(SHEET);
  if (!ws) {
    throw new Error(`ไม่พบ sheet "${SHEET}" ใน ${DATA_FILE}`);
  }

  const records = worksheetToRecords(ws);
  const rows = parseRows(records);
  console.log(
    `[seed-sites-xlsx] แถวจาก Excel: ${records.length}, ใช้ได้: ${rows.length}, DRY_RUN=${DRY_RUN}, CLEAR=${CLEAR}`,
  );

  if (rows.length === 0) {
    console.warn('ไม่มีแถวที่ import ได้ — ตรวจหัวคอลัมน์และไฟล์');
    return;
  }

  if (DRY_RUN) {
    console.log('ตัวอย่าง 3 แถวแรก:');
    rows.slice(0, 3).forEach((r, i) => console.log(i + 1, r));
    return;
  }

  if (CLEAR) {
    const deleted = await prisma.site.deleteMany({});
    console.log(
      `[seed-sites-xlsx] ลบ Site เก่า ${deleted.count} แถว (CLEAR_SITES_BEFORE_IMPORT=1)`,
    );
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await findExisting(row);
    if (existing) {
      if (CLEAR) {
        skipped++;
        continue;
      }
      await prisma.site.update({
        where: { id: existing.id },
        data: {
          province: row.province,
          district: row.district,
          subdistrict: row.subdistrict,
          agency: row.agency,
          station: row.station,
        },
      });
      updated++;
    } else {
      await prisma.site.create({
        data: {
          province: row.province,
          district: row.district,
          subdistrict: row.subdistrict,
          agency: row.agency,
          station: row.station,
        },
      });
      created++;
    }
  }

  console.log(
    `[seed-sites-xlsx] เสร็จ — สร้าง ${created}, อัปเดต ${updated}, ข้าม ${skipped}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

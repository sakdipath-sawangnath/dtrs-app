/**
 * นำเข้า master จังหวัด / อำเภอ / ตำบล จาก dump MS SQL (Navicat)
 * แหล่ง: scripts/data/TB_MST_Province.sql, TB_MST_District.sql, TB_MST_SubDistrict.sql
 *
 * รัน (ใน backend/):
 *   npx ts-node scripts/seed-locations-from-mssql.ts          # เขียนจริง
 *   DRY_RUN=1 npx ts-node scripts/seed-locations-from-mssql.ts # แค่ parse + สรุป
 *
 * แมป: Province_Name_TH → Province.name, District_Name_TH → District.name,
 *       SubDistrict_Name_TH → Subdistrict.name (trim ช่องว่าง; ข้าม Active≠1)
 * ไม่เก็บ Code / ชื่อ EN / รหัสไปรษณีย์ (schema ปัจจุบันไม่มีคอลัมน์เหล่านี้)
 * idempotent: createMany + skipDuplicates ตาม unique name / (parentId, name)
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, 'data');
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const BATCH = 500;

function parseNValues(line: string): string[] {
  const values: string[] = [];
  const re = /N'((?:[^']|'')*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    values.push(m[1].replace(/''/g, "'"));
  }
  return values;
}

function isActive(flag: string | undefined): boolean {
  return flag === '1' || flag?.toLowerCase() === 'true';
}

function readInsertLines(filename: string): string[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`ไม่พบไฟล์: ${filePath}`);
  }
  return fs
    .readFileSync(filePath, 'utf-8')
    .split(/\r?\n/)
    .filter((l) => l.includes('INSERT INTO'));
}

type ProvinceRow = { code: string; name: string };
type DistrictRow = { code: string; provinceCode: string; name: string };
type SubdistrictRow = { districtCode: string; name: string };

function parseProvinces(): ProvinceRow[] {
  const rows: ProvinceRow[] = [];
  const seen = new Set<string>();
  for (const line of readInsertLines('TB_MST_Province.sql')) {
    const v = parseNValues(line);
    if (v.length < 4 || !isActive(v[3])) continue;
    const code = v[0].trim();
    const name = v[1].trim();
    if (!code || !name || seen.has(code)) continue;
    seen.add(code);
    rows.push({ code, name });
  }
  return rows;
}

function parseDistricts(): DistrictRow[] {
  const rows: DistrictRow[] = [];
  const seen = new Set<string>();
  for (const line of readInsertLines('TB_MST_District.sql')) {
    const v = parseNValues(line);
    if (v.length < 5 || !isActive(v[4])) continue;
    const code = v[0].trim();
    const provinceCode = v[1].trim();
    const name = v[2].trim();
    if (!code || !provinceCode || !name || seen.has(code)) continue;
    seen.add(code);
    rows.push({ code, provinceCode, name });
  }
  return rows;
}

function parseSubdistricts(): SubdistrictRow[] {
  const rows: SubdistrictRow[] = [];
  const seen = new Set<string>();
  for (const line of readInsertLines('TB_MST_SubDistrict.sql')) {
    const v = parseNValues(line);
    if (v.length < 6 || !isActive(v[5])) continue;
    const districtCode = v[1].trim();
    const name = v[3].trim();
    if (!districtCode || !name) continue;
    const key = `${districtCode}|${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ districtCode, name });
  }
  return rows;
}

async function createManyBatched<T extends object>(
  label: string,
  rows: T[],
  createBatch: (batch: T[]) => Promise<{ count: number }>,
): Promise<number> {
  let created = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const result = await createBatch(batch);
    created += result.count;
    if ((i / BATCH) % 5 === 0 || i + BATCH >= rows.length) {
      console.log(`  … ${label}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
  }
  return created;
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN (ไม่เขียน DB) ===' : '=== นำเข้า Locations master ===');

  const provinces = parseProvinces();
  const districts = parseDistricts();
  const subdistricts = parseSubdistricts();

  console.log(`Parse: จังหวัด ${provinces.length}, อำเภอ ${districts.length}, ตำบล ${subdistricts.length}`);

  const provinceCodes = new Set(provinces.map((p) => p.code));
  const districtCodes = new Set(districts.map((d) => d.code));
  const orphanDistricts = districts.filter((d) => !provinceCodes.has(d.provinceCode));
  const orphanSubs = subdistricts.filter((s) => !districtCodes.has(s.districtCode));
  if (orphanDistricts.length) {
    console.warn(`⚠️  อำเภอที่ไม่มีจังหวัด: ${orphanDistricts.length}`);
  }
  if (orphanSubs.length) {
    console.warn(`⚠️  ตำบลที่ไม่มีอำเภอ: ${orphanSubs.length}`);
  }

  if (DRY_RUN) {
    console.log('ตัวอย่างจังหวัด:', provinces.slice(0, 3).map((p) => p.name).join(', '));
    console.log('ตัวอย่างอำเภอ:', districts.slice(0, 3).map((d) => d.name).join(', '));
    console.log('ตัวอย่างตำบล:', subdistricts.slice(0, 3).map((s) => s.name).join(', '));
    return;
  }

  const provinceCreated = await createManyBatched(
    'Province',
    provinces.map((p) => ({ name: p.name })),
    (data) => prisma.province.createMany({ data, skipDuplicates: true }),
  );
  console.log(`✓ Province สร้างใหม่ ${provinceCreated} (ข้ามชื่อซ้ำได้)`);

  const provinceRows = await prisma.province.findMany({ select: { id: true, name: true } });
  const provinceIdByName = new Map(provinceRows.map((p) => [p.name, p.id]));
  const provinceIdByCode = new Map<string, number>();
  for (const p of provinces) {
    const id = provinceIdByName.get(p.name);
    if (id != null) provinceIdByCode.set(p.code, id);
  }

  const districtPayload = districts
    .map((d) => {
      const provinceId = provinceIdByCode.get(d.provinceCode);
      if (provinceId == null) return null;
      return { name: d.name, provinceId };
    })
    .filter((x): x is { name: string; provinceId: number } => x != null);

  const districtCreated = await createManyBatched(
    'District',
    districtPayload,
    (data) => prisma.district.createMany({ data, skipDuplicates: true }),
  );
  console.log(`✓ District สร้างใหม่ ${districtCreated}`);

  const districtRows = await prisma.district.findMany({
    select: { id: true, name: true, provinceId: true },
  });
  const districtIdByProvinceAndName = new Map(
    districtRows.map((d) => [`${d.provinceId}|${d.name}`, d.id]),
  );
  const districtIdByCode = new Map<string, number>();
  for (const d of districts) {
    const provinceId = provinceIdByCode.get(d.provinceCode);
    if (provinceId == null) continue;
    const id = districtIdByProvinceAndName.get(`${provinceId}|${d.name}`);
    if (id != null) districtIdByCode.set(d.code, id);
  }

  const subPayload = subdistricts
    .map((s) => {
      const districtId = districtIdByCode.get(s.districtCode);
      if (districtId == null) return null;
      return { name: s.name, districtId };
    })
    .filter((x): x is { name: string; districtId: number } => x != null);

  const subCreated = await createManyBatched(
    'Subdistrict',
    subPayload,
    (data) => prisma.subdistrict.createMany({ data, skipDuplicates: true }),
  );
  console.log(`✓ Subdistrict สร้างใหม่ ${subCreated}`);

  const [pCount, dCount, sCount] = await Promise.all([
    prisma.province.count(),
    prisma.district.count(),
    prisma.subdistrict.count(),
  ]);
  console.log(`สรุปใน DB: Province=${pCount}, District=${dCount}, Subdistrict=${sCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

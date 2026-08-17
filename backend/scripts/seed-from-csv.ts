/**
 * Seed Script: นำเข้าข้อมูลจากไฟล์ CSV → MySQL via Prisma
 * รัน: npx ts-node scripts/seed-from-csv.ts
 *
 * ใช้ไฟล์ที่ project root:
 *   - area_project.csv      → Site (จังหวัด, อำเภอ, หน่วยงาน)
 *   - ข้อมูลการแจ้งซ่อม.csv → สกัดรายการ Site ที่ไม่ซ้ำเพิ่มเข้า Site + นำเข้า Job
 *   - ผู้แจ้ง.csv            → User (role=USER)
 *   - ผู้แก้ไข.csv           → User (role=STAFF)
 *   - พื้นที่รับผิดชอบ.csv   → Area (ใน CSV คอลัมน์ "อำเภอ" คือชื่อจังหวัด)
 *
 * การแมปชื่อ Staff: ใช้ getStaffId() รองรับคำนำหน้า (นาย/นางสาว) และการเว้นวรรค
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, '../..');

function readCsv<T extends Record<string, string>>(filename: string, delimiter = '\t'): T[] {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  ไฟล์ไม่พบ: ${filename}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parse(content, {
    columns: true,
    delimiter,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
    skip_empty_lines: true,
  }) as T[];
  return rows;
}

const normalizeName = (n: string) =>
  n
    .replace(/^(นาย|นางสาว|นาง)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

/** หา staffId จากชื่อ (รองรับหลายรูปแบบการเขียน) */
function getStaffId(staffMap: Record<string, number>, name: string): number | null {
  if (!name || !name.trim()) return null;
  const n = name.trim();
  const norm = normalizeName(n);
  if (staffMap[n]) return staffMap[n];
  if (staffMap[norm]) return staffMap[norm];
  for (const [k, v] of Object.entries(staffMap)) {
    if (typeof v !== 'number') continue;
    const kNorm = normalizeName(k);
    if (kNorm === norm || k === n) return v;
    if (kNorm.includes(norm) || norm.includes(kNorm)) return v;
  }
  return null;
}

function parseDateThai(s: string): Date | undefined {
  if (!s || typeof s !== 'string') return undefined;
  const t = s.trim();
  if (!t) return undefined;
  // รูปแบบ 10/9/2024 11:34:18 หรือ 2/7/2026
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
  if (m) {
    const [, d, mon, y, h = '0', min = '0', sec = '0'] = m;
    return new Date(+y, +mon - 1, +d, +h, +min, +sec);
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? undefined : d;
}

const statusMap = (s: string): 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' => {
  if (!s) return 'PENDING';
  const l = String(s).toLowerCase();
  if (l.includes('สำเร็จ') || l.includes('เสร็จ') || l.includes('resolved')) return 'RESOLVED';
  if (l.includes('กำลัง') || l.includes('ดำเนิน') || l.includes('progress')) return 'IN_PROGRESS';
  return 'PENDING';
};

async function main() {
  console.log('📂 โฟลเดอร์ข้อมูล:', ROOT);

  // ─── 1. พื้นที่ในโครงการ → Site ───
  console.log('\n🏗️  Seeding Sites จาก area_project.csv...');
  type SiteRow = { 'จังหวัด': string; 'อำเภอ': string; 'หน่วยงาน': string };
  const siteRows = readCsv<SiteRow>('area_project.csv');
  let siteCount = 0;
  const seenSites = new Set<string>();
  for (const row of siteRows) {
    const province = row['จังหวัด']?.trim();
    const district = row['อำเภอ']?.trim();
    const agency = row['หน่วยงาน']?.trim();
    if (!province || !district || !agency) continue;
    const key = `${province}|${district}|${agency}`;
    if (seenSites.has(key)) continue;
    seenSites.add(key);
    await prisma.site.create({ data: { province, district, agency, station: agency } }).catch(() => null);
    siteCount++;
  }

  // ─── 1.2 เพิ่ม Site จากรายการที่ไม่ซ้ำใน ข้อมูลการแจ้งซ่อม.csv ───
  const jobRowsForSites = readCsv<Record<string, string>>('ข้อมูลการแจ้งซ่อม.csv');
  let siteFromJobsCount = 0;
  for (const row of jobRowsForSites) {
    const province = row['จังหวัด']?.trim();
    const district = row['อำเภอ']?.trim();
    const location = row['สถานที่']?.trim();
    if (!province || !district || !location) continue;
    const key = `${province}|${district}|${location}`;
    if (seenSites.has(key)) continue;
    seenSites.add(key);
    await prisma.site.create({
      data: { province, district, agency: location, station: location },
    }).catch(() => null);
    siteFromJobsCount++;
  }
  if (siteFromJobsCount > 0) {
    console.log(`   ✅ +${siteFromJobsCount} Sites จากรายการแจ้งซ่อม (ไม่ซ้ำกับ area_project)`);
  }
  console.log(`   ✅ รวม ${siteCount + siteFromJobsCount} Sites`);

  // ─── 2. ผู้แจ้ง → User (USER) ───
  console.log('\n👤 Seeding Reporters จาก ผู้แจ้ง.csv...');
  type ReporterRow = { 'IDแจ้ง': string; 'ชื่อ-สกุล': string; 'ตำแหน่ง': string; 'Email': string; 'เบอร์โทร': string };
  const reporterRows = readCsv<ReporterRow>('ผู้แจ้ง.csv');
  let repCount = 0;
  for (const row of reporterRows) {
    const name = row['ชื่อ-สกุล']?.trim();
    if (!name) continue;
    const email = row['Email']?.trim() || null;
    const username = email ? email.split('@')[0] : `reporter_${row['IDแจ้ง'] || repCount}`;
    const password = await bcrypt.hash('changeme123', 10);
    await prisma.user.upsert({
      where: { username },
      update: { name, phone: row['เบอร์โทร']?.trim() || null, position: row['ตำแหน่ง']?.trim() || null },
      create: {
        username,
        password,
        name,
        email: email || undefined,
        phone: row['เบอร์โทร']?.trim() || null,
        position: row['ตำแหน่ง']?.trim() || null,
        role: 'USER',
      },
    }).catch((e) => { if (e.code !== 'P2002') console.error('  Reporter error:', name, e.message); });
    repCount++;
  }
  console.log(`   ✅ ${repCount} Reporters`);

  // ─── 3. ผู้แก้ไข → User (STAFF) ───
  console.log('\n🔧 Seeding Staff จาก ผู้แก้ไข.csv...');
  type StaffRow = { 'ID': string; 'ชื่อ-สกุล ผู้แก้ไข': string; 'ตำแหน่ง': string; 'Email': string; 'เบอร์โทร ': string; 'เบอร์โทร'?: string };
  const staffRows = readCsv<StaffRow>('ผู้แก้ไข.csv');
  const staffMap: Record<string, number> = {};
  let staffCount = 0;
  for (const row of staffRows) {
    const name = row['ชื่อ-สกุล ผู้แก้ไข']?.trim();
    if (!name) continue;
    const email = row['Email']?.trim() || null;
    const phone = (row['เบอร์โทร '] ?? row['เบอร์โทร'] ?? '')?.trim() || null;
    const username = email ? email.split('@')[0] : `staff_${row['ID'] || staffCount}`;
    const password = await bcrypt.hash('changeme123', 10);
    const user = await prisma.user.upsert({
      where: { username },
      update: { name, phone, position: row['ตำแหน่ง']?.trim() || null },
      create: {
        username,
        password,
        name,
        email: email || undefined,
        phone,
        position: row['ตำแหน่ง']?.trim() || null,
        role: 'STAFF',
      },
    }).catch(() => null);
    if (user) {
      staffMap[name] = user.id;
      staffMap[normalizeName(name)] = user.id;
    }
    staffCount++;
  }
  console.log(`   ✅ ${staffCount} Staff`);

  // ─── 4. พื้นที่รับผิดชอบ → Area (ใน CSV คอลัมน์ "อำเภอ" = จังหวัด) ───
  console.log('\n📍 Seeding Areas จาก พื้นที่รับผิดชอบ.csv...');
  type AreaRow = { 'ลำดับ': string; 'อำเภอ': string; 'Site Engineer': string; 'เบอร์ติดต่อ': string };
  const areaRows = readCsv<AreaRow>('พื้นที่รับผิดชอบ.csv');
  const seenAreas = new Set<string>();
  let areaCount = 0;
  for (const row of areaRows) {
    const districtOrProvince = row['อำเภอ']?.trim();
    const engineerCell = row['Site Engineer']?.trim();
    if (!districtOrProvince || !engineerCell) continue;
    // ข้ามแถวที่เป็นหัวข้อหรือรายชื่อพนักงาน
    if (districtOrProvince === 'อำเภอ' || districtOrProvince.includes('รายชื่อพนักงาน')) continue;
    const names = engineerCell
      .split(/[\r\n]+/)
      .map((n) => normalizeName(n))
      .filter(Boolean);
    for (const engineerName of names) {
      const name = engineerName.trim();
      if (!name) continue;
      const staffId = getStaffId(staffMap, name);
      if (!staffId) {
        console.warn(`  ⚠️  Staff ไม่พบสำหรับ Area "${districtOrProvince}": ${name}`);
        continue;
      }
      const areaKey = `${districtOrProvince}|${staffId}`;
      if (seenAreas.has(areaKey)) continue;
      seenAreas.add(areaKey);
      await prisma.area.create({ data: { district: districtOrProvince, staffId } }).catch(() => null);
      areaCount++;
    }
  }
  console.log(`   ✅ ${areaCount} Areas`);

  // ─── 5. ข้อมูลการแจ้งซ่อม → Job ───
  console.log('\n🛠️  Seeding Jobs จาก ข้อมูลการแจ้งซ่อม.csv...');
  let jobCount = 0;
  for (const row of jobRowsForSites) {
    const ticketNo = row['เลขที่ใบแจ้งซ่อม']?.trim();
    if (!ticketNo) continue;

    const assigneeName = row['ผู้แก้ไข']?.trim();
    const assignedToId = assigneeName ? getStaffId(staffMap, assigneeName) : null;

    const reportDate = parseDateThai(row['วัน เวลาที่แจ้งซ่อม Auto'] || '');
    const fixDate = parseDateThai(row['วัน เวลาที่แก้ไข Auto'] || '');

    const images: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const v = row[`${i}.รูปภาพข้อขัดข้อง`]?.trim();
      if (v) images.push(v);
    }
    const fixImages: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const v = row[`${i}.รูปการแก้ไข`]?.trim();
      if (v) fixImages.push(v);
    }

    await prisma.job.upsert({
      where: { ticketNo },
      update: {},
      create: {
        ticketNo,
        reportDate: reportDate || undefined,
        province: row['จังหวัด']?.trim() || null,
        district: row['อำเภอ']?.trim() || null,
        location: row['สถานที่']?.trim() || null,
        reporterName: row['ชื่อ-สกุล']?.trim() || null,
        reporterPhone: row['เบอร์โทร']?.trim() || null,
        reporterEmail: row['Email ผู้แจ้ง']?.trim() || null,
        description: row['ข้อขัดข้อง']?.trim() || null,
        status: statusMap(row['สถานะ'] || ''),
        images: images.length ? images : undefined,
        fixTicketNo: row['เลขที่ใบแก้ไข']?.trim() || null,
        fixDate: fixDate || undefined,
        assignedToId: assignedToId ?? null,
        fixerPhone: row['เบอร์โทรผู้แก้ไข']?.trim() || null,
        fixerEmail: row['Email ผู้แก้ไข']?.trim() || null,
        brokenPart: row['ส่วนที่ขัดข้อง']?.trim() || null,
        cause: row['สาเหตุ']?.trim() || null,
        fixMethod: row['วิธีแก้ไข']?.trim() || null,
        oldSerialNumber: row['Serial Number อุปกรณ์เดิม ']?.trim() || null,
        newSerialNumber: row['Serial Number อุปกรณ์ใหม่ ']?.trim() || null,
        fixImages: fixImages.length ? fixImages : undefined,
        fixNote: row['หมายเหตุการแก้ไข']?.trim() || null,
        systemStatus: row['สถานะระบบ']?.trim() || null,
        isOutOfContract: false,
      },
    }).catch((e) => { if (e.code !== 'P2002') console.error('  Job error:', ticketNo, e.message); });
    jobCount++;
  }
  console.log(`   ✅ ${jobCount} Jobs`);

  console.log('\n🎉 Seed from CSV complete!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

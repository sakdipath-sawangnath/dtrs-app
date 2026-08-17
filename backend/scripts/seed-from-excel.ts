/**
 * Seed Script: นำเข้าข้อมูลจาก Excel → MySQL via Prisma
 * รัน: npx ts-node scripts/seed-from-excel.ts
 */

import * as path from 'path';
import type ExcelJS from 'exceljs';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { loadWorkbookXlsx, worksheetToRecords } from './excel-sheet';

const prisma = new PrismaClient();
const EXCEL_PATH = path.resolve(__dirname, '../../ระบบแจ้งซ่อม .xlsx');

function readSheet<T extends Record<string, unknown>>(
  wb: ExcelJS.Workbook,
  sheetName: string,
): T[] {
  const ws = wb.getWorksheet(sheetName);
  if (!ws) {
    console.warn(`⚠️  Sheet "${sheetName}" not found`);
    return [];
  }
  return worksheetToRecords(ws) as T[];
}

async function main() {
  console.log('📂 Reading Excel:', EXCEL_PATH);
  const wb = await loadWorkbookXlsx(EXCEL_PATH);
  console.log(
    '📋 Sheets found:',
    wb.worksheets.map((s) => s.name),
  );

  // ─── 1. พื้นที่ในโครงการ → Site ───
  console.log('\n🏗️  Seeding Sites (พื้นที่ในโครงการ)...');
  type SiteRow = { 'จังหวัด': string; 'อำเภอ': string; 'หน่วยงาน': string };
  const siteRows = readSheet<SiteRow>(wb, 'พื้นที่ ในโครงการ');
  let siteCount = 0;
  for (const row of siteRows) {
    if (!row['จังหวัด'] || !row['อำเภอ'] || !row['หน่วยงาน']) continue;
    await prisma.site.upsert({
      where: {
        id: 0, // force create using create path
      },
      update: {},
      create: {
        province: String(row['จังหวัด']).trim(),
        district: String(row['อำเภอ']).trim(),
        agency: String(row['หน่วยงาน']).trim(),
        station: String(row['หน่วยงาน']).trim(),
      },
    }).catch(async () => {
      // สร้างใหม่ถ้า upsert ไม่ได้
      await prisma.site.create({
        data: {
          province: String(row['จังหวัด']).trim(),
          district: String(row['อำเภอ']).trim(),
          agency: String(row['หน่วยงาน']).trim(),
          station: String(row['หน่วยงาน']).trim(),
        },
      }).catch(() => null);
    });
    siteCount++;
  }
  console.log(`   ✅ ${siteCount} Sites processed`);

  // ─── 2. ผู้แจ้งแก้ไข → User (role=USER) ───
  console.log('\n👤 Seeding Reporters (ผู้แจ้งแก้ไข)...');
  type ReporterRow = { 'IDแจ้ง': number; 'ชื่อ-สกุล': string; 'ตำแหน่ง': string; 'Email': string; 'เบอร์โทร': string };
  const reporterRows = readSheet<ReporterRow>(wb, 'ผู้แจ้งแก้ไข');
  let repCount = 0;
  for (const row of reporterRows) {
    if (!row['ชื่อ-สกุล']) continue;
    const name = String(row['ชื่อ-สกุล']).trim();
    const email = row['Email'] ? String(row['Email']).trim() : null;
    const username = email ? email.split('@')[0] : `reporter_${row['IDแจ้ง'] || repCount}`;
    const password = await bcrypt.hash('changeme123', 10);
    await prisma.user.upsert({
      where: { username },
      update: { name, phone: row['เบอร์โทร'] ? String(row['เบอร์โทร']).trim() : null, position: row['ตำแหน่ง'] ? String(row['ตำแหน่ง']).trim() : null },
      create: {
        username,
        password,
        name,
        email: email || undefined,
        phone: row['เบอร์โทร'] ? String(row['เบอร์โทร']).trim() : null,
        position: row['ตำแหน่ง'] ? String(row['ตำแหน่ง']).trim() : null,
        role: 'USER',
      },
    }).catch(async (e) => {
      if (e.code !== 'P2002') console.error('  ❌ Reporter error:', name, e.message);
    });
    repCount++;
  }
  console.log(`   ✅ ${repCount} Reporters processed`);

  // ─── 3. ผู้แก้ไข → User (role=STAFF) + Area ───
  console.log('\n🔧 Seeding Staff (ผู้แก้ไข)...');
  type StaffRow = { 'ID': number; 'ชื่อ-สกุล ผู้แก้ไข': string; 'ตำแหน่ง': string; 'Email': string; 'เบอร์โทร ': string };
  const staffRows = readSheet<StaffRow>(wb, 'ผู้แก้ไข');
  const staffMap: Record<string, number> = {}; // name → userId
  let staffCount = 0;
  for (const row of staffRows) {
    const name = row['ชื่อ-สกุล ผู้แก้ไข'] ? String(row['ชื่อ-สกุล ผู้แก้ไข']).trim() : null;
    if (!name) continue;
    const email = row['Email'] ? String(row['Email']).trim() : null;
    const phone = row['เบอร์โทร '] ? String(row['เบอร์โทร ']).trim() : null;
    const username = email ? email.split('@')[0] : `staff_${row['ID'] || staffCount}`;
    const password = await bcrypt.hash('changeme123', 10);
    const user = await prisma.user.upsert({
      where: { username },
      update: { name, phone, position: row['ตำแหน่ง'] ? String(row['ตำแหน่ง']).trim() : null },
      create: {
        username,
        password,
        name,
        email: email || undefined,
        phone,
        position: row['ตำแหน่ง'] ? String(row['ตำแหน่ง']).trim() : null,
        role: 'STAFF',
      },
    }).catch(async () => null);
    if (user) staffMap[name] = user.id;
    staffCount++;
  }
  console.log(`   ✅ ${staffCount} Staff processed`);

  // ─── 4. พื้นที่รับผิดชอบ → Area ───
  // หมายเหตุ: ถ้าใน Excel ชื่อชีทเป็น "พื้นที่ รับผิดชอบ" (สะกดถูก) ให้เปลี่ยนเป็น readSheet(..., 'พื้นที่ รับผิดชอบ')
  console.log('\n📍 Seeding Areas (พื้นที่รับผิดชอบ)...');
  type AreaRow = { 'ลำดับ': number; 'อำเภอ': string; 'Site Engineer': string; 'เบอร์ติดต่อ': string };
  const areaRows = readSheet<AreaRow>(wb, 'พื้นที่ รับผิชอบ');
  let areaCount = 0;
  for (const row of areaRows) {
    if (!row['อำเภอ'] || !row['Site Engineer']) continue;
    const district = String(row['อำเภอ']).trim();
    const engineerName = String(row['Site Engineer']).trim();
    const staffId = staffMap[engineerName];
    if (!staffId) {
      console.warn(`  ⚠️  Staff "${engineerName}" not found for area "${district}"`);
      continue;
    }
    await prisma.area.create({
      data: { district, staffId },
    }).catch(() => null);
    areaCount++;
  }
  console.log(`   ✅ ${areaCount} Areas processed`);

  // ─── 5. ระบบแจ้งซ่อม (main sheet) → Job ───
  console.log('\n🛠️  Seeding Jobs (ระบบแจ้งซ่อม)...');
  type JobRow = {
    'ID': number;
    'เลขที่ใบแจ้งซ่อม': string;
    'วัน เวลาที่แจ้งซ่อม Auto': number;
    'จังหวัด': string;
    'อำเภอ': string;
    'สถานที่': string;
    'ชื่อ-สกุล': string;
    'เบอร์โทร': string;
    'Email ผู้แจ้ง': string;
    'ข้อขัดข้อง': string;
    'สถานะ': string;
    'เลขที่ใบแก้ไข': string;
    'วัน เวลาที่แก้ไข Auto': number;
    'ผู้แก้ไข': string;
    'เบอร์โทรผู้แก้ไข': string;
    'Email ผู้แก้ไข': string;
    'ส่วนที่ขัดข้อง': string;
    'สาเหตุ': string;
    'วิธีแก้ไข': string;
    'Serial Number อุปกรณ์เดิม ': string;
    'Serial Number อุปกรณ์ใหม่ ': string;
    'หมายเหตุการแก้ไข': string;
    'สถานะระบบ': string;
  };
  const jobRows = readSheet<JobRow>(wb, 'ระบบแจ้งซ่อม ');
  
  // Map Excel status → Prisma enum
  const statusMap = (s: string) => {
    if (!s) return 'PENDING';
    const l = s.toLowerCase();
    if (l.includes('สำเร็จ') || l.includes('เสร็จ') || l.includes('resolved')) return 'RESOLVED';
    if (l.includes('กำลัง') || l.includes('ดำเนิน') || l.includes('progress')) return 'IN_PROGRESS';
    return 'PENDING';
  };

  const excelDateToJS = (n: number) => {
    if (!n) return undefined;
    return new Date(Math.round((n - 25569) * 86400 * 1000));
  };

  let jobCount = 0;
  for (const row of jobRows) {
    const ticketNo = row['เลขที่ใบแจ้งซ่อม'] ? String(row['เลขที่ใบแจ้งซ่อม']).trim() : null;
    if (!ticketNo) continue;

    const assigneeName = row['ผู้แก้ไข'] ? String(row['ผู้แก้ไข']).trim() : null;
    const assignedToId = assigneeName ? staffMap[assigneeName] : undefined;

    await prisma.job.upsert({
      where: { ticketNo },
      update: {},
      create: {
        ticketNo,
        reportDate: row['วัน เวลาที่แจ้งซ่อม Auto'] ? excelDateToJS(Number(row['วัน เวลาที่แจ้งซ่อม Auto'])) : undefined,
        province: row['จังหวัด'] ? String(row['จังหวัด']).trim() : null,
        district: row['อำเภอ'] ? String(row['อำเภอ']).trim() : null,
        location: row['สถานที่'] ? String(row['สถานที่']).trim() : null,
        reporterName: row['ชื่อ-สกุล'] ? String(row['ชื่อ-สกุล']).trim() : null,
        reporterPhone: row['เบอร์โทร'] ? String(row['เบอร์โทร']).trim() : null,
        reporterEmail: row['Email ผู้แจ้ง'] ? String(row['Email ผู้แจ้ง']).trim() : null,
        description: row['ข้อขัดข้อง'] ? String(row['ข้อขัดข้อง']).trim() : null,
        status: statusMap(row['สถานะ'] || '') as any,
        fixTicketNo: row['เลขที่ใบแก้ไข'] ? String(row['เลขที่ใบแก้ไข']).trim() : null,
        fixDate: row['วัน เวลาที่แก้ไข Auto'] ? excelDateToJS(Number(row['วัน เวลาที่แก้ไข Auto'])) : undefined,
        assignedToId: assignedToId || null,
        fixerPhone: row['เบอร์โทรผู้แก้ไข'] ? String(row['เบอร์โทรผู้แก้ไข']).trim() : null,
        fixerEmail: row['Email ผู้แก้ไข'] ? String(row['Email ผู้แก้ไข']).trim() : null,
        brokenPart: row['ส่วนที่ขัดข้อง'] ? String(row['ส่วนที่ขัดข้อง']).trim() : null,
        cause: row['สาเหตุ'] ? String(row['สาเหตุ']).trim() : null,
        fixMethod: row['วิธีแก้ไข'] ? String(row['วิธีแก้ไข']).trim() : null,
        oldSerialNumber: row['Serial Number อุปกรณ์เดิม '] ? String(row['Serial Number อุปกรณ์เดิม ']).trim() : null,
        newSerialNumber: row['Serial Number อุปกรณ์ใหม่ '] ? String(row['Serial Number อุปกรณ์ใหม่ ']).trim() : null,
        fixNote: row['หมายเหตุการแก้ไข'] ? String(row['หมายเหตุการแก้ไข']).trim() : null,
        systemStatus: row['สถานะระบบ'] ? String(row['สถานะระบบ']).trim() : null,
        isOutOfContract: false,
      },
    }).catch(e => {
      if (e.code !== 'P2002') console.error('  ❌ Job error:', ticketNo, e.message);
    });
    jobCount++;
  }
  console.log(`   ✅ ${jobCount} Jobs processed`);

  console.log('\n🎉 Seed complete!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

/**
 * สคริปต์ย้ายเลขที่ใบแจ้งซ่อมจากรหัส hex 8 ตัวเดิม (เช่น 9530f95f)
 * ไปเป็นรูปแบบทางการ RQ-CM-YYYYXXXX
 *
 * วิธีรัน (ในโฟลเดอร์ backend/):
 *   npx ts-node scripts/migrate-hex-tickets.ts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { PrismaClient } from '@prisma/client';
import {
  bangkokYear,
  formatRequestTicketNo,
} from '../src/jobs/doc-ticket-no';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 ตรวจสอบรายการใบแจ้งซ่อมที่ยังเป็นรหัส hex 8 ตัว...');

  const candidates = await prisma.job.findMany({
    where: {
      ticketNo: {
        not: null,
      },
    },
    select: {
      id: true,
      ticketNo: true,
      reportDate: true,
      createdAt: true,
    },
    orderBy: [{ reportDate: 'asc' }, { id: 'asc' }],
  });

  const hexJobs = candidates.filter(
    (j) => j.ticketNo && /^[0-9a-f]{8}$/i.test(j.ticketNo.trim()),
  );

  if (hexJobs.length === 0) {
    console.log('✅ ไม่พบใบแจ้งซ่อมที่ต้อง migrate (ทั้งหมดอยู่ในรูปแบบใหม่แล้ว)');
    return;
  }

  console.log(`พบ ${hexJobs.length} รายการที่ต้อง migrate:`);
  for (const j of hexJobs) {
    console.log(`  - Job #${j.id}: ticketNo="${j.ticketNo}" (วันที่: ${j.reportDate?.toISOString()})`);
  }

  // กลุ่มตามปี Asia/Bangkok
  const byYear = new Map<string, typeof hexJobs>();
  for (const j of hexJobs) {
    const d = j.reportDate || j.createdAt || new Date();
    const y = bangkokYear(d);
    const list = byYear.get(y) ?? [];
    list.push(j);
    byYear.set(y, list);
  }

  for (const [year, jobs] of byYear.entries()) {
    console.log(`\nกำลังประมวลผลสำหรับปี ${year} (จำนวน ${jobs.length} รายการ)...`);
    const kind = 'RQ_CM';
    const period = year;

    // ตรวจสอบ sequence ปัจจุบัน
    const seqRow = await prisma.docSequence.findUnique({
      where: {
        kind_period: {
          kind,
          period,
        },
      },
    });

    let currentRunning = seqRow?.lastValue ?? 0;

    // ตรวจสอบว่าในฐานมีเลข RQ-CM-YYYYXXXX ที่มีอยู่แล้วหรือไม่
    const existingMaxJob = await prisma.job.findFirst({
      where: {
        ticketNo: {
          startsWith: `RQ-CM-${year}`,
        },
      },
      orderBy: { ticketNo: 'desc' },
      select: { ticketNo: true },
    });

    if (existingMaxJob?.ticketNo) {
      const numPart = existingMaxJob.ticketNo.slice(`RQ-CM-${year}`.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > currentRunning) {
        currentRunning = parsed;
      }
    }

    console.log(`ลำดับเริ่มต้นสำหรับปี ${year}: ${currentRunning}`);

    for (const job of jobs) {
      currentRunning++;
      const newTicketNo = formatRequestTicketNo({
        year,
        running: currentRunning,
      });

      await prisma.job.update({
        where: { id: job.id },
        data: { ticketNo: newTicketNo },
      });

      console.log(`  ✔ Job #${job.id}: ${job.ticketNo} ➔ ${newTicketNo}`);
    }

    // อัปเดต DocSequence
    await prisma.docSequence.upsert({
      where: {
        kind_period: {
          kind,
          period,
        },
      },
      create: {
        kind,
        period,
        lastValue: currentRunning,
      },
      update: {
        lastValue: currentRunning,
      },
    });

    console.log(`✅ อัปเดต DocSequence (${kind}, ${period}) = ${currentRunning} สำเร็จ`);
  }

  console.log('\n🎉 Migrate ทั้งหมดเรียบร้อยแล้ว!');
}

main()
  .catch((err) => {
    console.error('❌ เกิดข้อผิดพลาดในการ migrate:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

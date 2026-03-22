/**
 * Sync คอลัมน์ username ให้อ้างอิง email เป็นหลัก
 * - ผู้ใช้ที่มี email: ตั้ง username = email (ถ้าต่างกันอยู่)
 * - ผู้ใช้ที่ไม่มี email: ไม่แก้ (เช่น admin ที่ยังไม่มี email)
 *
 * รัน: cd backend && npx ts-node scripts/sync-username-from-email.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, name: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const u of users) {
    const email = u.email?.trim();
    if (!email) {
      console.log(`  [ข้าม] id=${u.id} name=${u.name ?? '-'} ไม่มี email (username=${u.username})`);
      skipped++;
      continue;
    }
    if (u.username === email) {
      skipped++;
      continue;
    }
    try {
      await prisma.user.update({
        where: { id: u.id },
        data: { username: email },
      });
      console.log(`  [อัปเดต] id=${u.id} username: "${u.username}" → "${email}"`);
      updated++;
    } catch (e) {
      console.error(`  [ผิดพลาด] id=${u.id} ไม่สามารถตั้ง username="${email}" ได้ (อาจซ้ำ):`, e);
    }
  }

  console.log('');
  console.log(`สรุป: อัปเดต ${updated} รายการ, ข้าม ${skipped} รายการ`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

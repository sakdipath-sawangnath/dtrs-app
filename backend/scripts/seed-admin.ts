/**
 * สร้าง user admin เริ่มต้น (ถ้ายังไม่มี)
 * รัน: npx ts-node scripts/seed-admin.ts
 *
 * ค่าเริ่มต้น: username=admin, password=admin123 (ควรเปลี่ยนหลัง login ครั้งแรก)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'ผู้ดูแลระบบ';

// เพิ่ม admin ผ่าน email/username เพิ่มเติม
const ADMIN_EMAIL = 'admin@forth.co.th';
const ADMIN_EMAIL_USERNAME = ADMIN_EMAIL;
const ADMIN_EMAIL_NAME = 'ผู้ดูแลระบบ (Forth)';

async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
  });
  if (!existing) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        password: hashed,
        name: ADMIN_NAME,
        role: 'ADMIN',
      },
    });
    console.log('✓ สร้าง admin สำเร็จ');
    console.log('  Username:', ADMIN_USERNAME);
    console.log('  Password:', ADMIN_PASSWORD);
    console.log('  ⚠️  แนะนำให้เปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก');
  } else {
    console.log('✓ มี user admin อยู่แล้ว (username:', ADMIN_USERNAME, ')');
  }

  // Seed admin เพิ่มเติมด้วย email
  const existingEmailAdmin = await prisma.user.findUnique({
    where: { username: ADMIN_EMAIL_USERNAME },
  });
  if (existingEmailAdmin) {
    console.log('✓ มี user admin (email/admin@forth.co.th) อยู่แล้ว');
    return;
  }

  const hashedEmail = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      username: ADMIN_EMAIL_USERNAME,
      email: ADMIN_EMAIL,
      password: hashedEmail,
      name: ADMIN_EMAIL_NAME,
      role: 'ADMIN',
    },
  });
  console.log('✓ สร้าง admin เพิ่มเติมสำเร็จ');
  console.log('  Email:', ADMIN_EMAIL);
  console.log('  Username:', ADMIN_EMAIL_USERNAME);
  console.log('  Password:', ADMIN_PASSWORD);
  console.log('  ⚠️  แนะนำให้เปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

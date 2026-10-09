/**
 * Migration Script: ย้าย path รูปภาพโปรไฟล์ผู้ใช้ (จาก AppSheet / CSV) → อัปโหลดขึ้น MinIO
 * และอัปเดต User.image ให้เป็น URL เข้าถึงได้จาก browser
 *
 * โหมดเริ่มต้นเป็น DRY-RUN (ไม่อัปโหลดจริง, ไม่อัปเดต DB) เพื่อใช้ตรวจสอบ mapping ก่อน
 *
 * วิธีรัน (PowerShell):
 *   $env:DRY_RUN = "true"
 *   npx ts-node scripts/migrate-user-avatars-to-minio.ts
 *
 *   $env:DRY_RUN = "false"
 *   npx ts-node scripts/migrate-user-avatars-to-minio.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as Minio from 'minio';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

// ───────────────────────────────────────────────────────────────
// CONFIG
// ───────────────────────────────────────────────────────────────

// DRY-RUN: true = ไม่อัปโหลดจริง / ไม่อัปเดต DB
const DRY_RUN = process.env.DRY_RUN !== 'false';

// โฟลเดอร์เก็บไฟล์เดิมจาก AppSheet
// ตัวอย่าง: d:\cctv-app.forth-co-th\CCTVMaintenance-641488446\ผู้แก้ไข_Images\...
const APPSHEET_ROOT = path.resolve(
  __dirname,
  '../../CCTVMaintenance-641488446',
);

// ตั้งค่าจาก .env ให้เหมือน MinioService
const MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'cctv-app';
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || '';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || '';

// ───────────────────────────────────────────────────────────────
// MinIO Client
// ───────────────────────────────────────────────────────────────

function createMinioClient() {
  return new Minio.Client({
    endPoint: MINIO_ENDPOINT,
    port: MINIO_PORT,
    useSSL: MINIO_USE_SSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
  });
}

function getPublicBaseUrl(): string {
  const publicBase =
    process.env.MINIO_PUBLIC_URL &&
    process.env.MINIO_PUBLIC_URL.trim().length > 0
      ? process.env.MINIO_PUBLIC_URL.replace(/\/+$/, '')
      : undefined;

  if (publicBase) {
    return publicBase;
  }

  const protocol = MINIO_USE_SSL ? 'https' : 'http';
  return `${protocol}://${MINIO_ENDPOINT}:${MINIO_PORT}`;
}

function makePublicUrl(objectName: string): string {
  const base = getPublicBaseUrl();
  return `${base}/${MINIO_BUCKET_NAME}/${objectName}`;
}

// ───────────────────────────────────────────────────────────────
// Helper: แปลง path จาก AppSheet → path จริงในดิสก์
// ───────────────────────────────────────────────────────────────

function resolveAppsheetPath(relPath: string): string {
  const cleaned = relPath.trim().replace(/^[\\/]+/, '');
  return path.join(APPSHEET_ROOT, cleaned);
}

// ───────────────────────────────────────────────────────────────
// Main migration logic
// ───────────────────────────────────────────────────────────────

type UserWithImage = Pick<User, 'id' | 'username' | 'name' | 'image'>;

async function migrate() {
  console.log('👤 Migration: User avatars → MinIO');
  console.log('   DRY_RUN           =', DRY_RUN);
  console.log('   APPSHEET_ROOT     =', APPSHEET_ROOT);
  console.log('   MINIO_BUCKET_NAME =', MINIO_BUCKET_NAME);

  if (!fs.existsSync(APPSHEET_ROOT)) {
    console.warn('⚠️  ไม่พบโฟลเดอร์ APPSHEET_ROOT:', APPSHEET_ROOT);
    console.warn(
      '    โปรดคัดลอกโฟลเดอร์/ไฟล์จาก CCTVMaintenance (AppSheet) มาไว้ที่นี่ก่อน',
    );
  }

  const minioClient = createMinioClient();

  if (!DRY_RUN) {
    const exists = await minioClient
      .bucketExists(MINIO_BUCKET_NAME)
      .catch(() => false);
    if (!exists) {
      console.log(`🪣 สร้าง bucket ใหม่: ${MINIO_BUCKET_NAME}`);
      await minioClient.makeBucket(MINIO_BUCKET_NAME, 'us-east-1');
    }
  } else {
    console.log('🧪 DRY-RUN: จะไม่สร้าง bucket และไม่อัปโหลดไฟล์จริง');
  }

  console.log('\n📥 ดึงรายการ Users ที่มี image จากฐานข้อมูล...');
  const users: UserWithImage[] = await prisma.user.findMany({
    where: {
      image: {
        not: null,
      },
    },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
    },
  });

  console.log(`   พบ Users ที่มีค่า image ทั้งหมด: ${users.length} รายการ\n`);

  let migrated = 0;
  let skippedAlreadyUrl = 0;
  let missingFiles = 0;

  for (const user of users) {
    const raw = user.image as unknown as string | null;
    if (!raw) continue;

    // ถ้า image เป็น URL (ขึ้นต้น http) อยู่แล้ว ให้ข้าม
    if (/^https?:\/\//i.test(raw)) {
      skippedAlreadyUrl++;
      continue;
    }

    console.log(`\n📝 User #${user.id} (${user.username})`);
    console.log(`   image path: ${raw}`);

    const sourcePath = resolveAppsheetPath(raw);
    const ext = path.extname(raw) || '.jpg';
    const objectName = `users/${user.id}/profile${ext}`;

    if (!fs.existsSync(sourcePath)) {
      console.warn(`   ⚠️  ไม่พบไฟล์รูปโปรไฟล์: ${sourcePath}`);
      missingFiles++;
      continue;
    }

    const url = makePublicUrl(objectName);

    if (DRY_RUN) {
      console.log(`   [DRY-RUN] avatar: ${sourcePath} -> ${objectName}`);
      console.log(`             URL: ${url}`);
      migrated++;
      continue;
    }

    const buffer = await fs.promises.readFile(sourcePath);
    await minioClient.putObject(
      MINIO_BUCKET_NAME,
      objectName,
      buffer,
      buffer.length,
      { 'Content-Type': 'image/jpeg' },
    );
    console.log(`   ✅ อัปโหลด avatar: ${objectName}`);

    await prisma.user.update({
      where: { id: user.id },
      data: { image: url },
    });
    console.log('   💾 อัปเดต User.image ในฐานข้อมูลแล้ว');
    migrated++;
  }

  console.log('\n📊 สรุปผลการประมวลผล:');
  console.log('   จำนวนผู้ใช้ที่ migrate avatar แล้ว         :', migrated);
  console.log(
    '   จำนวนผู้ใช้ที่ image เป็น URL อยู่แล้ว     :',
    skippedAlreadyUrl,
  );
  console.log('   จำนวนไฟล์ที่หาไม่เจอ (missing files)       :', missingFiles);
  console.log('   DRY_RUN                                      :', DRY_RUN);
}

// ───────────────────────────────────────────────────────────────
// Bootstrap
// ───────────────────────────────────────────────────────────────

migrate()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ User avatar migration script finished.');
  })
  .catch(async (err) => {
    console.error('❌ Migration script error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });

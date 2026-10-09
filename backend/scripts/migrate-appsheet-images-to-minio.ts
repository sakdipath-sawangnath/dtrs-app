/**
 * Migration Script: ย้าย path รูปภาพจากข้อมูล AppSheet → อัปโหลดขึ้น MinIO และอัปเดต Job.images / Job.fixImages
 *
 * โหมดเริ่มต้นเป็น DRY-RUN (ไม่อัปโหลดจริง, ไม่อัปเดต DB) เพื่อใช้ตรวจสอบ mapping ก่อน
 *
 * รันตัวอย่าง:
 *   DRY_RUN=true  npx ts-node scripts/migrate-appsheet-images-to-minio.ts
 *   DRY_RUN=false npx ts-node scripts/migrate-appsheet-images-to-minio.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as Minio from 'minio';
import { PrismaClient, Job } from '@prisma/client';

const prisma = new PrismaClient();

// ───────────────────────────────────────────────────────────────
// CONFIG
// ───────────────────────────────────────────────────────────────

// โหมด DRY-RUN: ค่าเริ่มต้น true (ไม่อัปโหลดจริง, ไม่แก้ DB)
const DRY_RUN = process.env.DRY_RUN !== 'false';

// โฟลเดอร์เก็บไฟล์เดิมจาก AppSheet (ให้วางไฟล์/โฟลเดอร์จาก CCTVMaintenance จริงไว้ที่นี่)
// ตัวอย่าง: d:\cctv-app.forth-co-th\CCTVMaintenance-641488446\ระบบแจ้งซ่อม_Images\...
const APPSHEET_ROOT = path.resolve(
  __dirname,
  '../../CCTVMaintenance-641488446',
);

// ตั้งค่าจาก .env / default ให้เหมือน MinioService
const MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'cctv-report-images';
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

function makePublicUrl(objectName: string): string {
  const protocol = MINIO_USE_SSL ? 'https' : 'http';
  return `${protocol}://${MINIO_ENDPOINT}:${MINIO_PORT}/${MINIO_BUCKET_NAME}/${objectName}`;
}

// ───────────────────────────────────────────────────────────────
// Helper: แปลง path จาก AppSheet → path จริงในดิสก์
// ───────────────────────────────────────────────────────────────

function resolveAppsheetPath(relPath: string): string {
  // ลบ space / slash หน้า-หลัง แล้วแปลง backslash ให้เป็น path ปกติ
  const cleaned = relPath.trim().replace(/^[\\/]+/, '');
  return path.join(APPSHEET_ROOT, cleaned);
}

// ───────────────────────────────────────────────────────────────
// Main migration logic
// ───────────────────────────────────────────────────────────────

type JobWithImages = Pick<Job, 'id' | 'ticketNo' | 'images' | 'fixImages'>;

async function migrate() {
  console.log('📦 Migration: AppSheet images → MinIO');
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
    // ตรวจว่ามี bucket แล้วหรือไม่
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

  console.log('\n📥 ดึงรายการ Jobs ที่มี images/fixImages จากฐานข้อมูล...');
  const jobs: JobWithImages[] = await prisma.job.findMany({
    where: {
      OR: [
        { images: { not: { equals: null } } },
        { fixImages: { not: { equals: null } } },
      ],
    },
    select: {
      id: true,
      ticketNo: true,
      images: true,
      fixImages: true,
    },
  });

  console.log(`   พบ Jobs ที่มีข้อมูลรูปภาพทั้งหมด: ${jobs.length} รายการ\n`);

  let totalIssueImages = 0;
  let totalFixImages = 0;
  let missingFiles = 0;

  for (const job of jobs) {
    const issuePaths: string[] = Array.isArray(job.images)
      ? (job.images as any)
      : [];
    const fixPaths: string[] = Array.isArray(job.fixImages)
      ? (job.fixImages as any)
      : [];

    if (!issuePaths.length && !fixPaths.length) continue;

    console.log(`\n📝 Job #${job.id} (ticketNo=${job.ticketNo || 'N/A'})`);

    const newIssueUrls: string[] = [];
    const newFixUrls: string[] = [];

    // ── Issue images ──
    for (let i = 0; i < issuePaths.length; i++) {
      const originalPath = issuePaths[i];
      const sourcePath = resolveAppsheetPath(originalPath);
      const ext = path.extname(originalPath) || '.jpg';
      const objectName = `jobs/${job.id}/issue/${i + 1}${ext}`;

      if (!fs.existsSync(sourcePath)) {
        console.warn(`   ⚠️  ไม่พบไฟล์รูปข้อขัดข้อง: ${sourcePath}`);
        missingFiles++;
        continue;
      }

      const url = makePublicUrl(objectName);
      newIssueUrls.push(url);
      totalIssueImages++;

      if (DRY_RUN) {
        console.log(`   [DRY-RUN] issue image: ${sourcePath} -> ${objectName}`);
      } else {
        const buffer = await fs.promises.readFile(sourcePath);
        await minioClient.putObject(
          MINIO_BUCKET_NAME,
          objectName,
          buffer,
          buffer.length,
          { 'Content-Type': 'image/jpeg' },
        );
        console.log(`   ✅ อัปโหลด issue image: ${objectName}`);
      }
    }

    // ── Fix images ──
    for (let i = 0; i < fixPaths.length; i++) {
      const originalPath = fixPaths[i];
      const sourcePath = resolveAppsheetPath(originalPath);
      const ext = path.extname(originalPath) || '.jpg';
      const objectName = `jobs/${job.id}/fix/${i + 1}${ext}`;

      if (!fs.existsSync(sourcePath)) {
        console.warn(`   ⚠️  ไม่พบไฟล์รูปการแก้ไข: ${sourcePath}`);
        missingFiles++;
        continue;
      }

      const url = makePublicUrl(objectName);
      newFixUrls.push(url);
      totalFixImages++;

      if (DRY_RUN) {
        console.log(`   [DRY-RUN] fix image: ${sourcePath} -> ${objectName}`);
      } else {
        const buffer = await fs.promises.readFile(sourcePath);
        await minioClient.putObject(
          MINIO_BUCKET_NAME,
          objectName,
          buffer,
          buffer.length,
          { 'Content-Type': 'image/jpeg' },
        );
        console.log(`   ✅ อัปโหลด fix image: ${objectName}`);
      }
    }

    if (!DRY_RUN) {
      // อัปเดต Job.images / Job.fixImages ให้เป็น URL จาก MinIO
      await prisma.job.update({
        where: { id: job.id },
        data: {
          images: newIssueUrls.length ? (newIssueUrls as any) : undefined,
          fixImages: newFixUrls.length ? (newFixUrls as any) : undefined,
        },
      });
      console.log('   💾 อัปเดต Job.images / Job.fixImages ในฐานข้อมูลแล้ว');
    }
  }

  console.log('\n📊 สรุปผลการประมวลผล (เฉพาะ jobs ที่มี images/fixImages):');
  console.log(
    '   รูปข้อขัดข้อง (issue images) ที่พบทั้งหมด    :',
    totalIssueImages,
  );
  console.log(
    '   รูปการแก้ไข (fix images) ที่พบทั้งหมด        :',
    totalFixImages,
  );
  console.log(
    '   จำนวนไฟล์ที่หาไม่เจอ (missing files)         :',
    missingFiles,
  );
  console.log('   DRY_RUN                                      :', DRY_RUN);
}

// ───────────────────────────────────────────────────────────────
// Bootstrap
// ───────────────────────────────────────────────────────────────

migrate()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Migration script finished.');
  })
  .catch(async (err) => {
    console.error('❌ Migration script error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });

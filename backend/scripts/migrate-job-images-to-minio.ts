/**
 * Migrate job.images / job.fixImages from legacy relative paths
 * → upload to MinIO using MinioService.uploadJobImage()
 * → update Job.images / Job.fixImages with MinIO public URLs.
 *
 * รัน (PowerShell):
 *   $env:JOB_ID="260"
 *   $env:DRY_RUN="false"
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register ./scripts/migrate-job-images-to-minio.ts
 */

/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MinioService } from '../src/minio/minio.service';
import * as fs from 'fs';
import * as path from 'path';

const JOB_ID = process.env.JOB_ID ? Number(process.env.JOB_ID) : NaN;
const DRY_RUN = (process.env.DRY_RUN ?? 'true') !== 'false';

// โฟลเดอร์เก็บไฟล์เดิมจาก AppSheet / ระบบ legacy
const APPSHEET_ROOT = path.resolve(__dirname, '..', '..', 'CCTVMaintenance-641488446');

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string') as string[];
  return [];
}

async function findFileByBasename(rootDir: string, basename: string): Promise<string | null> {
  // เดินหาแบบ BFS/DFS เพื่อ early-stop เมื่อเจอไฟล์ที่ชื่อซ้ำกัน
  const stack: string[] = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isFile() && ent.name === basename) return full;
      if (ent.isDirectory()) stack.push(full);
    }
  }
  return null;
}

function guessMimeTypeFromExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === '.png') return 'image/png';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  return 'image/jpeg';
}

async function main() {
  if (!Number.isFinite(JOB_ID) || JOB_ID <= 0) {
    throw new Error(`JOB_ID ไม่ถูกต้อง: ${process.env.JOB_ID}`);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const minio = app.get(MinioService);

  console.log(`JOB_ID=${JOB_ID} DRY_RUN=${DRY_RUN}`);
  console.log(`APPSHEET_ROOT=${APPSHEET_ROOT}`);

  const job = await prisma.job.findUnique({
    where: { id: JOB_ID },
    select: { id: true, images: true, fixImages: true },
  });

  if (!job) {
    console.warn(`ไม่พบ Job id=${JOB_ID}`);
    await app.close();
    return;
  }

  const legacyImages = toStringArray(job.images);
  const legacyFixImages = toStringArray(job.fixImages);

  const isUrl = (s: string) => /^https?:\/\//i.test(s);
  const migrateKind = async (kind: 'issue' | 'fix', legacy: string[]) => {
    const out: string[] = [];
    for (let i = 0; i < legacy.length; i++) {
      const src = legacy[i];
      if (!src) continue;
      if (isUrl(src)) {
        out.push(src);
        continue;
      }

      const basename = path.basename(src);
      const abs = await findFileByBasename(APPSHEET_ROOT, basename);
      if (!abs) {
        console.warn(`[SKIP] (${kind}) not found file basename="${basename}" from "${src}"`);
        continue;
      }

      const ext = path.extname(abs) || path.extname(basename) || '.jpg';
      const buf = await fs.promises.readFile(abs);
      const fileLike: any = {
        fieldname: 'image',
        originalname: basename,
        encoding: '7bit',
        mimetype: guessMimeTypeFromExt(ext),
        size: buf.length,
        buffer: buf,
        stream: fs.createReadStream(abs),
        destination: '',
        filename: '',
        path: abs,
      };

      const index = i + 1; // สอดคล้องกับ createReport/uploadJobImage()
      if (DRY_RUN) {
        const objectUrlHint = `jobs/${JOB_ID}/${kind}/${index}${ext}`;
        console.log(`[DRY-RUN] upload (${kind}) ${abs} -> ${objectUrlHint}`);
        out.push('(dry-run-url)');
        continue;
      }

      const url = await minio.uploadJobImage(JOB_ID, kind, index, fileLike);
      console.log(`[OK] (${kind}) ${basename} -> ${url}`);
      out.push(url);
    }
    return out;
  };

  const migratedImages = await migrateKind('issue', legacyImages);
  const migratedFixImages = await migrateKind('fix', legacyFixImages);

  if (!DRY_RUN) {
    await prisma.job.update({
      where: { id: JOB_ID },
      data: {
        images: migratedImages as any,
        fixImages: migratedFixImages as any,
      },
    });
    console.log(`Updated Job ${JOB_ID}: images=${migratedImages.length}, fixImages=${migratedFixImages.length}`);
  } else {
    console.log(`DRY_RUN=true: not updating DB`);
  }

  await app.close();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});


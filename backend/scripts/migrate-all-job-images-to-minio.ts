/**
 * Batch migrate Job images/fixImages from legacy relative paths -> MinIO public URLs.
 *
 * Idea:
 * - DB field Job.images / Job.fixImages is Json and can contain either:
 *   - URL strings (start with http/https) -> keep as-is
 *   - Legacy relative path strings -> find real file under APPSHEET_ROOT by basename, upload to MinIO, update DB
 *
 * Env:
 *   DRY_RUN=false     -> actually upload and update DB
 *   DRY_RUN=true      -> preview only
 *   LIMIT=50          -> limit jobs to process (default: all)
 *
 * Run:
 *   cd backend
 *   $env:DRY_RUN="true";  npx ts-node -r tsconfig-paths/register ./scripts/migrate-all-job-images-to-minio.ts
 *   $env:DRY_RUN="false"; npx ts-node -r tsconfig-paths/register ./scripts/migrate-all-job-images-to-minio.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MinioService } from '../src/minio/minio.service';
import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = (process.env.DRY_RUN ?? 'true') !== 'false';
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;

const APPSHEET_ROOT = path.resolve(
  __dirname,
  '..',
  '..',
  'CCTVMaintenance-641488446',
);

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
  return [];
}

const isUrl = (s: string) => /^https?:\/\//i.test(s);

function guessMimeTypeFromExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === '.png') return 'image/png';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  return 'image/jpeg';
}

async function buildBasenameIndex(
  rootDir: string,
  targets: Set<string>,
): Promise<Map<string, string>> {
  const index = new Map<string, string>();
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
      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!ent.isFile()) continue;

      const base = ent.name;
      if (!targets.has(base)) continue;
      if (!index.has(base)) index.set(base, full);

      // ถ้าเจอครบทั้งหมดแล้วหยุดได้
      if (index.size >= targets.size) return index;
    }
  }

  return index;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const minio = app.get(MinioService);

  console.log(`DRY_RUN=${DRY_RUN}`);
  console.log(`APPSHEET_ROOT=${APPSHEET_ROOT}`);
  if (!fs.existsSync(APPSHEET_ROOT)) {
    console.warn('⚠️ ไม่พบโฟลเดอร์ APPSHEET_ROOT');
  }

  const jobs = await prisma.job.findMany({
    select: { id: true, images: true, fixImages: true },
  });

  const legacyJobs = jobs
    .map((j) => ({
      id: j.id,
      images: toStringArray(j.images),
      fixImages: toStringArray(j.fixImages),
    }))
    .filter(
      (j) =>
        j.images.some((s) => !isUrl(s)) || j.fixImages.some((s) => !isUrl(s)),
    );

  const selectedJobs =
    typeof LIMIT === 'number' && Number.isFinite(LIMIT)
      ? legacyJobs.slice(0, LIMIT)
      : legacyJobs;
  console.log(
    `jobs total=${jobs.length}, legacyJobs=${legacyJobs.length}, selected=${selectedJobs.length}`,
  );

  // เก็บ basenames ที่ต้องหาไฟล์
  const targets = new Set<string>();
  for (const j of selectedJobs) {
    for (const s of j.images) {
      if (isUrl(s)) continue;
      targets.add(path.basename(s));
    }
    for (const s of j.fixImages) {
      if (isUrl(s)) continue;
      targets.add(path.basename(s));
    }
  }
  console.log(`target basenames to locate=${targets.size}`);

  const basenameIndex = await buildBasenameIndex(APPSHEET_ROOT, targets);
  console.log(`found basenames in disk=${basenameIndex.size}`);

  let migratedJobs = 0;
  let skippedJobs = 0;

  for (const j of selectedJobs) {
    const jobId = j.id;
    console.log(`\n=== Job ${jobId} ===`);

    const migrateKind = async (kind: 'issue' | 'fix', legacyArr: string[]) => {
      const out: string[] = [];
      for (let i = 0; i < legacyArr.length; i++) {
        const src = legacyArr[i];
        if (!src) continue;

        if (isUrl(src)) {
          out.push(src);
          continue;
        }

        const basename = path.basename(src);
        const abs = basenameIndex.get(basename);
        if (!abs) {
          console.warn(
            `[SKIP] missing file for kind=${kind} basename=${basename}`,
          );
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

        const index = i + 1; // ตามลำดับใน array เดิม
        if (DRY_RUN) {
          out.push('(dry-run-url)');
          continue;
        }

        const url = await minio.uploadJobImage(jobId, kind, index, fileLike);
        out.push(url);
      }
      return out;
    };

    const images = await migrateKind('issue', j.images);
    const fixImages = await migrateKind('fix', j.fixImages);

    if (DRY_RUN) {
      console.log(`[DRY-RUN] would update job ${jobId}`);
      migratedJobs++;
      continue;
    }

    if (images.length === 0 && fixImages.length === 0) {
      console.log(`[SKIP] nothing to update for job ${jobId}`);
      skippedJobs++;
      continue;
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        images: images as any,
        fixImages: fixImages as any,
      },
    });
    migratedJobs++;
    console.log(
      `Updated job ${jobId}: images=${images.length}, fixImages=${fixImages.length}`,
    );
  }

  console.log(
    `\nDone. migratedJobs=${migratedJobs}, skippedJobs=${skippedJobs}`,
  );
  await app.close();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});

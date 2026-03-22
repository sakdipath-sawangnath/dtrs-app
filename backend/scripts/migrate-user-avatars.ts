/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MinioService } from '../src/minio/minio.service';
import * as fs from 'fs';
import * as path from 'path';

type CsvRow = {
  name: string;
  email?: string | null;
  phone?: string | null;
  imagePath?: string | null;
};

function parseTabSeparated(filePath: string, skipHeader = true): CsvRow[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV not found: ${filePath}`);
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: CsvRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (skipHeader && i === 0) continue;
    const cols = lines[i].split('\t');
    if (cols.length < 2) continue;

    // โครงสร้างไฟล์:
    // ผู้แจ้ง.csv: IDแจ้ง | ชื่อ-สกุล | ตำแหน่ง | Email | เบอร์โทร | รูปภาพ
    // ผู้แก้ไข.csv: ID | ชื่อ-สกุล ผู้แก้ไข | ตำแหน่ง | Email | เบอร์โทร | รูปภาพ
    const name = (cols[1] || '').trim();
    const email = (cols[3] || '').trim() || null;
    const phone = (cols[4] || '').trim() || null;
    const imagePath = (cols[5] || '').trim() || null;

    if (!name || !imagePath) continue;
    rows.push({ name, email, phone, imagePath });
  }
  return rows;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const minio = app.get(MinioService);

  const rootDir = path.resolve(__dirname, '..', '..');
  const appsheetRoot = path.join(rootDir, 'CCTVMaintenance-641488446');
  const reporterCsv = path.join(rootDir, 'ผู้แจ้ง.csv');
  const fixerCsv = path.join(rootDir, 'ผู้แก้ไข.csv');

  const reporterRows = parseTabSeparated(reporterCsv, true);
  const fixerRows = parseTabSeparated(fixerCsv, true);
  const rows = [...reporterRows, ...fixerRows];

  console.log(`Found ${rows.length} rows with potential avatars`);

  let success = 0;
  let skipped = 0;

  for (const row of rows) {
    const phoneDigits = row.phone ? row.phone.replace(/\D/g, '') : '';

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          row.email
            ? {
                email: {
                  equals: row.email,
                },
              }
            : undefined,
          phoneDigits
            ? {
                phone: {
                  contains: phoneDigits,
                },
              }
            : undefined,
        ].filter(Boolean) as any[],
      },
    });

    if (!user) {
      skipped++;
      console.warn(
        `[SKIP] user not found for name="${row.name}" email="${row.email ?? ''}" phone="${row.phone ?? ''}"`,
      );
      continue;
    }

    if (user.image) {
      // มี avatar แล้ว ข้าม
      skipped++;
      continue;
    }

            // CSV เก็บ path แบบ relative ไปยังโฟลเดอร์ใน CCTVMaintenance
            const absImagePath = path.join(appsheetRoot, row.imagePath!);
    if (!fs.existsSync(absImagePath)) {
      skipped++;
      console.warn(`[SKIP] image file not found: ${absImagePath} (user id=${user.id})`);
      continue;
    }

    const buffer = fs.readFileSync(absImagePath);
    const ext = path.extname(absImagePath) || '.jpg';
    const fileLike: Express.Multer.File = {
      fieldname: 'image',
      originalname: path.basename(absImagePath),
      encoding: '7bit',
      mimetype: ext === '.png' ? 'image/png' : 'image/jpeg',
      size: buffer.length,
      buffer,
      stream: fs.createReadStream(absImagePath) as any,
      destination: '',
      filename: '',
      path: absImagePath,
    };

    try {
      const url = await minio.uploadUserAvatar(user.id, fileLike);
      await prisma.user.update({
        where: { id: user.id },
        data: { image: url },
      });
      success++;
      console.log(`[OK] user id=${user.id} -> ${url}`);
    } catch (e: any) {
      skipped++;
      console.error(`[ERROR] upload avatar for user id=${user.id}`, e?.message ?? String(e));
    }
  }

  console.log(`Done. success=${success}, skipped=${skipped}`);
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


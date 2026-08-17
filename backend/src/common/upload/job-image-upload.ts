import { BadRequestException } from '@nestjs/common';
import convert from 'heic-convert';

async function detectMime(buffer: Buffer): Promise<string | undefined> {
  const { fileTypeFromBuffer } = await import('file-type');
  const detected = await fileTypeFromBuffer(buffer);
  return detected?.mime;
}

export const MAX_JOB_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_JOB_ISSUE_IMAGES = 3;
export const MAX_JOB_FIX_IMAGES = 3;

export const JOB_IMAGE_MULTER_LIMITS = {
  fileSize: MAX_JOB_IMAGE_BYTES,
};

export const JOB_IMAGE_TYPE_ERROR =
  'รองรับเฉพาะ JPG, PNG, WebP หรือ HEIC ขนาดไม่เกิน 5MB';

export const JOB_IMAGE_SIZE_ERROR = 'ไฟล์รูปใหญ่เกิน 5MB';

const ALLOWED_JOB_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function assertWithinSize(bytes: number): void {
  if (bytes > MAX_JOB_IMAGE_BYTES) {
    throw new BadRequestException(JOB_IMAGE_SIZE_ERROR);
  }
}

function replaceExtension(filename: string, ext: string): string {
  const base = filename.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${ext}`;
}

function cloneMulterFile(
  file: Express.Multer.File,
  buffer: Buffer,
  mimetype: string,
  originalname: string,
): Express.Multer.File {
  return {
    ...file,
    buffer,
    mimetype,
    originalname,
    size: buffer.length,
  };
}

async function convertHeicToJpeg(
  file: Express.Multer.File,
  buffer: Buffer,
): Promise<Express.Multer.File> {
  try {
    const converted = await convert({
      buffer,
      format: 'JPEG',
      quality: 0.9,
    });
    const jpegBuffer = Buffer.from(converted);
    assertWithinSize(jpegBuffer.length);
    return cloneMulterFile(
      file,
      jpegBuffer,
      'image/jpeg',
      replaceExtension(file.originalname || 'image.heic', 'jpg'),
    );
  } catch {
    throw new BadRequestException(JOB_IMAGE_TYPE_ERROR);
  }
}

/** ตรวจ magic bytes + แปลง HEIC/HEIF เป็น JPEG ก่อนอัปโหลด MinIO */
export async function assertAndNormalizeJobImage(
  file: Express.Multer.File,
): Promise<Express.Multer.File> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('ไม่พบไฟล์รูป');
  }
  assertWithinSize(file.size ?? file.buffer.length);

  const mime = await detectMime(file.buffer);
  if (!mime || !ALLOWED_JOB_IMAGE_MIMES.has(mime)) {
    throw new BadRequestException(JOB_IMAGE_TYPE_ERROR);
  }

  if (mime === 'image/heic' || mime === 'image/heif') {
    return convertHeicToJpeg(file, file.buffer);
  }

  return cloneMulterFile(
    file,
    file.buffer,
    mime,
    file.originalname || `image.${mime.split('/')[1] ?? 'jpg'}`,
  );
}

export async function normalizeJobImageFiles(
  files: Express.Multer.File[],
): Promise<Express.Multer.File[]> {
  const normalized: Express.Multer.File[] = [];
  for (const file of files) {
    normalized.push(await assertAndNormalizeJobImage(file));
  }
  return normalized;
}

/** ลายเซ็นผู้แจ้งจาก canvas — PNG เท่านั้น ไม่แปลง HEIC */
export async function assertReporterSignatureFile(
  file: Express.Multer.File,
): Promise<Express.Multer.File> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('ไม่พบไฟล์ลายเซ็น');
  }
  assertWithinSize(file.size ?? file.buffer.length);

  const mime = await detectMime(file.buffer);
  if (mime !== 'image/png') {
    throw new BadRequestException('ลายเซ็นต้องเป็นไฟล์ PNG ขนาดไม่เกิน 5MB');
  }

  return cloneMulterFile(
    file,
    file.buffer,
    'image/png',
    file.originalname?.toLowerCase().endsWith('.png')
      ? file.originalname
      : replaceExtension(file.originalname || 'signature', 'png'),
  );
}

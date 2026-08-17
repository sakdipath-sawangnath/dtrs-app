export const MAX_JOB_IMAGE_BYTES = 5 * 1024 * 1024;

/** งบประมาณรวมต่อ request เมื่อ proxy ยังเป็น nginx default ~1MB */
export const PROXY_SAFE_TOTAL_BYTES = 900 * 1024;

export const JOB_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

export const JOB_IMAGE_HINT =
  "JPG, PNG, WebP หรือ HEIC ไม่เกิน 5MB ต่อรูป";

const ALLOWED_MIME_PREFIXES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

function hasAllowedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function hasAllowedMime(type: string): boolean {
  const lower = type.toLowerCase();
  return ALLOWED_MIME_PREFIXES.some(
    (mime) => lower === mime || lower.startsWith(`${mime};`),
  );
}

/** คืนข้อความไทยถ้าไม่ผ่าน หรือ null ถ้าผ่าน */
export function validateJobImageFile(file: File): string | null {
  if (file.size > MAX_JOB_IMAGE_BYTES) {
    return "ไฟล์รูปใหญ่เกิน 5MB";
  }

  const type = file.type?.trim() ?? "";
  if (type && !hasAllowedMime(type)) {
    return "รองรับเฉพาะ JPG, PNG, WebP หรือ HEIC ขนาดไม่เกิน 5MB";
  }

  if (!type && !hasAllowedExtension(file.name)) {
    return "รองรับเฉพาะ JPG, PNG, WebP หรือ HEIC ขนาดไม่เกิน 5MB";
  }

  return null;
}

/** เคลียร์ input หลังเลือกไฟล์ไม่ผ่าน */
export function clearFileInput(input: HTMLInputElement | null): void {
  if (input) input.value = "";
}

export function isHeicLike(file: File): boolean {
  const type = file.type?.trim().toLowerCase() ?? "";
  const name = file.name.toLowerCase();
  return (
    type.includes("heic") ||
    type.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export function shouldProactivelyCompressForProxy(
  files: File[],
  reserveBytes = 48_000,
): boolean {
  if (files.length === 0) return false;
  const total = files.reduce((sum, file) => sum + file.size, 0);
  return total + reserveBytes > PROXY_SAFE_TOTAL_BYTES;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("IMAGE_LOAD_FAILED"));
    };
    img.src = url;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("COMPRESS_FAILED"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

/** บีบรูปเป็น JPEG ใน browser — ใช้เมื่อ proxy จำกัด body size */
export async function compressJobImageToJpeg(
  file: File,
  maxBytes: number,
): Promise<File> {
  if (typeof document === "undefined") {
    throw new Error("COMPRESS_REQUIRES_BROWSER");
  }
  if (isHeicLike(file)) {
    throw new Error("HEIC_CANNOT_COMPRESS_IN_BROWSER");
  }

  const img = await loadImageFromFile(file);
  const baseName = file.name.replace(/\.[^.]+$/i, "") || "image";
  const sourceW = img.naturalWidth || img.width || 1;
  const sourceH = img.naturalHeight || img.height || 1;

  const maxDimensions = [1920, 1600, 1280, 1024, 800];

  for (const maxDim of maxDimensions) {
    let cw = sourceW;
    let ch = sourceH;
    if (cw > maxDim || ch > maxDim) {
      const ratio = Math.min(maxDim / cw, maxDim / ch);
      cw = Math.max(1, Math.round(cw * ratio));
      ch = Math.max(1, Math.round(ch * ratio));
    }

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("COMPRESS_FAILED");
    ctx.drawImage(img, 0, 0, cw, ch);

    for (let quality = 0.88; quality >= 0.42; quality -= 0.08) {
      const blob = await canvasToJpegBlob(canvas, quality);
      if (blob.size <= maxBytes) {
        return new File([blob], `${baseName}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
    }
  }

  throw new Error("COMPRESS_TARGET_TOO_SMALL");
}

export async function compressJobImageFieldFiles(
  files: File[],
  maxPerFile: number,
): Promise<File[]> {
  const out: File[] = [];
  for (const file of files) {
    if (isHeicLike(file)) {
      if (file.size <= maxPerFile) {
        out.push(file);
        continue;
      }
      throw new Error("HEIC_TOO_LARGE_FOR_PROXY");
    }
    if (file.size <= maxPerFile) {
      out.push(file);
      continue;
    }
    out.push(await compressJobImageToJpeg(file, maxPerFile));
  }
  return out;
}

import axios from "axios";
import {
  compressJobImageFieldFiles,
  isHeicLike,
  PROXY_SAFE_TOTAL_BYTES,
  shouldProactivelyCompressForProxy,
} from "./jobImageUpload";

export class JobImageProxyLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobImageProxyLimitError";
  }
}

export const PROXY_LIMIT_HEIC_MESSAGE =
  "รูป HEIC ใหญ่เกินขีดจำกัดของเซิร์ฟเวอร์ — กรุณาแปลงเป็น JPG/PNG หรือถ่ายใหม่ในโหมด JPEG";

export const PROXY_LIMIT_GENERIC_MESSAGE =
  "ขนาดไฟล์รูปรวมเกินขีดจำกัดของเซิร์ฟเวอร์ — กรุณาลดจำนวนรูป ใช้ JPG แทน HEIC หรือติดต่อผู้ดูแลระบบ";

export const STORAGE_CONNECTION_ERROR_MESSAGE =
  "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หรือระบบจัดเก็บไฟล์ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";

export function isNetworkOrConnectionError(textOrErr: unknown): boolean {
  if (!textOrErr) return false;
  if (axios.isAxiosError(textOrErr)) {
    if (textOrErr.code === "ECONNABORTED" || textOrErr.code === "ERR_NETWORK") return true;
    if (!textOrErr.response && textOrErr.message?.toLowerCase().includes("network error")) return true;
  }
  const str =
    typeof textOrErr === "string"
      ? textOrErr
      : textOrErr instanceof Error
        ? textOrErr.message
        : String(textOrErr);
  const lower = str.toLowerCase();
  return (
    lower.includes("etimedout") ||
    lower.includes("econnrefused") ||
    lower.includes("ehostunreach") ||
    lower.includes("enetunreach") ||
    lower.includes("enotfound") ||
    lower.includes("econnreset") ||
    lower.includes("network error") ||
    lower.includes("connect ") ||
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+\b/.test(str)
  );
}

export function isHttp413Error(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 413;
}

export function formatJobImageUploadError(
  err: unknown,
  fallback: string,
): string {
  if (err instanceof JobImageProxyLimitError) return err.message;
  if (axios.isAxiosError(err) && err.response?.status === 413) {
    return PROXY_LIMIT_GENERIC_MESSAGE;
  }
  if (isNetworkOrConnectionError(err) || isNetworkOrConnectionError(fallback)) {
    return STORAGE_CONNECTION_ERROR_MESSAGE;
  }
  return fallback;
}

type ImageField = { name: string; files: File[] };

function identityFieldMap(fields: ImageField[]): Map<string, File[]> {
  const map = new Map<string, File[]>();
  for (const { name, files } of fields) {
    map.set(name, files);
  }
  return map;
}

function computePerFileBudget(
  fileCount: number,
  reserveNonImageBytes: number,
): number {
  if (fileCount < 1) return PROXY_SAFE_TOTAL_BYTES;
  const budget = Math.max(64 * 1024, PROXY_SAFE_TOTAL_BYTES - reserveNonImageBytes);
  return Math.max(96 * 1024, Math.floor(budget / fileCount));
}

async function compressFields(
  fields: ImageField[],
  reserveNonImageBytes: number,
): Promise<Map<string, File[]>> {
  const allFiles = fields.flatMap((f) => f.files);
  const perFile = computePerFileBudget(allFiles.length, reserveNonImageBytes);
  if (allFiles.some((f) => isHeicLike(f) && f.size > perFile)) {
    throw new JobImageProxyLimitError(PROXY_LIMIT_HEIC_MESSAGE);
  }

  const map = new Map<string, File[]>();
  try {
    for (const { name, files } of fields) {
      map.set(name, await compressJobImageFieldFiles(files, perFile));
    }
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "HEIC_TOO_LARGE_FOR_PROXY" ||
        err.message === "HEIC_CANNOT_COMPRESS_IN_BROWSER")
    ) {
      throw new JobImageProxyLimitError(PROXY_LIMIT_HEIC_MESSAGE);
    }
    throw err;
  }
  return map;
}

/**
 * อัปโหลด multipart พร้อม fallback เมื่อ reverse proxy จำกัด body (~1MB):
 * บีบอัดรูปฝั่ง client แล้วลองใหม่ (degraded quality)
 */
export async function runMultipartUploadWithProxyFallback<T>(options: {
  fields: ImageField[];
  reserveNonImageBytes?: number;
  onCompressing?: () => void;
  upload: (filesByField: Map<string, File[]>) => Promise<T>;
}): Promise<T> {
  const {
    fields,
    reserveNonImageBytes = 48_000,
    onCompressing,
    upload,
  } = options;

  const flatFiles = fields.flatMap((f) => f.files);
  let prepared: Map<string, File[]> | null = null;

  if (
    flatFiles.length > 0 &&
    shouldProactivelyCompressForProxy(flatFiles, reserveNonImageBytes)
  ) {
    onCompressing?.();
    prepared = await compressFields(fields, reserveNonImageBytes);
  }

  try {
    return await upload(prepared ?? identityFieldMap(fields));
  } catch (err) {
    if (!isHttp413Error(err)) throw err;
    if (prepared) {
      throw new JobImageProxyLimitError(PROXY_LIMIT_GENERIC_MESSAGE);
    }
    if (flatFiles.length < 1) {
      throw new JobImageProxyLimitError(PROXY_LIMIT_GENERIC_MESSAGE);
    }
    onCompressing?.();
    const compressed = await compressFields(fields, reserveNonImageBytes);
    try {
      return await upload(compressed);
    } catch (retryErr) {
      if (isHttp413Error(retryErr)) {
        throw new JobImageProxyLimitError(PROXY_LIMIT_GENERIC_MESSAGE);
      }
      throw retryErr;
    }
  }
}

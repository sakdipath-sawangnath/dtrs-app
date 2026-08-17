import { dashboardJobImagePath } from "@/lib/dashboardJobImageUrl";

export const FIX_IMAGE_SLOT_COUNT = 3;
export const REQUIRED_FIX_IMAGE_SLOTS = 2;

export function existingFixImageUrlCount(fixImages?: string[] | null): number {
  if (!Array.isArray(fixImages)) return 0;
  return fixImages.filter((u) => typeof u === "string" && u.trim().length > 0)
    .length;
}

/** Preview URL ต่อช่อง (ใช้ proxy แดชบอร์ด) — สูงสุด 3 ช่อง */
export function buildFixPreviewUrlsFromJob(
  jobId: number,
  fixImages?: string[] | null,
): (string | null)[] {
  const slots: (string | null)[] = Array.from(
    { length: FIX_IMAGE_SLOT_COUNT },
    () => null,
  );
  if (!Array.isArray(fixImages)) return slots;
  for (let i = 0; i < FIX_IMAGE_SLOT_COUNT; i++) {
    const raw = fixImages[i];
    if (typeof raw === "string" && raw.trim().length > 0) {
      slots[i] = dashboardJobImagePath(jobId, "fix", i);
    }
  }
  return slots;
}

function isFixImageSlotSatisfied(
  newFiles: readonly (File | null)[],
  existingUrls: readonly (string | null)[],
  index: number,
): boolean {
  if (newFiles[index] instanceof File) return true;
  const existing = existingUrls[index];
  return typeof existing === "string" && existing.length > 0;
}

/** รูปที่ 1 และ 2 ต้องมีไฟล์ใหม่หรือรูปเดิมในแต่ละช่อง */
export function hasRequiredFixImageSlots(
  newFiles: readonly (File | null)[],
  existingUrls: readonly (string | null)[],
): boolean {
  for (let i = 0; i < REQUIRED_FIX_IMAGE_SLOTS; i++) {
    if (!isFixImageSlotSatisfied(newFiles, existingUrls, i)) return false;
  }
  return true;
}

/** ตรวจว่าฟอร์ม/ข้อมูลงานมีครบก่อนปิดงาน (ไม่รวมลายเซ็นผู้แจ้ง) */
export function isFixInfoComplete(input: {
  fixEnvironment?: string | null;
  brokenPart?: string | null;
  cause?: string | null;
  fixMethod?: string | null;
  fixImages?: string[] | null;
  fixImageFiles?: readonly (File | null)[];
  fixImagePreviews?: readonly (string | null)[];
}): boolean {
  const env = input.fixEnvironment ?? "";
  const envOk = env === "INDOOR" || env === "OUTDOOR";
  const part = input.brokenPart ?? "";
  const partOk = part === "Hardware" || part === "Software";
  const causeOk = (input.cause ?? "").trim().length > 0;
  const methodOk = (input.fixMethod ?? "").trim().length > 0;
  const imagesOk =
    input.fixImageFiles != null && input.fixImagePreviews != null
      ? hasRequiredFixImageSlots(input.fixImageFiles, input.fixImagePreviews)
      : existingFixImageUrlCount(input.fixImages) >= REQUIRED_FIX_IMAGE_SLOTS;
  return envOk && partOk && causeOk && methodOk && imagesOk;
}

/** งานกำลังแก้ไขที่บันทึกการแก้ไขครบแล้ว รอผู้แจ้งเซ็นปิดงาน — ไม่ใช่สถานะใหม่ */
export function isAwaitingReporterSignature(job: {
  status?: string | null;
  fixEnvironment?: string | null;
  brokenPart?: string | null;
  cause?: string | null;
  fixMethod?: string | null;
  fixImages?: string[] | null;
}): boolean {
  if (job.status !== "IN_PROGRESS") return false;
  return isFixInfoComplete({
    fixEnvironment: job.fixEnvironment,
    brokenPart: job.brokenPart,
    cause: job.cause,
    fixMethod: job.fixMethod,
    fixImages: job.fixImages,
  });
}

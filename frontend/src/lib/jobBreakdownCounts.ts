/**
 * กฎการนับแยกประเภทสำหรับแดชบอร์ด — ต้อง sync กับ
 * backend/src/jobs/jobs-pdf.service.ts (normalizeFixEnvironment / normalizeBrokenPart)
 */

export type FixEnvironmentBucket = "INDOOR" | "OUTDOOR" | "UNKNOWN";
export type BrokenPartBucket = "Hardware" | "Software" | "UNKNOWN";

export function normalizeFixEnvironment(
  v: string | null | undefined,
): FixEnvironmentBucket {
  const u = (v ?? "").trim().toUpperCase();
  if (u === "INDOOR") return "INDOOR";
  if (u === "OUTDOOR") return "OUTDOOR";
  return "UNKNOWN";
}

export function normalizeBrokenPart(
  v: string | null | undefined,
): BrokenPartBucket {
  const lower = (v ?? "").trim().toLowerCase();
  if (lower === "hardware") return "Hardware";
  if (lower === "software") return "Software";
  return "UNKNOWN";
}

export interface JobBreakdownCounts {
  env: Record<FixEnvironmentBucket, number>;
  part: Record<BrokenPartBucket, number>;
}

export function countJobBreakdowns(
  jobs: Array<{ fixEnvironment?: string | null; brokenPart?: string | null }>,
): JobBreakdownCounts {
  const env: Record<FixEnvironmentBucket, number> = {
    INDOOR: 0,
    OUTDOOR: 0,
    UNKNOWN: 0,
  };
  const part: Record<BrokenPartBucket, number> = {
    Hardware: 0,
    Software: 0,
    UNKNOWN: 0,
  };
  for (const j of jobs) {
    env[normalizeFixEnvironment(j.fixEnvironment)]++;
    part[normalizeBrokenPart(j.brokenPart)]++;
  }
  return { env, part };
}

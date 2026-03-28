import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerApiBaseUrl } from "@/lib/serverApiBase";
import type { PdfPrefetchedImages } from "@/components/pdf/JobMaintenancePdfTemplate";

/** กัน server-side fetch ค้างไม่สิ้นสุด (มักเกิดเมื่อ PRD ไม่มี API_INTERNAL_BASE_URL แล้วไป hairpin ไป public URL) */
const JOB_FETCH_MS = 25_000;
const IMAGE_FETCH_MS = 20_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function unwrapApiData<T>(root: unknown): T | null {
  if (!root) return null;
  if (typeof root === "object" && root !== null && "data" in (root as Record<string, unknown>)) {
    return ((root as { data?: unknown }).data as T) ?? null;
  }
  return root as T;
}

async function fetchImageDataUrl(
  token: string,
  jobId: number,
  kind: "issue" | "fix",
  index: number,
): Promise<string | null> {
  const apiBase = getServerApiBaseUrl();
  const url = `${apiBase}/jobs/${jobId}/image/${kind}/${index}`;
  try {
    const res = await fetchWithTimeout(
      url,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
      IMAGE_FETCH_MS,
    );
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || "image/jpeg";
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * รวม job + รูป data URL สำหรับหน้าพิมพ์ — เรียกจาก client หลังโหลดหน้า
 * (ไม่ส่งผ่าน RSC props เพื่อกัน Maximum call stack เมื่อ base64 ใหญ่)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const secret = process.env.NEXTAUTH_SECRET ?? authOptions.secret;
  const jwt = await getToken({
    req: request,
    secret: secret as string,
  });
  const headerAuth = request.headers.get("authorization");
  const bearerFromHeader =
    headerAuth?.startsWith("Bearer ") ? headerAuth.slice(7).trim() : "";
  const token =
    bearerFromHeader ||
    ((jwt?.accessToken as string | undefined) ?? "");

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const jobId = Number(id);
  if (!Number.isFinite(jobId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const apiBase = getServerApiBaseUrl();
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${apiBase}/jobs/${jobId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
      JOB_FETCH_MS,
    );
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return Response.json(
      {
        error: aborted
          ? "หมดเวลาเชื่อมต่อ API ภายใน — ตรวจสอบ API_INTERNAL_BASE_URL ใน container frontend และ reverse proxy (เส้น /api/print-jobs ต้องส่งไป Next ไม่ใช่ Nest)"
          : "เชื่อมต่อ API ไม่สำเร็จ",
      },
      { status: 504 },
    );
  }
  if (!res.ok) {
    return Response.json({ error: "Job not found" }, { status: res.status });
  }
  const json = (await res.json()) as unknown;
  const job = unwrapApiData<Record<string, unknown>>(json);
  if (!job || (job.status as string | undefined) !== "RESOLVED") {
    return Response.json(
      { error: "พิมพ์ได้เฉพาะงานเสร็จสิ้น" },
      { status: 403 },
    );
  }

  const indices = [0, 1, 2] as const;
  const [issue, fix] = await Promise.all([
    Promise.all(
      indices.map((i) => fetchImageDataUrl(token, jobId, "issue", i)),
    ),
    Promise.all(indices.map((i) => fetchImageDataUrl(token, jobId, "fix", i))),
  ]);

  const prefetchedImages: PdfPrefetchedImages = { issue, fix };

  return Response.json({ job, prefetchedImages });
}

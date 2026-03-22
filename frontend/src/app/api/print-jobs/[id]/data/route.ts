import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import type { PdfPrefetchedImages } from "@/components/pdf/JobMaintenancePdfTemplate";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

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
  const url = `${API_BASE}/jobs/${jobId}/image/${kind}/${index}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "image/jpeg";
  return `data:${ct};base64,${buf.toString("base64")}`;
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

  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
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

  const issue: (string | null)[] = [];
  const fix: (string | null)[] = [];
  for (let i = 0; i < 3; i++) {
    issue.push(await fetchImageDataUrl(token, jobId, "issue", i));
    fix.push(await fetchImageDataUrl(token, jobId, "fix", i));
  }

  const prefetchedImages: PdfPrefetchedImages = { issue, fix };

  return Response.json({ job, prefetchedImages });
}

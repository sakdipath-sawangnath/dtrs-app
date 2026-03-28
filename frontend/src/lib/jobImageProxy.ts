import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerApiBaseUrl } from "@/lib/serverApiBase";

/**
 * Proxy รูปงาน — JWT จาก cookie แล้วเรียก Nest
 *
 * ใช้ path **`/job-images/...`** (ไม่อยู่ใต้ `/api`) บน PRD จะไป Next ตามปกติ
 * แม้ NPM ไม่ได้แยก `/api/job-images` → จะไม่โดน Nest แล้วได้ 404
 */
export async function jobImageProxyGET(
  request: NextRequest,
  params: { id: string; kind: string; index: string },
): Promise<Response> {
  const secret = process.env.NEXTAUTH_SECRET ?? authOptions.secret;
  const jwt = await getToken({
    req: request,
    secret: secret as string,
  });
  const token = (jwt?.accessToken as string | undefined) ?? undefined;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, kind, index } = params;
  const apiBase = getServerApiBaseUrl();
  const url = `${apiBase}/jobs/${encodeURIComponent(id)}/image/${encodeURIComponent(kind)}/${encodeURIComponent(index)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = "";
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        const text = await res.text();
        const j = JSON.parse(text) as {
          error?: { message?: string };
          message?: string;
        };
        message =
          (typeof j?.error?.message === "string" ? j.error.message : "") ||
          (typeof j?.message === "string" ? j.message : "") ||
          "";
      } catch {
        /* ignore */
      }
    }
    const body = JSON.stringify({
      status: res.status,
      message:
        message ||
        "Upstream image request failed (Nest could not load object storage)",
      nestPath: `/api/jobs/${id}/image/${kind}/${index}`,
    });
    return new Response(body, {
      status: res.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Upstream-Http-Status": String(res.status),
      },
    });
  }

  const buf = await res.arrayBuffer();
  const ct = res.headers.get("content-type") || "image/jpeg";
  return new Response(buf, {
    headers: {
      "Content-Type": ct,
      "Cache-Control": "private, max-age=120",
    },
  });
}

import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerApiBaseUrl } from "@/lib/serverApiBase";

/**
 * Proxy รูปโปรไฟล์ — JWT จาก cookie แล้วเรียก Nest `GET /users/:id/avatar`
 * Path **`/user-images/:userId`** ไม่อยู่ใต้ `/api` (เหมือน `/job-images`)
 */
export async function userImageProxyGET(
  request: NextRequest,
  params: { userId: string },
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

  const userId = params.userId?.trim();
  if (!userId || !/^\d+$/.test(userId)) {
    return new Response("Bad Request", { status: 400 });
  }

  const apiBase = getServerApiBaseUrl();
  const url = `${apiBase}/users/${encodeURIComponent(userId)}/avatar`;

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
      message: message || "Upstream avatar request failed",
      nestPath: `/api/users/${userId}/avatar`,
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

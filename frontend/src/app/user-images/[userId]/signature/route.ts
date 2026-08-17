import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerApiBaseUrl } from "@/lib/serverApiBase";

/**
 * Proxy ลายเซ็นเจ้าหน้าที่ — JWT จาก cookie แล้วเรียก Nest `GET /users/:id/signature`
 * Path `/user-images/:userId/signature`
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const secret = process.env.NEXTAUTH_SECRET ?? authOptions.secret;
  const jwt = await getToken({
    req: request,
    secret: secret as string,
  });
  const token = (jwt?.accessToken as string | undefined) ?? undefined;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const params = await context.params;
  const userId = params.userId?.trim();
  if (!userId || !/^\d+$/.test(userId)) {
    return new Response("Bad Request", { status: 400 });
  }

  const apiBase = getServerApiBaseUrl();
  const url = `${apiBase}/users/${encodeURIComponent(userId)}/signature`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({
        status: res.status,
        message: "Upstream signature request failed",
      }),
      {
        status: res.status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }

  const buf = await res.arrayBuffer();
  const ct = res.headers.get("content-type") || "image/png";
  return new Response(buf, {
    headers: {
      "Content-Type": ct,
      "Cache-Control": "private, max-age=120",
    },
  });
}

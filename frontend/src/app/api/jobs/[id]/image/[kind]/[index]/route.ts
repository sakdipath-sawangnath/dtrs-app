import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

/**
 * Proxy รูปงานไปยัง Nest API — same-origin สำหรับ `<img>` + html2canvas (ไม่ติด CORS จาก MinIO)
 * ใช้ getToken (JWT strategy) เพราะ getServerSession ใน Route Handler มักไม่ได้ cookie ครบ
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; kind: string; index: string }> },
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

  const { id, kind, index } = await context.params;
  const url = `${API_BASE}/jobs/${encodeURIComponent(id)}/image/${encodeURIComponent(kind)}/${encodeURIComponent(index)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return new Response(null, { status: res.status });
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

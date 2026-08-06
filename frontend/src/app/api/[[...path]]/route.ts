import type { NextRequest } from "next/server";
import { getServerApiBaseUrl } from "@/lib/serverApiBase";

/**
 * Safety-net: เมื่อ reverse proxy ส่ง `/api/*` ทั้งก้อนมา Next (8404)
 * ให้ forward เส้นที่ Nest เป็นเจ้าของไปยัง `API_INTERNAL_BASE_URL`
 *
 * Route ที่เฉพาะกว่า (auth / print-jobs / job-images / jobs/.../report-pdf|image)
 * ยังถูก Next จับก่อน catch-all นี้
 *
 * ทางที่ถูกระยะยาว: NPM Custom Location `/api/` → Nest :8405
 * (ดู backend/docs/Reverse-Proxy-Nginx-Proxy-Manager.md)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

/** Path ที่ต้องอยู่บน Next — กันพลาดถ้า routing เปลี่ยน */
const NEXT_OWNED_PREFIXES = ["auth", "print-jobs", "job-images"] as const;

function isNextOwnedJobsSubpath(segments: string[]): boolean {
  // /api/jobs/:id/report-pdf | /api/jobs/:id/image/...
  if (segments[0] !== "jobs" || segments.length < 3) return false;
  const sub = segments[2];
  return sub === "report-pdf" || sub === "image";
}

function buildTargetUrl(segments: string[], search: string): string {
  const base = getServerApiBaseUrl().replace(/\/$/, "");
  const path = segments.length ? `/${segments.join("/")}` : "";
  return `${base}${path}${search}`;
}

function filterRequestHeaders(src: Headers): Headers {
  const out = new Headers();
  src.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    out.set(key, value);
  });
  return out;
}

function filterResponseHeaders(src: Headers): Headers {
  const out = new Headers();
  src.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    // กัน Nest CORS ซ้ำซ้อนเมื่อตอบผ่าน same-origin ของ Next
    if (lower.startsWith("access-control-")) return;
    out.set(key, value);
  });
  return out;
}

async function proxyToNest(
  req: NextRequest,
  pathSegments: string[] | undefined,
): Promise<Response> {
  const segments = pathSegments ?? [];

  if (
    NEXT_OWNED_PREFIXES.includes(
      segments[0] as (typeof NEXT_OWNED_PREFIXES)[number],
    ) ||
    isNextOwnedJobsSubpath(segments)
  ) {
    return new Response("Not Found", { status: 404 });
  }

  const target = buildTargetUrl(segments, req.nextUrl.search);
  const method = req.method.toUpperCase();
  const headers = filterRequestHeaders(req.headers);

  const init: RequestInit = {
    method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = req.body;
    // Node fetch ต้องตั้ง duplex เมื่อส่ง ReadableStream body
    (init as RequestInit & { duplex: "half" }).duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : "upstream fetch failed";
    console.error("[api-proxy] Nest upstream error", { target, message });
    return Response.json(
      {
        success: false,
        message: "ไม่สามารถเชื่อมต่อ API ภายในได้",
        detail: message,
      },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: filterResponseHeaders(upstream.headers),
  });
}

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params;
  return proxyToNest(req, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;

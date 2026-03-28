import type { NextRequest } from "next/server";
import { jobImageProxyGET } from "@/lib/jobImageProxy";

/** Same-origin สำหรับ `<img>` — ไม่อยู่ใต้ `/api` เพื่อไม่ชน rule `/api/` → Nest บน NPM */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; kind: string; index: string }> },
) {
  const params = await context.params;
  return jobImageProxyGET(request, params);
}

import type { NextRequest } from "next/server";
import { jobImageProxyGET } from "@/lib/jobImageProxy";

/**
 * Alias ใต้ `/api/job-images` — ต้องตั้ง NPM แยก path นี้ไป Next (8404)
 * ค่าเริ่มต้นหน้าพิมพ์ใช้ **`/job-images/...`** แทน (ไม่ต้องตั้ง NPM เพิ่ม)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; kind: string; index: string }> },
) {
  const params = await context.params;
  return jobImageProxyGET(request, params);
}

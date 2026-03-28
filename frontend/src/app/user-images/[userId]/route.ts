import type { NextRequest } from "next/server";
import { userImageProxyGET } from "@/lib/userImageProxy";

/** Same-origin สำหรับ `<img>` รูปโปรไฟล์แดชบอร์ด — ไม่อยู่ใต้ `/api` */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const params = await context.params;
  return userImageProxyGET(request, params);
}

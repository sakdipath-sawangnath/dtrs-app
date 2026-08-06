/**
 * Base URL สำหรับ Next.js ฝั่งเซิร์ฟเวอร์ (Route Handler, NextAuth authorize) ไปยัง Nest
 *
 * บน PRD/Docker ตั้ง `API_INTERNAL_BASE_URL` (เช่น `http://dtrs-app-backend:4100/api`
 * หรือ `http://backend:4100/api`) เพื่อไม่ให้ server-side fetch ไป public URL
 * (กัน hairpin NAT / DNS / timeout จากใน container)
 *
 * เบราว์เซอร์ยังใช้ `NEXT_PUBLIC_API_BASE_URL` ตามเดิม
 */
export function getServerApiBaseUrl(): string {
  const internal = process.env.API_INTERNAL_BASE_URL?.trim();
  if (internal) return internal.replace(/\/$/, "");
  const pub = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (pub) return pub.replace(/\/$/, "");
  return "http://localhost:4100/api";
}

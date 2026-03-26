/** Base URL สำหรับ fetch จากเบราว์เซอร์ไปยัง Nest API */
export function getClientApiBaseUrl(): string {
  const pub = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (pub) return pub.replace(/\/$/, "");
  return "http://localhost:4000/api";
}

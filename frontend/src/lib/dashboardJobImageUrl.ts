/**
 * URL same-origin สำหรับ `<img>` รูปงานบนแดชบอร์ด — proxy ผ่าน Next (`jobImageProxy`) + JWT cookie
 * ไม่เปิดเผย URL MinIO ตรงสู่เบราว์เซอร์ (รองรับ bucket private)
 */
export function dashboardJobImagePath(
  jobId: number,
  kind: "issue" | "fix",
  index: number,
): string {
  return `/job-images/${jobId}/${kind}/${index}`;
}

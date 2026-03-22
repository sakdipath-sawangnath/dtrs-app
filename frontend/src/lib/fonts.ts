import localFont from "next/font/local";

/**
 * Sarabun แบบ self-hosted จาก `public/fonts/*.ttf` (ไม่โหลดจาก Google Fonts CDN)
 *
 * ไฟล์ปัจจุบันมาจากชุด Sarabun ใน Google Fonts (OFL) — ถ้านโยบายองค์กรกำหนด **TH Sarabun New**
 * ให้แทนที่ไฟล์ใน `public/fonts/` ด้วย THSarabunNew*.ttf แล้วปรับ `src` ด้านล่างให้ตรงชื่อไฟล์/น้ำหนัก
 */
export const sarabun = localFont({
  src: [
    {
      path: "../../public/fonts/Sarabun-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Sarabun-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Sarabun-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Sarabun-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Sarabun-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-sarabun",
});

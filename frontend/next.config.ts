import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // ใช้โฟลเดอร์ frontend เป็น root (เมื่อรันจาก frontend/) เพื่อไม่ให้สับสนกับ package-lock.json ที่ root โปรเจกต์
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;

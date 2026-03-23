import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // ใช้โฟลเดอร์ frontend เป็น root (เมื่อรันจาก frontend/) เพื่อไม่ให้สับสนกับ package-lock.json ที่ root โปรเจกต์
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;

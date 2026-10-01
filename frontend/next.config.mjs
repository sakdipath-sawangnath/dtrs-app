import path from "path";
import os from "node:os";
import { withSentryConfig } from "@sentry/nextjs/config";

/**
 * รวบรวม IP/hostname สำหรับ dev server เพื่อแก้ Next.js warning:
 * "Cross-origin request detected from ... to /_next/* resource.
 * In a future major version of Next.js, explicitly configure allowedDevOrigins in next.config"
 */
function getAllowedDevOrigins() {
  const origins = new Set(["localhost", "127.0.0.1"]);
  try {
    const interfaces = os.networkInterfaces();
    for (const list of Object.values(interfaces)) {
      if (!list) continue;
      for (const net of list) {
        if (net.family === "IPv4" && !net.internal) {
          origins.add(net.address);
        }
      }
    }
  } catch {
    // fallback gracefully
  }

  const envOrigins = process.env.ALLOWED_DEV_ORIGINS;
  if (envOrigins) {
    for (const origin of envOrigins.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) origins.add(trimmed);
    }
  }

  return Array.from(origins);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: getAllowedDevOrigins(),
  turbopack: {
    // ใช้โฟลเดอร์ frontend เป็น root (เมื่อรันจาก frontend/) เพื่อไม่ให้สับสนกับ package-lock.json ที่ root โปรเจกต์
    root: path.resolve(process.cwd()),
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "glitchtip",
  project: process.env.SENTRY_PROJECT || "dtrs-app",
  sentryUrl: process.env.SENTRY_URL || "http://192.168.0.115:8700",
  telemetry: false,
  silent: true,
  sourcemaps: {
    disable: true,
  },
  release: {
    create: false,
    finalize: false,
  },
  // ไม่ใช้ tunnelRoute ของ plugin — มี Route Handler `/monitoring` เอง (allowlist โปรเจกต์ DSN)
  errorHandler: (err) => {
    console.warn(
      "[sentry] withSentryConfig plugin error (build continues):",
      err.message,
    );
  },
});

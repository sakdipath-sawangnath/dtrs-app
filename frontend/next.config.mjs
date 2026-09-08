import path from "path";
import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
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

/** Same-origin tunnel — อย่าใส่ใต้ `/api/` (NPM ส่ง `/api/` ไป Nest) */
export const SENTRY_TUNNEL_PATH = "/monitoring";

/** GlitchTip ingest origin (ไม่ใช่ sentry.io) */
export const DEFAULT_SENTRY_URL = "http://192.168.0.115:8700";

export function getSentryEnvironment(): string {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim();
  if (appEnv) return appEnv;
  return process.env.NODE_ENV || "development";
}

export function getSentryRelease(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_APP_RELEASE?.trim();
  if (explicit) return explicit;
  const version = process.env.NEXT_PUBLIC_APP_VERSION?.trim();
  if (!version) return undefined;
  return version.includes("@") ? version : `dtrs-app@${version}`;
}

export function getConfiguredSentryDsn(): string | undefined {
  const server = process.env.SENTRY_DSN?.trim();
  if (server) return server;
  const pub = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return pub || undefined;
}

export function getSentryUrl(): string {
  return process.env.SENTRY_URL?.trim() || DEFAULT_SENTRY_URL;
}

/** เปิดหน้าทดสอบ throw นอก production — ยังต้องล็อกอินแดชบอร์ด */
export function isSentryDebugPageEnabled(): boolean {
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || "").trim().toLowerCase();
  if (appEnv === "production" || appEnv === "prd") return false;
  if (
    appEnv === "staging" ||
    appEnv === "uat" ||
    appEnv === "development" ||
    appEnv === "dev"
  ) {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}

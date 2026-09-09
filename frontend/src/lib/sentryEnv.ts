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

function tracesSampleRateFallback(appEnv: string): number {
  const env = appEnv.trim().toLowerCase();
  if (env === "staging" || env === "uat") return 1;
  if (env === "production" || env === "prd") return 0.1;
  return 0;
}

/** รับเฉพาะตัวเลขในช่วง 0–1; ค่าว่าง/เพี้ยน/นอกช่วง = null (ให้ไป fallback) */
export function parseTracesSampleRateInUnitInterval(
  raw: string | undefined,
): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 0 || n > 1) return null;
  return n;
}

export function resolveSentryTracesSampleRate(
  raw: string | undefined,
  appEnv: string,
): number {
  const parsed = parseTracesSampleRateInUnitInterval(raw);
  if (parsed !== null) return parsed;
  return tracesSampleRateFallback(appEnv);
}

/**
 * Bake จาก NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE; ว่าง/เพี้ยนใช้ fallback ตาม
 * NEXT_PUBLIC_APP_ENV เท่านั้น — อย่าใช้ NODE_ENV (`next build` = production)
 */
export function getSentryTracesSampleRate(): number {
  return resolveSentryTracesSampleRate(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    process.env.NEXT_PUBLIC_APP_ENV ?? "",
  );
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

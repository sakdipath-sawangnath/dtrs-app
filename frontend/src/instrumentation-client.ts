import * as Sentry from "@sentry/nextjs";
import {
  getSentryEnvironment,
  getSentryRelease,
  getSentryTracesSampleRate,
  SENTRY_TUNNEL_PATH,
} from "@/lib/sentryEnv";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: getSentryEnvironment(),
  release: getSentryRelease(),
  tracesSampleRate: getSentryTracesSampleRate(),
  sendDefaultPii: false,
  // เบราว์เซอร์นอก LAN เข้า 192.168.0.115:8700 ไม่ได้ — ส่งผ่าน Next แล้ว server ค่อย forward
  tunnel: SENTRY_TUNNEL_PATH,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

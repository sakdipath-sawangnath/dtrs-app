import * as Sentry from "@sentry/nextjs";
import {
  getConfiguredSentryDsn,
  getSentryEnvironment,
  getSentryRelease,
  getSentryTracesSampleRate,
} from "@/lib/sentryEnv";

const dsn = getConfiguredSentryDsn();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: getSentryEnvironment(),
  release: getSentryRelease(),
  tracesSampleRate: getSentryTracesSampleRate(),
  sendDefaultPii: false,
});

import {
  GLITCHTIP_INGEST_TIMEOUT_MS,
  getGlitchTipEnvelopeRejectReason,
  isCircuitBreakerOpen,
  parseEnvelopeHeaderDsnFromBytes,
  parseSentryDsn,
  readRequestBodyWithLimit,
  recordCircuitBreakerFailure,
  recordCircuitBreakerSuccess,
  sentryEnvelopeIngestUrl,
} from "@/lib/glitchtipTunnel";
import { getConfiguredSentryDsn, getSentryUrl } from "@/lib/sentryEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin envelope tunnel → GlitchTip
 * เบราว์เซอร์ยิงมาที่นี่ แล้ว Next (ใน LAN) forward ไป ingest
 */
export async function POST(req: Request): Promise<Response> {
  const allowedDsn = getConfiguredSentryDsn();
  if (!allowedDsn) {
    return new Response("sentry not configured", { status: 503 });
  }

  const bodyResult = await readRequestBodyWithLimit(req);
  if (!bodyResult.ok) {
    return new Response("payload too large", { status: 413 });
  }
  if (bodyResult.body.byteLength === 0) {
    return new Response("empty envelope", { status: 400 });
  }

  const envelopeDsn = parseEnvelopeHeaderDsnFromBytes(bodyResult.body);
  if (!envelopeDsn) {
    return new Response("missing envelope dsn", { status: 400 });
  }

  const sentryUrl = getSentryUrl();
  const rejectReason = getGlitchTipEnvelopeRejectReason(
    envelopeDsn,
    allowedDsn,
    sentryUrl,
  );
  if (rejectReason) {
    return Response.json(
      { error: "forbidden", reason: rejectReason },
      { status: 403 },
    );
  }

  const allowedParsed = parseSentryDsn(allowedDsn);
  if (!allowedParsed) {
    return new Response("sentry not configured", { status: 503 });
  }

  // Circuit breaker: If upstream is known to be offline, return 202 Accepted immediately
  // to prevent request queuing, browser 504 errors, and Sentry client retry storms.
  if (isCircuitBreakerOpen()) {
    return Response.json(
      { status: "dropped", reason: "circuit_breaker_open" },
      { status: 202 },
    );
  }

  const ingestUrl = sentryEnvelopeIngestUrl(allowedParsed, sentryUrl);
  const contentType =
    req.headers.get("content-type") || "application/x-sentry-envelope";

  try {
    const upstream = await fetch(ingestUrl, {
      method: "POST",
      body: new Uint8Array(bodyResult.body),
      headers: { "Content-Type": contentType },
      signal: AbortSignal.timeout(GLITCHTIP_INGEST_TIMEOUT_MS),
    });

    // Upstream responded successfully; reset circuit breaker
    const recovered = recordCircuitBreakerSuccess();
    if (recovered) {
      console.info(
        "[glitchtip-tunnel] upstream recovered, circuit breaker closed",
      );
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "upstream failed";
    const { isFirstFailure, cooldownMs, consecutiveFailures } =
      recordCircuitBreakerFailure();

    // Log warning when first entering circuit breaker or when backoff increments
    if (isFirstFailure) {
      console.warn(
        `[glitchtip-tunnel] upstream offline, entering ${cooldownMs / 1000}s circuit breaker`,
        { message },
      );
    } else if (consecutiveFailures <= 3) {
      console.warn(
        `[glitchtip-tunnel] upstream still offline (failure #${consecutiveFailures}), backoff ${cooldownMs / 1000}s`,
        { message },
      );
    }

    // Return 202 Accepted so Sentry client treats envelope as processed/dropped,
    // preventing 504 console errors, retry loops, and interference with page navigation.
    return Response.json(
      { status: "dropped", reason: "upstream_offline" },
      { status: 202 },
    );
  }
}

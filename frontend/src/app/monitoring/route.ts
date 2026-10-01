import {
  getGlitchTipEnvelopeRejectReason,
  parseEnvelopeHeaderDsnFromBytes,
  parseSentryDsn,
  readRequestBodyWithLimit,
  sentryEnvelopeIngestUrl,
} from "@/lib/glitchtipTunnel";
import { getConfiguredSentryDsn, getSentryUrl } from "@/lib/sentryEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GlitchTip ingest timeout — fail fast instead of hanging 30s+ */
/** GlitchTip ingest timeout — fail fast (2s) so monitoring drops quietly if host unreachable */
const GLITCHTIP_INGEST_TIMEOUT_MS = 2_000;
/** Circuit breaker cooldown when upstream is offline — avoid blocking every request for 2s */
const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;
let lastFailureTimestamp = 0;

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
  const now = Date.now();
  if (now - lastFailureTimestamp < CIRCUIT_BREAKER_COOLDOWN_MS) {
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
    lastFailureTimestamp = 0;
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    lastFailureTimestamp = Date.now();
    const message = err instanceof Error ? err.message : "upstream failed";
    console.warn("[glitchtip-tunnel] upstream offline, entering 30s circuit breaker", {
      message,
    });
    // Return 202 Accepted so Sentry client treats envelope as processed/dropped,
    // preventing 504 console errors, retry loops, and interference with page navigation.
    return Response.json(
      { status: "dropped", reason: "upstream_offline" },
      { status: 202 },
    );
  }
}

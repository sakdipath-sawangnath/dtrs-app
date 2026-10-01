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
const GLITCHTIP_INGEST_TIMEOUT_MS = 5_000;

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
    console.error("[glitchtip-tunnel] ingest error", { message });
    return new Response("glitchtip unreachable", { status: 502 });
  }
}

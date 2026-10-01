export type ParsedSentryDsn = {
  protocol: string;
  publicKey: string;
  hostname: string;
  port: string;
  host: string;
  projectId: string;
};

/** กัน DoS ผ่าน tunnel สาธารณะ — envelope จริงของ SDK มักเล็กกว่านี้มาก */
export const MAX_GLITCHTIP_ENVELOPE_BYTES = 1024 * 1024;

/** รูปแบบเดียวกับ `@sentry/core` — host กับ port แยกกัน */
const DSN_REGEX =
  /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)((?:\[[:.%\w]+\]|[\w.-]+))(?::(\d+))?\/(.+)/;

export function parseSentryDsn(dsn: string): ParsedSentryDsn | null {
  const trimmed = dsn.trim();
  if (!trimmed) return null;

  const match = DSN_REGEX.exec(trimmed);
  if (match) {
    const protocol = match[1];
    const publicKey = match[2];
    const hostname = match[4];
    const port = match[5] || "";
    const lastPath = match[6] || "";
    const split = lastPath.split("/");
    const projectId = (split.pop() || "").match(/^\d+/)?.[0] || "";
    if (!protocol || !publicKey || !hostname || !projectId) return null;
    if (protocol !== "http" && protocol !== "https") return null;
    return {
      protocol: `${protocol}:`,
      publicKey,
      hostname,
      port,
      host: port ? `${hostname}:${port}` : hostname,
      projectId,
    };
  }

  try {
    const url = new URL(trimmed);
    const projectId =
      url.pathname.replace(/^\//, "").split("/").pop()?.match(/^\d+/)?.[0] ?? "";
    if (!url.username || !url.hostname || !projectId) return null;
    return {
      protocol: url.protocol,
      publicKey: url.username,
      hostname: url.hostname,
      port: url.port,
      host: url.host,
      projectId,
    };
  } catch {
    return null;
  }
}

export function sentryEnvelopeIngestUrl(
  parsed: ParsedSentryDsn,
  allowedSentryUrl: string,
): string {
  const origin = new URL(allowedSentryUrl);
  const base = `${origin.protocol}//${origin.host}`.replace(/\/$/, "");
  const params = new URLSearchParams({
    sentry_key: parsed.publicKey,
    sentry_version: "7",
  });
  return `${base}/api/${parsed.projectId}/envelope/?${params.toString()}`;
}

export function contentLengthExceedsLimit(
  contentLengthHeader: string | null,
  maxBytes = MAX_GLITCHTIP_ENVELOPE_BYTES,
): boolean {
  if (!contentLengthHeader) return false;
  const n = Number(contentLengthHeader);
  return Number.isFinite(n) && n > maxBytes;
}

export async function readRequestBodyWithLimit(
  req: Request,
  maxBytes = MAX_GLITCHTIP_ENVELOPE_BYTES,
): Promise<{ ok: true; body: Buffer } | { ok: false }> {
  if (contentLengthExceedsLimit(req.headers.get("content-length"), maxBytes)) {
    return { ok: false };
  }

  const reader = req.body?.getReader();
  if (!reader) {
    return { ok: true, body: Buffer.alloc(0) };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return { ok: false };
    }
    chunks.push(value);
  }
  return { ok: true, body: Buffer.concat(chunks) };
}

/**
 * กัน open proxy: envelope ต้องชี้โฮสต์ SENTRY_URL และโปรเจกต์/public key
 * เดียวกับ DSN ของ env นี้ (envelope บางชุดไม่ใส่พอร์ตใน DSN)
 */
export function isAllowedGlitchTipEnvelopeDsn(
  envelopeDsn: string,
  allowedDsn: string | undefined,
  allowedSentryUrl: string,
): boolean {
  return (
    getGlitchTipEnvelopeRejectReason(
      envelopeDsn,
      allowedDsn,
      allowedSentryUrl,
    ) === null
  );
}

export function getGlitchTipEnvelopeRejectReason(
  envelopeDsn: string,
  allowedDsn: string | undefined,
  allowedSentryUrl: string,
): string | null {
  if (!allowedDsn?.trim()) return "dsn_not_configured";

  const parsed = parseSentryDsn(envelopeDsn);
  if (!parsed) return "invalid_dsn";

  const allowed = parseSentryDsn(allowedDsn);
  if (!allowed) return "invalid_configured_dsn";

  try {
    const allowedOrigin = new URL(allowedSentryUrl);
    if (parsed.hostname !== allowedOrigin.hostname) return "host_mismatch";
    if (parsed.protocol !== allowedOrigin.protocol) return "protocol_mismatch";
  } catch {
    return "invalid_sentry_url";
  }

  if (parsed.projectId !== allowed.projectId) return "project_mismatch";
  if (parsed.publicKey !== allowed.publicKey) return "key_mismatch";
  return null;
}

export function parseEnvelopeHeaderDsn(envelope: string): string | null {
  const firstLine = envelope.split("\n")[0]?.trim();
  if (!firstLine) return null;
  try {
    const header = JSON.parse(firstLine) as { dsn?: unknown };
    return typeof header.dsn === "string" && header.dsn.trim()
      ? header.dsn.trim()
      : null;
  } catch {
    return null;
  }
}

export function parseEnvelopeHeaderDsnFromBytes(buf: Buffer): string | null {
  const nl = buf.indexOf(0x0a);
  const headerBytes = nl === -1 ? buf : buf.subarray(0, nl);
  return parseEnvelopeHeaderDsn(`${headerBytes.toString("utf8")}\n`);
}

/** GlitchTip ingest timeout — fail fast (2s) so monitoring drops quietly if host unreachable */
export const GLITCHTIP_INGEST_TIMEOUT_MS = 2_000;

/** Circuit breaker configuration */
export const CIRCUIT_BREAKER_BASE_COOLDOWN_MS = 30_000; // 30s
export const CIRCUIT_BREAKER_MAX_COOLDOWN_MS = 300_000; // 5m
export const CIRCUIT_BREAKER_BACKOFF_FACTOR = 2;

export interface CircuitBreakerState {
  consecutiveFailures: number;
  lastFailureTimestamp: number;
  currentCooldownMs: number;
}

let cbState: CircuitBreakerState = {
  consecutiveFailures: 0,
  lastFailureTimestamp: 0,
  currentCooldownMs: CIRCUIT_BREAKER_BASE_COOLDOWN_MS,
};

/**
 * คำนวณระยะเวลา cooldown แบบ Exponential Backoff เมื่อ upstream ออฟไลน์ต่อเนื่อง
 */
export function calculateCircuitBreakerCooldown(
  consecutiveFailures: number,
  baseCooldownMs = CIRCUIT_BREAKER_BASE_COOLDOWN_MS,
  maxCooldownMs = CIRCUIT_BREAKER_MAX_COOLDOWN_MS,
  backoffFactor = CIRCUIT_BREAKER_BACKOFF_FACTOR,
): number {
  if (consecutiveFailures <= 0) return baseCooldownMs;
  const cooldown =
    baseCooldownMs * Math.pow(backoffFactor, consecutiveFailures - 1);
  return Math.min(cooldown, maxCooldownMs);
}

/**
 * ตรวจสอบว่า Circuit Breaker กำลังเปิด (Open / Cooldown) หรือไม่
 */
export function isCircuitBreakerOpen(
  now = Date.now(),
  state = cbState,
): boolean {
  if (state.lastFailureTimestamp === 0) return false;
  return now - state.lastFailureTimestamp < state.currentCooldownMs;
}

/**
 * บันทึกความล้มเหลวในการเชื่อมต่อ upstream พร้อมปรับ cooldown ตามระดับ backoff
 */
export function recordCircuitBreakerFailure(
  now = Date.now(),
  state = cbState,
): { isFirstFailure: boolean; cooldownMs: number; consecutiveFailures: number } {
  const isFirstFailure = state.consecutiveFailures === 0;
  state.consecutiveFailures += 1;
  state.lastFailureTimestamp = now;
  state.currentCooldownMs = calculateCircuitBreakerCooldown(
    state.consecutiveFailures,
  );
  return {
    isFirstFailure,
    cooldownMs: state.currentCooldownMs,
    consecutiveFailures: state.consecutiveFailures,
  };
}

/**
 * บันทึกเมื่อ upstream ตอบกลับสำเร็จ เพื่อรีเซ็ต Circuit Breaker เป็นสถานะ Closed
 */
export function recordCircuitBreakerSuccess(state = cbState): boolean {
  const hadFailures = state.consecutiveFailures > 0;
  state.consecutiveFailures = 0;
  state.lastFailureTimestamp = 0;
  state.currentCooldownMs = CIRCUIT_BREAKER_BASE_COOLDOWN_MS;
  return hadFailures;
}

export function getCircuitBreakerState(): Readonly<CircuitBreakerState> {
  return { ...cbState };
}

export function resetCircuitBreakerForTest(): void {
  cbState = {
    consecutiveFailures: 0,
    lastFailureTimestamp: 0,
    currentCooldownMs: CIRCUIT_BREAKER_BASE_COOLDOWN_MS,
  };
}


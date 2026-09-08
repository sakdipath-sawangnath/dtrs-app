import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  contentLengthExceedsLimit,
  isAllowedGlitchTipEnvelopeDsn,
  parseEnvelopeHeaderDsn,
  parseSentryDsn,
  readRequestBodyWithLimit,
  sentryEnvelopeIngestUrl,
} from "./glitchtipTunnel";

const sampleDsn = "http://abc123@192.168.0.115:8700/2";
const sentryUrl = "http://192.168.0.115:8700";

describe("parseSentryDsn", () => {
  it("parses host, key, and project id", () => {
    const parsed = parseSentryDsn(sampleDsn);
    assert.deepEqual(parsed, {
      protocol: "http:",
      publicKey: "abc123",
      hostname: "192.168.0.115",
      port: "8700",
      host: "192.168.0.115:8700",
      projectId: "2",
    });
  });

  it("rejects garbage", () => {
    assert.equal(parseSentryDsn("not-a-dsn"), null);
    assert.equal(parseSentryDsn(""), null);
  });
});

describe("sentryEnvelopeIngestUrl", () => {
  it("builds GlitchTip envelope path from SENTRY_URL origin", () => {
    const parsed = parseSentryDsn(sampleDsn);
    assert.ok(parsed);
    assert.equal(
      sentryEnvelopeIngestUrl(parsed, sentryUrl),
      "http://192.168.0.115:8700/api/2/envelope/?sentry_key=abc123&sentry_version=7",
    );
  });

  it("still forwards to SENTRY_URL when envelope DSN omits the port", () => {
    const parsed = parseSentryDsn("http://abc123@192.168.0.115/2");
    assert.ok(parsed);
    assert.equal(parsed.hostname, "192.168.0.115");
    assert.equal(
      sentryEnvelopeIngestUrl(parsed, sentryUrl),
      "http://192.168.0.115:8700/api/2/envelope/?sentry_key=abc123&sentry_version=7",
    );
  });
});

describe("isAllowedGlitchTipEnvelopeDsn", () => {
  it("allows matching GlitchTip DSN", () => {
    assert.equal(
      isAllowedGlitchTipEnvelopeDsn(sampleDsn, sampleDsn, sentryUrl),
      true,
    );
  });

  it("rejects sentry.io", () => {
    assert.equal(
      isAllowedGlitchTipEnvelopeDsn(
        "https://abc123@o1.ingest.sentry.io/1",
        sampleDsn,
        sentryUrl,
      ),
      false,
    );
  });

  it("rejects a different project on the same GlitchTip host", () => {
    assert.equal(
      isAllowedGlitchTipEnvelopeDsn(
        "http://abc123@192.168.0.115:8700/99",
        sampleDsn,
        sentryUrl,
      ),
      false,
    );
  });

  it("rejects a different public key on the same project", () => {
    assert.equal(
      isAllowedGlitchTipEnvelopeDsn(
        "http://otherkey@192.168.0.115:8700/2",
        sampleDsn,
        sentryUrl,
      ),
      false,
    );
  });

  it("rejects when no DSN is configured", () => {
    assert.equal(
      isAllowedGlitchTipEnvelopeDsn(sampleDsn, undefined, sentryUrl),
      false,
    );
  });

  it("allows envelope DSN that omits the ingest port", () => {
    assert.equal(
      isAllowedGlitchTipEnvelopeDsn(
        "http://abc123@192.168.0.115/2",
        sampleDsn,
        sentryUrl,
      ),
      true,
    );
  });
});

describe("contentLengthExceedsLimit", () => {
  it("rejects declared length over the cap", () => {
    assert.equal(contentLengthExceedsLimit("1048577", 1024 * 1024), true);
    assert.equal(contentLengthExceedsLimit("100", 1024), false);
    assert.equal(contentLengthExceedsLimit(null, 1024), false);
  });
});

describe("readRequestBodyWithLimit", () => {
  it("returns the body when under the cap", async () => {
    const req = new Request("http://localhost/monitoring", {
      method: "POST",
      body: "ok",
    });
    const result = await readRequestBodyWithLimit(req, 10);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.body.toString("utf8"), "ok");
    }
  });

  it("rejects a body over the cap", async () => {
    const req = new Request("http://localhost/monitoring", {
      method: "POST",
      body: "abcdefghijk",
    });
    const result = await readRequestBodyWithLimit(req, 10);
    assert.equal(result.ok, false);
  });
});

describe("parseEnvelopeHeaderDsn", () => {
  it("reads dsn from envelope header line", () => {
    const envelope = `${JSON.stringify({ dsn: sampleDsn })}\n{}\n`;
    assert.equal(parseEnvelopeHeaderDsn(envelope), sampleDsn);
  });

  it("returns null when header is invalid", () => {
    assert.equal(parseEnvelopeHeaderDsn("not-json\n"), null);
  });
});

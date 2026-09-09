import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getSentryTracesSampleRate,
  parseTracesSampleRateInUnitInterval,
  resolveSentryTracesSampleRate,
} from "./sentryEnv";

describe("parseTracesSampleRateInUnitInterval", () => {
  it("accepts 0, 1, and fractions", () => {
    assert.equal(parseTracesSampleRateInUnitInterval("0"), 0);
    assert.equal(parseTracesSampleRateInUnitInterval("1"), 1);
    assert.equal(parseTracesSampleRateInUnitInterval("0.1"), 0.1);
    assert.equal(parseTracesSampleRateInUnitInterval(" 1.0 "), 1);
  });

  it("rejects empty, non-numeric, and out of range", () => {
    assert.equal(parseTracesSampleRateInUnitInterval(undefined), null);
    assert.equal(parseTracesSampleRateInUnitInterval(""), null);
    assert.equal(parseTracesSampleRateInUnitInterval("abc"), null);
    assert.equal(parseTracesSampleRateInUnitInterval("10%"), null);
    assert.equal(parseTracesSampleRateInUnitInterval("1,5"), null);
    assert.equal(parseTracesSampleRateInUnitInterval("2"), null);
    assert.equal(parseTracesSampleRateInUnitInterval("-0.1"), null);
  });
});

describe("resolveSentryTracesSampleRate", () => {
  it("uses GitLab override when valid", () => {
    assert.equal(resolveSentryTracesSampleRate("0.2", "staging"), 0.2);
    assert.equal(resolveSentryTracesSampleRate("0", "production"), 0);
  });

  it("falls back by env when empty or invalid", () => {
    assert.equal(resolveSentryTracesSampleRate(undefined, "staging"), 1);
    assert.equal(resolveSentryTracesSampleRate("", "uat"), 1);
    assert.equal(resolveSentryTracesSampleRate("abc", "production"), 0.1);
    assert.equal(resolveSentryTracesSampleRate("2", "prd"), 0.1);
    assert.equal(resolveSentryTracesSampleRate(undefined, "development"), 0);
    assert.equal(resolveSentryTracesSampleRate("nope", "dev"), 0);
    assert.equal(resolveSentryTracesSampleRate(undefined, ""), 0);
  });
});

describe("getSentryTracesSampleRate", () => {
  it("does not treat NODE_ENV=production as production traces fallback", () => {
    const prevApp = process.env.NEXT_PUBLIC_APP_ENV;
    const prevRate = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
    const prevNode = process.env.NODE_ENV;
    try {
      delete process.env.NEXT_PUBLIC_APP_ENV;
      delete process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
      process.env.NODE_ENV = "production";
      assert.equal(getSentryTracesSampleRate(), 0);
    } finally {
      if (prevApp === undefined) {
        delete process.env.NEXT_PUBLIC_APP_ENV;
      } else {
        process.env.NEXT_PUBLIC_APP_ENV = prevApp;
      }
      if (prevRate === undefined) {
        delete process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
      } else {
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = prevRate;
      }
      process.env.NODE_ENV = prevNode;
    }
  });
});

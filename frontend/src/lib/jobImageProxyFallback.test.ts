/**
 * Unit tests: proxy 413 fallback for job image multipart upload
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatJobImageUploadError,
  isHttp413Error,
  isNetworkOrConnectionError,
  JobImageProxyLimitError,
  PROXY_LIMIT_GENERIC_MESSAGE,
  PROXY_LIMIT_HEIC_MESSAGE,
  runMultipartUploadWithProxyFallback,
  STORAGE_CONNECTION_ERROR_MESSAGE,
} from "./jobImageProxyFallback";

function fakeFile(name: string, type: string, size: number): File {
  const buf = new Uint8Array(Math.min(size, 16));
  const file = new File([buf], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function axios413(): { isAxiosError: true; response: { status: 413 } } {
  return { isAxiosError: true, response: { status: 413 } };
}

describe("isHttp413Error / formatJobImageUploadError", () => {
  it("detects axios 413", () => {
    assert.equal(isHttp413Error(axios413()), true);
    assert.equal(isHttp413Error(new Error("nope")), false);
    assert.equal(isHttp413Error({ isAxiosError: true, response: { status: 400 } }), false);
  });

  it("prefers JobImageProxyLimitError then 413 message then fallback", () => {
    assert.equal(
      formatJobImageUploadError(new JobImageProxyLimitError("custom"), "fb"),
      "custom",
    );
    assert.equal(
      formatJobImageUploadError(axios413(), "fb"),
      PROXY_LIMIT_GENERIC_MESSAGE,
    );
    assert.equal(formatJobImageUploadError(new Error("x"), "fallback"), "fallback");
  });

  it("sanitizes network timeouts and internal IP socket errors to user-friendly Thai message", () => {
    assert.equal(isNetworkOrConnectionError("connect ETIMEDOUT 192.168.0.71:9000"), true);
    assert.equal(isNetworkOrConnectionError("ECONNREFUSED 127.0.0.1:4100"), true);
    assert.equal(
      formatJobImageUploadError(new Error("connect ETIMEDOUT 192.168.0.71:9000"), "raw"),
      STORAGE_CONNECTION_ERROR_MESSAGE,
    );
    assert.equal(
      formatJobImageUploadError(new Error("generic"), "connect ETIMEDOUT 192.168.0.71:9000"),
      STORAGE_CONNECTION_ERROR_MESSAGE,
    );
  });
});

describe("runMultipartUploadWithProxyFallback", () => {
  it("uploads original files when under proxy budget", async () => {
    const original = fakeFile("a.jpg", "image/jpeg", 20_000);
    let calls = 0;
    const result = await runMultipartUploadWithProxyFallback({
      fields: [{ name: "images", files: [original] }],
      upload: async (map) => {
        calls += 1;
        assert.equal(map.get("images")?.[0], original);
        return "ok";
      },
    });
    assert.equal(result, "ok");
    assert.equal(calls, 1);
  });

  it("retries once after 413 when files stay under per-file budget", async () => {
    const original = fakeFile("a.jpg", "image/jpeg", 20_000);
    const sizes: number[] = [];
    let calls = 0;
    const result = await runMultipartUploadWithProxyFallback({
      fields: [{ name: "images", files: [original] }],
      onCompressing: () => sizes.push(1),
      upload: async (map) => {
        calls += 1;
        if (calls === 1) throw axios413();
        assert.equal(map.get("images")?.[0], original);
        return "retried";
      },
    });
    assert.equal(result, "retried");
    assert.equal(calls, 2);
    assert.equal(sizes.length, 1);
  });

  it("throws Thai proxy message when retry still 413", async () => {
    const original = fakeFile("a.jpg", "image/jpeg", 20_000);
    await assert.rejects(
      () =>
        runMultipartUploadWithProxyFallback({
          fields: [{ name: "images", files: [original] }],
          upload: async () => {
            throw axios413();
          },
        }),
      (err: unknown) =>
        err instanceof JobImageProxyLimitError &&
        err.message === PROXY_LIMIT_GENERIC_MESSAGE,
    );
  });

  it("rejects oversized HEIC instead of hanging on canvas", async () => {
    const heic = fakeFile("phone.heic", "image/heic", 2 * 1024 * 1024);
    await assert.rejects(
      () =>
        runMultipartUploadWithProxyFallback({
          fields: [{ name: "images", files: [heic] }],
          upload: async () => "should-not-run",
        }),
      (err: unknown) =>
        err instanceof JobImageProxyLimitError &&
        err.message === PROXY_LIMIT_HEIC_MESSAGE,
    );
  });

  it("rethrows non-413 errors", async () => {
    await assert.rejects(
      () =>
        runMultipartUploadWithProxyFallback({
          fields: [{ name: "images", files: [fakeFile("a.jpg", "image/jpeg", 10)] }],
          upload: async () => {
            throw new Error("network");
          },
        }),
      (err: Error) => err.message === "network",
    );
  });
});

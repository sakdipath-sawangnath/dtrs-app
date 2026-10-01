import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getClientApiBaseUrl } from "./clientApiBase";

describe("getClientApiBaseUrl", () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).window;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
    delete (globalThis as Record<string, unknown>).window;
  });

  it("returns configured non-localhost URL without trailing slash", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://dtrs-app.forth.co.th/api/";
    assert.equal(getClientApiBaseUrl(), "https://dtrs-app.forth.co.th/api");
  });

  it("returns localhost default on server when env is empty", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    assert.equal(getClientApiBaseUrl(), "http://localhost:4100/api");
  });

  it("replaces localhost with browser hostname when accessed over LAN", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4100/api";
    (globalThis as unknown as { window: unknown }).window = {
      location: {
        hostname: "192.168.202.53",
      },
    };
    assert.equal(getClientApiBaseUrl(), "http://192.168.202.53:4100/api");
  });

  it("keeps localhost when browser is on localhost", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4100/api";
    (globalThis as unknown as { window: unknown }).window = {
      location: {
        hostname: "localhost",
      },
    };
    assert.equal(getClientApiBaseUrl(), "http://localhost:4100/api");
  });

  it("derives API from window.location when env is empty and in browser", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    (globalThis as unknown as { window: unknown }).window = {
      location: {
        hostname: "192.168.202.53",
      },
    };
    assert.equal(getClientApiBaseUrl(), "http://192.168.202.53:4100/api");
  });
});

/**
 * Unit tests: client-side job image validation + proxy-size helpers
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  compressJobImageFieldFiles,
  compressJobImageToJpeg,
  isHeicLike,
  MAX_JOB_IMAGE_BYTES,
  PROXY_SAFE_TOTAL_BYTES,
  shouldProactivelyCompressForProxy,
  validateJobImageFile,
} from "./jobImageUpload";

function fakeFile(
  name: string,
  type: string,
  size: number,
): File {
  const buf = new Uint8Array(Math.min(size, 16));
  const file = new File([buf], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateJobImageFile", () => {
  it("accepts jpeg/png/webp/heic under 5MB", () => {
    assert.equal(
      validateJobImageFile(fakeFile("a.jpg", "image/jpeg", 1024)),
      null,
    );
    assert.equal(
      validateJobImageFile(fakeFile("a.png", "image/png", 1024)),
      null,
    );
    assert.equal(
      validateJobImageFile(fakeFile("a.webp", "image/webp", 1024)),
      null,
    );
    assert.equal(
      validateJobImageFile(fakeFile("a.heic", "image/heic", 1024)),
      null,
    );
  });

  it("rejects oversize", () => {
    assert.equal(
      validateJobImageFile(
        fakeFile("big.jpg", "image/jpeg", MAX_JOB_IMAGE_BYTES + 1),
      ),
      "ไฟล์รูปใหญ่เกิน 5MB",
    );
  });

  it("rejects gif and unknown extension without mime", () => {
    assert.match(
      validateJobImageFile(fakeFile("a.gif", "image/gif", 100)) ?? "",
      /JPG, PNG, WebP หรือ HEIC/,
    );
    assert.match(
      validateJobImageFile(fakeFile("a.bin", "", 100)) ?? "",
      /JPG, PNG, WebP หรือ HEIC/,
    );
  });

  it("accepts heic by extension when mime is empty", () => {
    assert.equal(validateJobImageFile(fakeFile("photo.HEIC", "", 2000)), null);
  });
});

describe("isHeicLike / shouldProactivelyCompressForProxy", () => {
  it("detects heic by mime and extension", () => {
    assert.equal(isHeicLike(fakeFile("a.heic", "image/heic", 10)), true);
    assert.equal(isHeicLike(fakeFile("a.heif", "", 10)), true);
    assert.equal(isHeicLike(fakeFile("a.jpg", "image/jpeg", 10)), false);
  });

  it("flags total size near nginx 1MB default", () => {
    assert.equal(shouldProactivelyCompressForProxy([]), false);
    assert.equal(
      shouldProactivelyCompressForProxy([
        fakeFile("a.jpg", "image/jpeg", 100_000),
      ]),
      false,
    );
    assert.equal(
      shouldProactivelyCompressForProxy([
        fakeFile("a.jpg", "image/jpeg", PROXY_SAFE_TOTAL_BYTES),
      ]),
      true,
    );
  });
});

describe("compressJobImageFieldFiles", () => {
  it("passes through files already under budget", async () => {
    const f = fakeFile("a.jpg", "image/jpeg", 50_000);
    const out = await compressJobImageFieldFiles([f], 100_000);
    assert.equal(out[0], f);
  });

  it("passes small HEIC but rejects HEIC over budget", async () => {
    const small = fakeFile("a.heic", "image/heic", 10_000);
    const big = fakeFile("b.heic", "image/heic", 400_000);
    const kept = await compressJobImageFieldFiles([small], 100_000);
    assert.equal(kept[0], small);
    await assert.rejects(
      () => compressJobImageFieldFiles([big], 100_000),
      (err: Error) => err.message === "HEIC_TOO_LARGE_FOR_PROXY",
    );
  });

  it("throws in Node when jpeg needs canvas compress", async () => {
    const big = fakeFile("a.jpg", "image/jpeg", 400_000);
    await assert.rejects(
      () => compressJobImageToJpeg(big, 1000),
      (err: Error) =>
        err.message === "COMPRESS_REQUIRES_BROWSER" ||
        err.message === "HEIC_CANNOT_COMPRESS_IN_BROWSER",
    );
  });
});

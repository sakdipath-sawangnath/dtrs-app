import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isSafePerformanceEntry,
  filterSafePerformanceEntries,
} from "./safePerformance";

describe("isSafePerformanceEntry", () => {
  it("returns true for valid PerformanceEntry-like objects with numerical startTime", () => {
    assert.equal(isSafePerformanceEntry({ startTime: 123.45 }), true);
    assert.equal(isSafePerformanceEntry({ startTime: 0 }), true);
    assert.equal(isSafePerformanceEntry({ name: "paint", startTime: 450.2, duration: 10 }), true);
  });

  it("returns false for undefined, null, or non-object values", () => {
    assert.equal(isSafePerformanceEntry(undefined), false);
    assert.equal(isSafePerformanceEntry(null), false);
    assert.equal(isSafePerformanceEntry("not an object"), false);
    assert.equal(isSafePerformanceEntry(123), false);
  });

  it("returns false when startTime is missing, undefined, NaN, or non-number", () => {
    assert.equal(isSafePerformanceEntry({}), false);
    assert.equal(isSafePerformanceEntry({ startTime: undefined }), false);
    assert.equal(isSafePerformanceEntry({ startTime: null }), false);
    assert.equal(isSafePerformanceEntry({ startTime: NaN }), false);
    assert.equal(isSafePerformanceEntry({ startTime: "123" }), false);
  });
});

describe("filterSafePerformanceEntries", () => {
  it("filters out undefined, null, and entries without numeric startTime", () => {
    const raw = [
      { name: "good-1", startTime: 10 },
      undefined,
      null,
      { name: "bad-no-time" },
      { name: "bad-nan-time", startTime: NaN },
      { name: "good-2", startTime: 25.5 },
    ];
    const filtered = filterSafePerformanceEntries(raw);
    assert.equal(filtered.length, 2);
    assert.equal(filtered[0].startTime, 10);
    assert.equal(filtered[1].startTime, 25.5);
  });

  it("handles non-array or empty inputs gracefully", () => {
    assert.deepEqual(filterSafePerformanceEntries(null), []);
    assert.deepEqual(filterSafePerformanceEntries(undefined), []);
    assert.deepEqual(filterSafePerformanceEntries([]), []);
    assert.deepEqual(filterSafePerformanceEntries("invalid" as unknown as unknown[]), []);
  });
});

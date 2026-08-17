/**
 * Unit tests: fix-info completeness + awaiting reporter signature badge
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAwaitingReporterSignature,
  isFixInfoComplete,
} from "./jobFixImageSlots";

const completeFix = {
  fixEnvironment: "INDOOR",
  brokenPart: "Hardware",
  cause: "สายขาด",
  fixMethod: "เปลี่ยนสาย",
  fixImages: ["a.jpg", "b.jpg"],
};

describe("isFixInfoComplete", () => {
  it("requires environment, part type, cause, method, and 2 images", () => {
    assert.equal(isFixInfoComplete(completeFix), true);
    assert.equal(isFixInfoComplete({ ...completeFix, cause: "  " }), false);
    assert.equal(
      isFixInfoComplete({ ...completeFix, fixImages: ["a.jpg"] }),
      false,
    );
    assert.equal(
      isFixInfoComplete({ ...completeFix, fixEnvironment: "INSIDE" }),
      false,
    );
  });
});

describe("isAwaitingReporterSignature", () => {
  it("is true only for IN_PROGRESS with complete fix info", () => {
    assert.equal(
      isAwaitingReporterSignature({ status: "IN_PROGRESS", ...completeFix }),
      true,
    );
    assert.equal(
      isAwaitingReporterSignature({ status: "PENDING", ...completeFix }),
      false,
    );
    assert.equal(
      isAwaitingReporterSignature({ status: "RESOLVED", ...completeFix }),
      false,
    );
    assert.equal(
      isAwaitingReporterSignature({
        status: "IN_PROGRESS",
        ...completeFix,
        cause: "",
      }),
      false,
    );
  });
});

/**
 * Unit: strip Reopen audit from fixNote for PDF
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stripReopenAuditFromFixNote } from "./stripReopenAuditFromFixNote";

describe("stripReopenAuditFromFixNote", () => {
  it("returns empty for null/undefined/blank", () => {
    assert.equal(stripReopenAuditFromFixNote(null), "");
    assert.equal(stripReopenAuditFromFixNote(undefined), "");
    assert.equal(stripReopenAuditFromFixNote("   "), "");
  });

  it("keeps normal notes unchanged", () => {
    assert.equal(
      stripReopenAuditFromFixNote("หมายเหตุการแก้ไข123"),
      "หมายเหตุการแก้ไข123",
    );
  });

  it("removes Reopen audit lines but keeps prior note", () => {
    const input = [
      "หมายเหตุการแก้ไข123",
      "[Reopen 4/9/2569 10:18:34] test",
    ].join("\n");
    assert.equal(stripReopenAuditFromFixNote(input), "หมายเหตุการแก้ไข123");
  });

  it("removes mid-line Reopen audit and trailing reason", () => {
    assert.equal(
      stripReopenAuditFromFixNote("123 [Reopen 4/9/2569 10:18:34] test"),
      "123",
    );
  });

  it("removes multiple Reopen segments", () => {
    const input = [
      "note A",
      "[Reopen 1/1/2569 09:00:00] first",
      "note B [Reopen 2/1/2569 10:00:00] second",
    ].join("\n");
    assert.equal(stripReopenAuditFromFixNote(input), "note A\nnote B");
  });

  it("does not strip cancel audit lines", () => {
    const input = "x\n[ยกเลิก 4/9/2569 10:00:00] reason";
    assert.equal(stripReopenAuditFromFixNote(input), input);
  });
});

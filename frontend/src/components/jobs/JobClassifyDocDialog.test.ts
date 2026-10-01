import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CLASSIFY_CHOICES,
  classifyDocConfirmLabel,
  classifyDocPreview,
  classifyNextRadioIndex,
} from "./JobClassifyDocDialog";

describe("JobClassifyDocDialog helpers", () => {
  describe("classifyDocPreview", () => {
    it("generates correct in-contract preview format", () => {
      assert.equal(classifyDocPreview("in", 2026), "จะได้เลขรูปแบบ CM-SHF-2026-XXXX");
    });

    it("generates correct out-of-contract preview format", () => {
      assert.equal(classifyDocPreview("ooc", 2026), "จะได้เลขรูปแบบ OOC-2026-XXXX");
    });
  });

  describe("classifyDocConfirmLabel", () => {
    it("shows specific commitment label for in-contract", () => {
      assert.equal(classifyDocConfirmLabel("in"), "ออกเลขเอกสาร (ในสัญญา)");
    });

    it("shows specific commitment label for out-of-contract", () => {
      assert.equal(classifyDocConfirmLabel("ooc"), "ออกเลขเอกสาร (นอกสัญญา)");
    });

    it("shows generic label when no choice is selected", () => {
      assert.equal(classifyDocConfirmLabel(null), "ออกเลขเอกสาร");
    });
  });

  describe("classifyNextRadioIndex (Keyboard roving tabindex)", () => {
    it("moves forward on ArrowRight and ArrowDown", () => {
      assert.equal(classifyNextRadioIndex(0, 2, "ArrowRight"), 1);
      assert.equal(classifyNextRadioIndex(0, 2, "ArrowDown"), 1);
    });

    it("wraps around to the first option when reaching the end", () => {
      assert.equal(classifyNextRadioIndex(1, 2, "ArrowRight"), 0);
      assert.equal(classifyNextRadioIndex(1, 2, "ArrowDown"), 0);
    });

    it("moves backward on ArrowLeft and ArrowUp", () => {
      assert.equal(classifyNextRadioIndex(1, 2, "ArrowLeft"), 0);
      assert.equal(classifyNextRadioIndex(1, 2, "ArrowUp"), 0);
    });

    it("wraps around to the last option when moving before index 0", () => {
      assert.equal(classifyNextRadioIndex(0, 2, "ArrowLeft"), 1);
      assert.equal(classifyNextRadioIndex(0, 2, "ArrowUp"), 1);
    });

    it("jumps to the first option on Home key", () => {
      assert.equal(classifyNextRadioIndex(1, 2, "Home"), 0);
      assert.equal(classifyNextRadioIndex(0, 2, "Home"), 0);
    });

    it("jumps to the last option on End key", () => {
      assert.equal(classifyNextRadioIndex(0, 2, "End"), 1);
      assert.equal(classifyNextRadioIndex(1, 2, "End"), 1);
    });

    it("retains current index for unhandled keys", () => {
      assert.equal(classifyNextRadioIndex(1, 2, "Tab"), 1);
      assert.equal(classifyNextRadioIndex(0, 2, "Escape"), 0);
    });

    it("handles 0 or 1 item gracefully", () => {
      assert.equal(classifyNextRadioIndex(0, 0, "ArrowRight"), 0);
      assert.equal(classifyNextRadioIndex(0, 1, "ArrowRight"), 0);
    });
  });

  describe("CLASSIFY_CHOICES contract definitions", () => {
    it("contains two distinct mutually exclusive options", () => {
      assert.equal(CLASSIFY_CHOICES.length, 2);
      assert.equal(CLASSIFY_CHOICES[0].kind, "in");
      assert.equal(CLASSIFY_CHOICES[0].title, "ในสัญญา");
      assert.equal(CLASSIFY_CHOICES[1].kind, "ooc");
      assert.equal(CLASSIFY_CHOICES[1].title, "นอกสัญญา");
    });
  });
});

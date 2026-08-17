/**
 * Unit tests: ข้อความหัวรายงาน CM (SHF) ตามเทมเพลต CM.pdf
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  REPORT_LOGO_FORTH,
  REPORT_LOGO_NBTC,
  REPORT_PDF_HEADER,
} from "./reportPdfConstants";

describe("REPORT_PDF_HEADER (CM/SHF)", () => {
  it("uses SHF contract copy from CM.pdf", () => {
    assert.equal(
      REPORT_PDF_HEADER.line1,
      "การจัดซื้ออุปกรณ์พร้อมดำเนินการติดตั้ง",
    );
    assert.match(REPORT_PDF_HEADER.line2, /SHF/);
    assert.equal(
      REPORT_PDF_HEADER.line3,
      "เพื่อสนับสนุนการปฏิบัติราชการและแก้ไขปัญหาให้กับประชาชนพื้นที่ห่างไกล",
    );
    assert.equal(REPORT_PDF_HEADER.contractNo, "8680228");
    assert.equal(REPORT_PDF_HEADER.contractDate, "23 กรกฎาคม 2568");
    assert.equal(
      REPORT_PDF_HEADER.title,
      "รายงานการซ่อมแซมแก้ไขข้อขัดข้อง",
    );
  });

  it("uses CM captions with space after the number", () => {
    assert.equal(REPORT_PDF_HEADER.imageCaptionIssue, "1. รูปภาพข้อขัดข้อง");
    assert.equal(REPORT_PDF_HEADER.imageCaptionFix, "2. รูปภาพการแก้ไข");
    assert.equal(REPORT_PDF_HEADER.imagesHeading, "รูปภาพประกอบ");
    assert.equal(REPORT_PDF_HEADER.detailsHeading, "รายละเอียดการซ่อมแซม");
  });
});

describe("report logo assets", () => {
  it("points at public NBTC and FORTH files that exist", () => {
    assert.equal(REPORT_LOGO_NBTC, "/logo/NBTC.png");
    assert.equal(REPORT_LOGO_FORTH, "/logo/logo-FORTH.png");
    const publicDir = join(__dirname, "..", "..", "public");
    assert.equal(existsSync(join(publicDir, "logo", "NBTC.png")), true);
    assert.equal(existsSync(join(publicDir, "logo", "logo-FORTH.png")), true);
  });
});

/**
 * Unit tests: formal Doc No vs hex ticketNo
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatOocDocTicketNo,
  formatRequestOocTicketNo,
  formatRequestTicketNo,
  isAnyRequestTicketNo,
  isClassifiedOutOfContractResolved,
  isFormalDocTicketNo,
  isRequestOocTicketNo,
  isRequestTicketNo,
} from "./docTicketNo";

describe("isFormalDocTicketNo", () => {
  it("rejects hex, RQ-CM, and empty", () => {
    assert.equal(isFormalDocTicketNo("29c75819"), false);
    assert.equal(isFormalDocTicketNo("12345678"), false);
    assert.equal(isFormalDocTicketNo(""), false);
    assert.equal(isFormalDocTicketNo(null), false);
    assert.equal(isFormalDocTicketNo("RQ-CM-20260001"), false);
    assert.equal(isFormalDocTicketNo("RQ-OOC-20260001"), false);
  });

  it("accepts in-contract and out-of-contract running numbers", () => {
    assert.equal(isFormalDocTicketNo("CM-SHF-2026-0001"), true);
    assert.equal(isFormalDocTicketNo("CM-SHF-2002-0001"), true);
    assert.equal(isFormalDocTicketNo("CM-SHF-2026-10000"), true);
    assert.equal(isFormalDocTicketNo("OOC-2026-0001"), true);
    assert.equal(isFormalDocTicketNo("2026080001"), true);
  });
});

describe("formatRequestTicketNo", () => {
  it("formats RQ-CM-YYYYXXXX with 4-digit padding", () => {
    assert.equal(formatRequestTicketNo({ year: "2026", running: 1 }), "RQ-CM-20260001");
    assert.equal(formatRequestTicketNo({ year: "2026", running: 42 }), "RQ-CM-20260042");
    assert.equal(formatRequestTicketNo({ year: "2026", running: 9999 }), "RQ-CM-20269999");
  });

  it("grows past 4 digits for large running numbers", () => {
    assert.equal(formatRequestTicketNo({ year: "2026", running: 10000 }), "RQ-CM-202610000");
  });

  it("rejects invalid year or running", () => {
    assert.throws(() => formatRequestTicketNo({ year: "26", running: 1 }), RangeError);
    assert.throws(() => formatRequestTicketNo({ year: "2026", running: 0 }), RangeError);
  });
});

describe("isRequestTicketNo", () => {
  it("identifies RQ-CM-YYYYXXXX format", () => {
    assert.equal(isRequestTicketNo("RQ-CM-20260001"), true);
    assert.equal(isRequestTicketNo("RQ-CM-20269999"), true);
    assert.equal(isRequestTicketNo("RQ-CM-202610000"), true);
  });

  it("rejects formal doc numbers, hex, and invalid values", () => {
    assert.equal(isRequestTicketNo("CM-SHF-2026-0001"), false);
    assert.equal(isRequestTicketNo("2026080001"), false);
    assert.equal(isRequestTicketNo("9530f95f"), false);
    assert.equal(isRequestTicketNo(""), false);
    assert.equal(isRequestTicketNo(null), false);
  });
});

describe("formatRequestOocTicketNo", () => {
  it("formats RQ-OOC-YYYYXXXX with 4-digit padding", () => {
    assert.equal(formatRequestOocTicketNo({ year: "2026", running: 1 }), "RQ-OOC-20260001");
    assert.equal(formatRequestOocTicketNo({ year: "2026", running: 42 }), "RQ-OOC-20260042");
  });
});

describe("isRequestOocTicketNo", () => {
  it("identifies RQ-OOC-YYYYXXXX format", () => {
    assert.equal(isRequestOocTicketNo("RQ-OOC-20260001"), true);
    assert.equal(isRequestOocTicketNo("RQ-CM-20260001"), false);
  });
});

describe("isAnyRequestTicketNo", () => {
  it("identifies either in-contract or out-of-contract request tickets", () => {
    assert.equal(isAnyRequestTicketNo("RQ-CM-20260001"), true);
    assert.equal(isAnyRequestTicketNo("RQ-OOC-20260001"), true);
    assert.equal(isAnyRequestTicketNo("CM-SHF-2026-0001"), false);
  });
});

describe("formatOocDocTicketNo", () => {
  it("formats OOC-YYYY-XXXX with 4-digit padding", () => {
    assert.equal(formatOocDocTicketNo({ year: "2026", running: 1 }), "OOC-2026-0001");
    assert.equal(formatOocDocTicketNo({ year: "2026", running: 99 }), "OOC-2026-0099");
  });
});

describe("isClassifiedOutOfContractResolved", () => {
  it("is true only for RESOLVED OOC with formal doc", () => {
    assert.equal(
      isClassifiedOutOfContractResolved({
        status: "RESOLVED",
        isOutOfContract: true,
        ticketNo: "2026080001",
      }),
      true,
    );
    assert.equal(
      isClassifiedOutOfContractResolved({
        status: "RESOLVED",
        isOutOfContract: true,
        ticketNo: "29c75819",
      }),
      false,
    );
    assert.equal(
      isClassifiedOutOfContractResolved({
        status: "PENDING",
        isOutOfContract: true,
        ticketNo: "2026080001",
      }),
      false,
    );
  });
});

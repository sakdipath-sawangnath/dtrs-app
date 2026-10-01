/**
 * Unit tests: formal Doc No vs hex ticketNo
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatRequestTicketNo,
  isClassifiedOutOfContractResolved,
  isFormalDocTicketNo,
  isRequestTicketNo,
} from "./docTicketNo";

describe("isFormalDocTicketNo", () => {
  it("rejects hex, RQ-CM, and empty", () => {
    assert.equal(isFormalDocTicketNo("29c75819"), false);
    assert.equal(isFormalDocTicketNo("12345678"), false);
    assert.equal(isFormalDocTicketNo(""), false);
    assert.equal(isFormalDocTicketNo(null), false);
    assert.equal(isFormalDocTicketNo("RQ-CM-20260001"), false);
  });

  it("accepts in-contract and out-of-contract running numbers", () => {
    assert.equal(isFormalDocTicketNo("CM-SHF-2026-0001"), true);
    assert.equal(isFormalDocTicketNo("CM-SHF-2002-0001"), true);
    assert.equal(isFormalDocTicketNo("CM-SHF-2026-10000"), true);
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

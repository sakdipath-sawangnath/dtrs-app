/**
 * Unit tests: formal Doc No vs hex ticketNo
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isClassifiedOutOfContractResolved,
  isFormalDocTicketNo,
} from "./docTicketNo";

describe("isFormalDocTicketNo", () => {
  it("rejects hex and empty", () => {
    assert.equal(isFormalDocTicketNo("29c75819"), false);
    assert.equal(isFormalDocTicketNo("12345678"), false);
    assert.equal(isFormalDocTicketNo(""), false);
    assert.equal(isFormalDocTicketNo(null), false);
  });

  it("accepts in-contract and out-of-contract running numbers", () => {
    assert.equal(isFormalDocTicketNo("CM-SHF-2002-0001"), true);
    assert.equal(isFormalDocTicketNo("CM-SHF-2002-10000"), true);
    assert.equal(isFormalDocTicketNo("2026080001"), true);
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

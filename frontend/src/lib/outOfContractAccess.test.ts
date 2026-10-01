import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MENU_OUT_OF_CONTRACT_PERMISSION,
  resolveOutOfContractAccess,
} from "./outOfContractAccess";

describe("resolveOutOfContractAccess", () => {
  it("denies regular USER with null permissions", () => {
    const res = resolveOutOfContractAccess({ permissions: null, userRole: "USER" });
    assert.equal(res.ready, false);
    assert.equal(res.canAccess, false);
  });

  it("denies regular USER when permissions list lacks menu.outOfContract", () => {
    const res = resolveOutOfContractAccess({
      permissions: ["menu.profile", "menu.report", "menu.status"],
      userRole: "USER",
    });
    assert.equal(res.ready, true);
    assert.equal(res.canAccess, false);
  });

  it("optimistically allows built-in ADMIN while permissions load", () => {
    const res = resolveOutOfContractAccess({ permissions: null, userRole: "ADMIN" });
    assert.equal(res.ready, false);
    assert.equal(res.canAccess, true);
  });

  it("optimistically allows built-in STAFF while permissions load", () => {
    const res = resolveOutOfContractAccess({ permissions: null, userRole: "STAFF" });
    assert.equal(res.ready, false);
    assert.equal(res.canAccess, true);
  });

  it("optimistically allows built-in SUPERVISOR while permissions load", () => {
    const res = resolveOutOfContractAccess({ permissions: null, userRole: "SUPERVISOR" });
    assert.equal(res.ready, false);
    assert.equal(res.canAccess, true);
  });

  it("allows custom role (e.g. STAFF_1) when role has menu.outOfContract in /roles", () => {
    const res = resolveOutOfContractAccess({
      permissions: [MENU_OUT_OF_CONTRACT_PERMISSION, "job.assign"],
      userRole: "STAFF_1",
    });
    assert.equal(res.ready, true);
    assert.equal(res.canAccess, true);
  });

  it("denies custom role when role lacks menu.outOfContract in /roles", () => {
    const res = resolveOutOfContractAccess({
      permissions: ["job.assign"],
      userRole: "STAFF_1",
    });
    assert.equal(res.ready, true);
    assert.equal(res.canAccess, false);
  });

  it("handles case-insensitive roles correctly", () => {
    const res = resolveOutOfContractAccess({ permissions: null, userRole: "staff" });
    assert.equal(res.canAccess, true);
  });
});

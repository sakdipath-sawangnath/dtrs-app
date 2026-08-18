/**
 * Unit tests: profile dropdown Role label (e.g. Role: Admin)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRoleLabel } from "./formatRoleLabel";

describe("formatRoleLabel", () => {
  it("formats built-in role codes as Title Case", () => {
    assert.equal(formatRoleLabel("ADMIN"), "Admin");
    assert.equal(formatRoleLabel("STAFF"), "Staff");
    assert.equal(formatRoleLabel("SUPERVISOR"), "Supervisor");
    assert.equal(formatRoleLabel("USER"), "User");
  });

  it("formats custom AppRole codes with separators", () => {
    assert.equal(formatRoleLabel("SITE_MANAGER"), "Site Manager");
    assert.equal(formatRoleLabel("admin-ops"), "Admin Ops");
    assert.equal(formatRoleLabel("field staff"), "Field Staff");
  });

  it("trims and title-cases mixed input", () => {
    assert.equal(formatRoleLabel("  admin  "), "Admin");
    assert.equal(formatRoleLabel("Admin"), "Admin");
  });

  it("returns empty string when role is missing", () => {
    assert.equal(formatRoleLabel(""), "");
    assert.equal(formatRoleLabel("   "), "");
    assert.equal(formatRoleLabel(null), "");
    assert.equal(formatRoleLabel(undefined), "");
  });
});

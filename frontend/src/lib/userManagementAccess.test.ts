/**
 * Unit tests: /dashboard/users access for custom roles (e.g. ADMIN_1)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mergeUserRoleOptions,
  resolveUserManagementAccess,
  usersManagementSubtitle,
} from "./userManagementAccess";

const BUILTIN = [
  { value: "ADMIN", label: "ผู้ดูแลระบบ" },
  { value: "STAFF", label: "ช่างเทคนิค" },
  { value: "SUPERVISOR", label: "หัวหน้างาน" },
  { value: "USER", label: "ผู้แจ้งซ่อม" },
];

describe("resolveUserManagementAccess", () => {
  it("lets ADMIN_1 manage when menu.users is in the permission list", () => {
    const access = resolveUserManagementAccess({
      permissions: ["menu.users", "menu.roles", "menu.dashboard"],
      userRole: "ADMIN_1",
    });
    assert.equal(access.ready, true);
    assert.equal(access.canManage, true);
    assert.equal(
      usersManagementSubtitle(access).includes("ดูอย่างเดียว"),
      false,
    );
  });

  it("does not treat ADMIN_1 as view-only while permissions are still loading", () => {
    const access = resolveUserManagementAccess({
      permissions: null,
      userRole: "ADMIN_1",
    });
    assert.equal(access.ready, false);
    assert.equal(access.canManage, false);
    assert.equal(usersManagementSubtitle(access), "รายชื่อผู้ใช้และบทบาท");
  });

  it("shows view-only when ADMIN_1 loaded without menu.users", () => {
    const access = resolveUserManagementAccess({
      permissions: ["menu.dashboard", "menu.pending"],
      userRole: "ADMIN_1",
    });
    assert.equal(access.ready, true);
    assert.equal(access.canManage, false);
    assert.equal(
      usersManagementSubtitle(access),
      "รายชื่อผู้ใช้และบทบาท (ดูอย่างเดียว)",
    );
  });

  it("lets STAFF manage when they have menu.users (permission, not role code)", () => {
    const access = resolveUserManagementAccess({
      permissions: ["menu.users"],
      userRole: "STAFF",
    });
    assert.equal(access.canManage, true);
  });

  it("falls back to ADMIN when permission list is empty", () => {
    assert.equal(
      resolveUserManagementAccess({ permissions: [], userRole: "ADMIN" }).canManage,
      true,
    );
    assert.equal(
      resolveUserManagementAccess({ permissions: [], userRole: "ADMIN_1" }).canManage,
      false,
    );
  });

  it("uses permission list over JWT role when ADMIN lacks menu.users", () => {
    const access = resolveUserManagementAccess({
      permissions: ["menu.dashboard"],
      userRole: "ADMIN",
    });
    assert.equal(access.canManage, false);
  });

  it("optimistically allows built-in ADMIN while permissions load", () => {
    const access = resolveUserManagementAccess({
      permissions: null,
      userRole: "ADMIN",
    });
    assert.equal(access.ready, false);
    assert.equal(access.canManage, true);
  });
});

describe("mergeUserRoleOptions", () => {
  it("includes custom AppRole codes from public-styles without GET /roles", () => {
    const options = mergeUserRoleOptions(BUILTIN, [
      { code: "ADMIN_1", name: "Admin 1" },
      { code: "STAFF", name: "ช่างเทคนิค" },
    ]);
    const byValue = Object.fromEntries(options.map((o) => [o.value, o.label]));
    assert.equal(byValue.ADMIN_1, "Admin 1");
    assert.equal(byValue.ADMIN, "ผู้ดูแลระบบ");
    assert.equal(byValue.STAFF, "ช่างเทคนิค");
  });

  it("falls back to code when catalog name is blank", () => {
    const options = mergeUserRoleOptions(BUILTIN, [{ code: "ops-lead", name: "  " }]);
    const found = options.find((o) => o.value === "OPS-LEAD");
    assert.equal(found?.label, "OPS-LEAD");
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  can,
  assertCan,
  PERMISSIONS,
  BACKEND_PERMISSIONS,
  ForbiddenError,
  type SessionUser,
} from './permissions';

describe('Permissions module - can() & assertCan()', () => {
  it('returns false for unauthenticated / null / undefined user', () => {
    assert.equal(can(null, PERMISSIONS.OOC_VIEW), false);
    assert.equal(can(undefined, PERMISSIONS.OOC_VIEW), false);
    assert.equal(can(null, PERMISSIONS.OOC_EXPORT), false);
    assert.equal(can(undefined, PERMISSIONS.OOC_CLASSIFY), false);
  });

  it('denies regular USER regardless of permissions array or role', () => {
    const userRoleUser: SessionUser = {
      id: '1',
      name: 'General User',
      role: 'USER',
      permissions: ['menu.profile', 'menu.report', 'menu.status'],
    };
    assert.equal(can(userRoleUser, PERMISSIONS.OOC_VIEW), false);
    assert.equal(can(userRoleUser, PERMISSIONS.OOC_EXPORT), false);
    assert.equal(can(userRoleUser, PERMISSIONS.OOC_CLASSIFY), false);

    assert.throws(
      () => assertCan(userRoleUser, PERMISSIONS.OOC_VIEW),
      ForbiddenError,
    );
  });

  it('allows built-in ADMIN for all OOC operations', () => {
    const adminUser: SessionUser = {
      id: '2',
      name: 'System Admin',
      role: 'ADMIN',
      permissions: null,
    };
    assert.equal(can(adminUser, PERMISSIONS.OOC_VIEW), true);
    assert.equal(can(adminUser, PERMISSIONS.OOC_EXPORT), true);
    assert.equal(can(adminUser, PERMISSIONS.OOC_CLASSIFY), true);

    assert.doesNotThrow(() => assertCan(adminUser, PERMISSIONS.OOC_VIEW));
  });

  it('allows built-in STAFF for OOC_VIEW and OOC_EXPORT', () => {
    const staffUser: SessionUser = {
      id: '3',
      name: 'Staff Technician',
      role: 'STAFF',
      permissions: null,
    };
    assert.equal(can(staffUser, PERMISSIONS.OOC_VIEW), true);
    assert.equal(can(staffUser, PERMISSIONS.OOC_EXPORT), true);
  });

  it('allows built-in SUPERVISOR for OOC_VIEW, OOC_EXPORT, and OOC_CLASSIFY', () => {
    const supUser: SessionUser = {
      id: '4',
      name: 'Supervisor',
      role: 'SUPERVISOR',
      permissions: null,
    };
    assert.equal(can(supUser, PERMISSIONS.OOC_VIEW), true);
    assert.equal(can(supUser, PERMISSIONS.OOC_EXPORT), true);
    assert.equal(can(supUser, PERMISSIONS.OOC_CLASSIFY), true);
  });

  it('allows custom role when permission code is in permissions list', () => {
    const customAllowed: SessionUser = {
      id: '5',
      name: 'Custom Staff 1',
      role: 'STAFF_SPECIAL',
      permissions: [BACKEND_PERMISSIONS.MENU_OUT_OF_CONTRACT],
    };
    assert.equal(can(customAllowed, PERMISSIONS.OOC_VIEW), true);
    assert.equal(can(customAllowed, PERMISSIONS.OOC_EXPORT), false);
  });

  it('denies custom role when permission code is absent from permissions list', () => {
    const customDenied: SessionUser = {
      id: '6',
      name: 'Custom Staff 2',
      role: 'STAFF_RESTRICTED',
      permissions: ['job.assign'],
    };
    assert.equal(can(customDenied, PERMISSIONS.OOC_VIEW), false);
    assert.equal(can(customDenied, PERMISSIONS.OOC_EXPORT), false);
    assert.equal(can(customDenied, PERMISSIONS.OOC_CLASSIFY), false);

    assert.throws(
      () => assertCan(customDenied, PERMISSIONS.OOC_VIEW),
      ForbiddenError,
    );
  });

  it('handles case-insensitive roles correctly', () => {
    const lowerStaff: SessionUser = {
      id: '7',
      name: 'Staff Lower',
      role: 'staff',
      permissions: null,
    };
    assert.equal(can(lowerStaff, PERMISSIONS.OOC_VIEW), true);
  });
});

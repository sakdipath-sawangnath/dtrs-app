import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeStepMenu } from './navMenu';
import { BACKEND_PERMISSIONS } from './permissions';

describe('Navigation Step Menu - OOC Conditional Emission', () => {
  it('does NOT emit OOC link for unauthenticated / anonymous visitors', () => {
    const menu = computeStepMenu(false, null);
    const json = JSON.stringify(menu);

    assert.equal(menu.some((item) => item.href.includes('report-ooc')), false);
    assert.equal(json.includes('report-ooc'), false);
    assert.equal(json.includes('งานนอกสัญญา'), false);
    assert.equal(menu.length, 2);
  });

  it('does NOT emit OOC link for authenticated USER role', () => {
    const userSession = {
      id: '1',
      name: 'Regular Customer',
      role: 'USER',
      permissions: ['menu.profile', 'menu.report', 'menu.status'],
    };
    const menu = computeStepMenu(true, userSession);
    const json = JSON.stringify(menu);

    assert.equal(menu.some((item) => item.href.includes('report-ooc')), false);
    assert.equal(json.includes('report-ooc'), false);
    assert.equal(json.includes('งานนอกสัญญา'), false);
    assert.equal(menu.length, 3);
  });

  it('does NOT emit OOC link for custom role lacking menu.outOfContract', () => {
    const customSession = {
      id: '2',
      name: 'Restricted Staff',
      role: 'CUSTOM_RESTRICTED',
      permissions: ['menu.dashboard', 'menu.report'],
    };
    const menu = computeStepMenu(true, customSession);
    const json = JSON.stringify(menu);

    assert.equal(menu.some((item) => item.href.includes('report-ooc')), false);
    assert.equal(json.includes('report-ooc'), false);
    assert.equal(json.includes('งานนอกสัญญา'), false);
  });

  it('EMITS OOC link for authorized STAFF', () => {
    const staffSession = {
      id: '3',
      name: 'Staff Technician',
      role: 'STAFF',
      permissions: null,
    };
    const menu = computeStepMenu(true, staffSession);

    assert.equal(menu.some((item) => item.href === '/public/report-ooc'), true);
    assert.equal(menu.some((item) => item.label === 'งานนอกสัญญา'), true);
    assert.equal(menu.length, 4);
  });

  it('EMITS OOC link for authorized ADMIN', () => {
    const adminSession = {
      id: '4',
      name: 'Admin User',
      role: 'ADMIN',
      permissions: null,
    };
    const menu = computeStepMenu(true, adminSession);

    assert.equal(menu.some((item) => item.href === '/public/report-ooc'), true);
    assert.equal(menu.some((item) => item.label === 'งานนอกสัญญา'), true);
    assert.equal(menu.length, 4);
  });

  it('EMITS OOC link for custom role with menu.outOfContract in permissions', () => {
    const customAllowed = {
      id: '5',
      name: 'Custom Contractor',
      role: 'CONTRACTOR_LEAD',
      permissions: [BACKEND_PERMISSIONS.MENU_OUT_OF_CONTRACT],
    };
    const menu = computeStepMenu(true, customAllowed);

    assert.equal(menu.some((item) => item.href === '/public/report-ooc'), true);
    assert.equal(menu.some((item) => item.label === 'งานนอกสัญญา'), true);
  });
});

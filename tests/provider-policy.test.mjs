import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReferralEligibility, isProviderSessionFor } from '../provider-policy.mjs';

const completeProfile = {
  coverage: { locations: [{ id: 'area-b', name: 'Birmingham' }] },
  services: ['Visiting/home care'],
  careNeeds: ['Dementia'],
  availability: { acceptingReferrals: true, capacity: 1 },
};

test('only active, verified providers with complete coverage, capabilities, and capacity become eligible', () => {
  assert.equal(calculateReferralEligibility('active', 'verified', completeProfile), 'eligible');
  assert.equal(calculateReferralEligibility('pending', 'verified', completeProfile), 'temporarily_ineligible');
  assert.equal(calculateReferralEligibility('active', 'pending_review', completeProfile), 'temporarily_ineligible');
  assert.equal(calculateReferralEligibility('suspended', 'verified', completeProfile), 'ineligible');
});

test('expired insurance and rejected evidence restrict referrals; pending evidence pauses them', () => {
  assert.equal(calculateReferralEligibility('active', 'verified', {
    ...completeProfile,
    compliance: { insurance: { publicLiabilityExpiry: '2020-01-01' } },
  }, '2026-10-09'), 'ineligible');
  assert.equal(calculateReferralEligibility('active', 'verified', {
    ...completeProfile,
    compliance: { documents: [{ reviewStatus: 'rejected' }] },
  }), 'ineligible');
  assert.equal(calculateReferralEligibility('active', 'verified', {
    ...completeProfile,
    compliance: { documents: [{ reviewStatus: 'pending' }] },
  }), 'temporarily_ineligible');
});

test('provider sessions can edit only their own provider record', () => {
  assert.equal(isProviderSessionFor({ role: 'provider', subject: 'p-1' }, 'p-1'), true);
  assert.equal(isProviderSessionFor({ role: 'provider', subject: 'p-1' }, 'p-2'), false);
  assert.equal(isProviderSessionFor({ role: 'admin', subject: 'p-1' }, 'p-1'), false);
  assert.equal(isProviderSessionFor(null, 'p-1'), false);
});

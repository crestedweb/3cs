import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceMiles, extractPlaceQueryCandidates, matchProviderToRequest, normalizePostcode } from '../provider-matching.mjs';

const approvedProvider = {
  status: 'active',
  verificationStatus: 'verified',
  referralEligibility: 'eligible',
  profileData: {
    services: ['Visiting/home care'],
    careNeeds: ['Dementia'],
    availability: { acceptingReferrals: true, capacity: 2 },
    coverage: {
      baseCoordinates: { latitude: 52.6369, longitude: -1.1398 },
      radiusMiles: 10,
      locations: [{ id: 'cov1', name: 'Coventry', kind: 'place' }],
      exclusions: [{ name: 'Leicester' }],
    },
  },
};

test('normalizes UK postcodes across spaces and case', () => {
  assert.equal(normalizePostcode('le2 7lt'), 'LE2 7LT');
  assert.equal(normalizePostcode('SW1A-1AA'), 'SW1A 1AA');
  assert.equal(normalizePostcode(' SW1A\u00a01AA '), 'SW1A 1AA');
  assert.equal(normalizePostcode('GIR 0AA'), 'GIR 0AA');
  assert.equal(normalizePostcode('not a postcode'), '');
});

test('does not report a location match when the client location is missing or unrecognized', () => {
  const result = matchProviderToRequest(approvedProvider, {
    area: 'I am looking for care professional/overnight',
    locationQuery: 'I am looking for care professional/overnight',
    service: 'Visiting/home care',
    careNeeds: ['Dementia'],
  });
  assert.equal(result.locationCovered, false);
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.some((reason) => reason.startsWith('Client location could not be resolved')));
});

test('extracts town names from free-form care location wording without changing the submitted value', () => {
  assert.deepEqual(extractPlaceQueryCandidates('London'), ['London']);
  assert.deepEqual(extractPlaceQueryCandidates('I will prefer london'), ['I will prefer london', 'london']);
  assert.deepEqual(extractPlaceQueryCandidates('I am looking for care in Manchester.'), ['I am looking for care in Manchester', 'Manchester']);
});

test('distance uses geographic coordinates in miles', () => {
  const same = { latitude: 52.6369, longitude: -1.1398 };
  assert.equal(distanceMiles(same, same), 0);
  assert.ok(distanceMiles(same, { latitude: 52.8, longitude: -1.5 }) > 0);
});

test('matches explicitly selected towns without assuming nearby towns are covered', () => {
  const request = { areaName: 'Coventry', service: 'Visiting/home care', careNeeds: ['Dementia'] };
  assert.equal(matchProviderToRequest(approvedProvider, request).eligible, true);
  assert.equal(matchProviderToRequest(approvedProvider, { ...request, areaName: 'Birmingham' }).locationCovered, false);
});

test('a provider based in one area can explicitly cover multiple other areas', () => {
  const provider = {
    ...approvedProvider,
    profileData: {
      ...approvedProvider.profileData,
      coverage: {
        ...approvedProvider.profileData.coverage,
        radiusMiles: 0,
        locations: [
          { id: 'town-b', name: 'Birmingham', kind: 'place' },
          { id: 'town-c', name: 'Coventry', kind: 'place' },
        ],
      },
    },
  };
  const baseRequest = { service: 'Visiting/home care', careNeeds: ['Dementia'] };
  assert.equal(matchProviderToRequest(provider, { ...baseRequest, areaName: 'Birmingham' }).locationCovered, true);
  assert.equal(matchProviderToRequest(provider, { ...baseRequest, areaName: 'Coventry' }).locationCovered, true);
  assert.equal(matchProviderToRequest(provider, { ...baseRequest, areaName: 'Solihull' }).locationCovered, false);
});

test('uses the declared radius only when client coordinates are within range', () => {
  const provider = { ...approvedProvider, profileData: { ...approvedProvider.profileData, coverage: { ...approvedProvider.profileData.coverage, locations: [], exclusions: [] } } };
  const baseRequest = { service: 'Visiting/home care', careNeeds: ['Dementia'], coordinates: { latitude: 52.6369, longitude: -1.1398 } };
  assert.equal(matchProviderToRequest(provider, baseRequest).locationCovered, true);
  assert.equal(matchProviderToRequest(provider, { ...baseRequest, coordinates: { latitude: 53.8, longitude: -1.5 } }).locationCovered, false);
});

test('honours exclusions even when the request falls inside the radius', () => {
  const result = matchProviderToRequest(approvedProvider, {
    areaName: 'Leicester',
    coordinates: { latitude: 52.6369, longitude: -1.1398 },
    service: 'Visiting/home care',
    careNeeds: ['Dementia'],
  });
  assert.equal(result.locationCovered, false);
  assert.equal(result.eligible, false);
});

test('does not match providers without verified eligibility, declared service, care need, and capacity', () => {
  const cases = [
    { ...approvedProvider, verificationStatus: 'pending_review' },
    { ...approvedProvider, status: 'suspended' },
    { ...approvedProvider, profileData: { ...approvedProvider.profileData, services: ['Live-in care'] } },
    { ...approvedProvider, profileData: { ...approvedProvider.profileData, careNeeds: [] } },
    { ...approvedProvider, profileData: { ...approvedProvider.profileData, availability: { acceptingReferrals: false, capacity: 0 } } },
    { ...approvedProvider, profileData: { ...approvedProvider.profileData, compliance: { insurance: { publicLiabilityExpiry: '2000-01-01' } } } },
  ];
  for (const provider of cases) {
    assert.equal(matchProviderToRequest(provider, { areaName: 'Coventry', service: 'Visiting/home care', careNeeds: ['Dementia'] }).eligible, false);
  }
});

test('does not treat a provider as available before its declared earliest date', () => {
  const provider = {
    ...approvedProvider,
    profileData: {
      ...approvedProvider.profileData,
      availability: { acceptingReferrals: true, capacity: 2, earliestDate: '2030-01-01' },
    },
  };
  const result = matchProviderToRequest(provider, {
    areaName: 'Coventry',
    service: 'Visiting/home care',
    careNeeds: ['Dementia'],
    requestedDate: '2029-12-31',
  });
  assert.equal(result.available, false);
  assert.equal(result.eligible, false);
});

test('uses today when a request does not specify a target date', () => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const provider = {
    ...approvedProvider,
    profileData: {
      ...approvedProvider.profileData,
      availability: { acceptingReferrals: true, capacity: 2, earliestDate: tomorrow.toISOString().slice(0, 10) },
    },
  };
  const result = matchProviderToRequest(provider, {
    areaName: 'Coventry',
    service: 'Visiting/home care',
    careNeeds: ['Dementia'],
  });
  assert.equal(result.available, false);
  assert.equal(result.eligible, false);
});

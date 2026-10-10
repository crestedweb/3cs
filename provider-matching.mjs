export function normalizePostcode(value = '') {
  const compact = String(value).normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (compact !== 'GIR0AA' && !/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) return '';
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function extractPlaceQueryCandidates(value = '') {
  const input = String(value || '').trim().replace(/\s+/g, ' ').replace(/[.,!?;:]+$/g, '').trim();
  if (!input) return [];
  const candidates = [input];
  const patterns = [
    /^(?:i\s+)?(?:would\s+|will\s+)?prefer(?:\s+to)?\s+(.+)$/i,
    /^(?:i\s+)?(?:am\s+)?(?:looking for care|need care|want care)\s+(?:in|near|around)\s+(.+)$/i,
    /\b(?:in|near|around|within)\s+([a-z][a-z\s'-]{1,60})$/i,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    const place = match?.[1]?.trim().replace(/[.,!?;:]+$/g, '').trim();
    if (place && !candidates.some((candidate) => candidate.toLowerCase() === place.toLowerCase())) candidates.push(place);
  }
  return candidates;
}

export function distanceMiles(a, b) {
  if (![a?.latitude, a?.longitude, b?.latitude, b?.longitude].every(Number.isFinite)) return Infinity;
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function matchProviderToRequest(provider, request) {
  const profile = provider?.profileData || {};
  const coverage = profile.coverage || {};
  const locations = Array.isArray(coverage.locations) ? coverage.locations : [];
  const exclusions = Array.isArray(coverage.exclusions) ? coverage.exclusions : [];
  const requestPostcode = normalizePostcode(request?.postcode || request?.area);
  const requestOutcode = String(request?.postcode || request?.area || '').trim().toUpperCase();
  const radius = Number(coverage.radiusMiles || 0);
  const radiusMatch = radius > 0 && distanceMiles(coverage.baseCoordinates, request?.coordinates) <= radius;
  const explicitMatch = locations.some((location) => {
    if (location.excluded) return false;
    if (location.postcode && requestPostcode && normalizePostcode(location.postcode) === requestPostcode) return true;
    if ((location.kind === 'postcode-district' || location.kind === 'outcode') && location.outcode && ((requestPostcode && requestPostcode.startsWith(`${String(location.outcode).toUpperCase()} `)) || requestOutcode === String(location.outcode).toUpperCase())) return true;
    const wanted = String(request?.areaName || '').trim().toLowerCase();
    const wantedAliases = (request?.areaAliases || []).map((name) => String(name || '').trim().toLowerCase());
    return Boolean((wanted || wantedAliases.length) && [location.name, ...(location.aliases || [])]
      .some((name) => [wanted, ...wantedAliases].includes(String(name || '').trim().toLowerCase())));
  });
  const excluded = [...locations.filter((location) => location.excluded), ...exclusions].some((location) => (
    (location.postcode && requestPostcode && normalizePostcode(location.postcode) === requestPostcode)
    || ((location.kind === 'postcode-district' || location.kind === 'outcode') && location.outcode && ((requestPostcode && requestPostcode.startsWith(`${String(location.outcode).toUpperCase()} `)) || requestOutcode === String(location.outcode).toUpperCase()))
    || (request?.areaName && [location.name, ...(location.aliases || [])].some((name) => String(name || '').trim().toLowerCase() === String(request.areaName).trim().toLowerCase()))
  ));
  const locationProvided = Boolean(requestPostcode || request?.coordinates || request?.areaName);
  const locationCovered = locationProvided && !excluded && (radiusMatch || explicitMatch);

  const services = new Set((profile.services || [provider?.serviceType]).map((item) => String(item).toLowerCase()));
  const needs = new Set((profile.careNeeds || []).map((item) => String(item).toLowerCase()));
  const serviceCompatible = !request?.service || services.has(String(request.service).trim().toLowerCase());
  const careNeedsSupported = (request?.careNeeds || []).every((need) => needs.has(String(need).toLowerCase()));
  const today = new Date().toISOString().slice(0, 10);
  const availabilityDate = String(profile.availability?.earliestDate || '').slice(0, 10);
  const requestedDate = String(request?.requestedDate || '').slice(0, 10);
  const canAcceptByRequestedDate = !availabilityDate || availabilityDate <= (requestedDate || today);
  const available = profile.availability?.acceptingReferrals === true
    && Number(profile.availability?.capacity || 0) > 0
    && canAcceptByRequestedDate;
  const insuranceDates = Object.values(profile.compliance?.insurance || {}).filter(Boolean);
  const expiredInsurance = insuranceDates.some((date) => String(date).slice(0, 10) < today);
  const rejectedDocument = (profile.compliance?.documents || []).some((document) => document.reviewStatus === 'rejected');
  const verificationSatisfied = provider?.status === 'active'
    && provider?.verificationStatus === 'verified'
    && provider?.referralEligibility === 'eligible'
    && !expiredInsurance
    && !rejectedDocument;

  const reasons = [
    !locationProvided && request?.locationQuery ? 'Client location could not be resolved from the submitted text; confirm the postcode or town/city' : !locationProvided ? 'Client location missing: provide a UK postcode or verified location' : locationCovered ? 'Location covered' : 'Location not in declared coverage',
    serviceCompatible ? 'Required service offered' : 'Required service not offered',
    careNeedsSupported ? 'Relevant care needs supported' : 'Care needs not supported',
    available ? 'Provider has availability' : 'No current capacity declared',
    expiredInsurance ? 'An insurance document has expired' : rejectedDocument ? 'A supporting document was rejected' : verificationSatisfied ? 'Verification requirements satisfied' : 'Provider is not approved for referrals',
  ];
  return {
    eligible: locationCovered && serviceCompatible && careNeedsSupported && available && verificationSatisfied,
    reasons,
    locationCovered,
    serviceCompatible,
    careNeedsSupported,
    available,
    verificationSatisfied,
  };
}

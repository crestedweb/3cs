export function calculateReferralEligibility(accountStatus, verificationStatus, profileData = {}, today = new Date().toISOString().slice(0, 10)) {
  if (accountStatus === 'suspended' || ['rejected', 'expired'].includes(verificationStatus)) return 'ineligible';
  if (accountStatus !== 'active' || verificationStatus !== 'verified') return 'temporarily_ineligible';
  const expiredInsurance = Object.values(profileData.compliance?.insurance || {})
    .filter(Boolean)
    .some((date) => String(date).slice(0, 10) < today);
  const documents = profileData.compliance?.documents || [];
  if (expiredInsurance || documents.some((document) => document.reviewStatus === 'rejected')) return 'ineligible';
  if (documents.some((document) => !['reviewed', 'rejected'].includes(document.reviewStatus))) return 'temporarily_ineligible';
  const coverage = profileData.coverage || {};
  const hasGeocodedRadius = Number(coverage.radiusMiles) > 0
    && Number.isFinite(coverage.baseCoordinates?.latitude)
    && Number.isFinite(coverage.baseCoordinates?.longitude);
  const hasExplicitAreas = (coverage.locations || []).length > 0;
  const hasCapabilities = (profileData.services || []).length > 0 && (profileData.careNeeds || []).length > 0;
  const hasCapacity = profileData.availability?.acceptingReferrals === true && Number(profileData.availability?.capacity) > 0;
  return hasCapabilities && hasCapacity && (hasGeocodedRadius || hasExplicitAreas) ? 'eligible' : 'temporarily_ineligible';
}

export function isProviderSessionFor(session, providerId) {
  return session?.role === 'provider' && String(session.subject) === String(providerId);
}

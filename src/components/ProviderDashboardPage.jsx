import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_KEYS } from '../data/siteData';

const dashboardServices = ['Visiting/home care', 'Personal care', 'Live-in care', 'Overnight care', '24-hour care', 'Respite care', 'Emergency or urgent care', 'Hospital discharge and reablement', 'Companionship', 'Medication support', 'Domestic support', 'Complex care', 'Other'];
const dashboardCareNeeds = ['Older adults', 'Dementia', 'Complex care', 'Physical disabilities', 'Learning disabilities', 'Autism', 'Mental health needs', 'Palliative or end-of-life care', 'Nursing care', 'Other specialist needs'];

export default function ProviderDashboardPage({ providerSession, setProviderSession, dashboardLeads = [], setDashboardLeads, onBack, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).at(-1);
  const activeSection = ['overview', 'bio', 'documents', 'referrals'].includes(pageName) ? pageName : 'overview';
  const [profileData, setProfileData] = useState(() => ({ ...(providerSession?.profileData || {}), coverage: { radiusMiles: 0, locations: [], exclusions: [], ...(providerSession?.profileData?.coverage || {}) } }));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [documentMessage, setDocumentMessage] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [postcodeAreaSearch, setPostcodeAreaSearch] = useState('');
  const [areaOptions, setAreaOptions] = useState([]);
  const [areaExcludedMode, setAreaExcludedMode] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState('other');
  const [uploadingDocument, setUploadingDocument] = useState(false);
  useEffect(() => {
    if (!providerSession?.id || !providerSession?.token) return;
    let active = true;
    fetch(`/api/provider/dashboard/${providerSession.id}`, { headers: { Authorization: `Bearer ${providerSession.token}` } })
      .then(async (response) => ({ response, payload: await response.json() }))
      .then(({ response, payload }) => {
        if (!active) return;
        if (response.status === 401) {
          onLogout?.();
          return;
        }
        if (!response.ok) return;
        if (setDashboardLeads) setDashboardLeads(payload.dashboard?.leads || []);
        if (payload.provider) {
          const updatedSession = { ...providerSession, ...payload.provider, token: providerSession.token };
          setProfileData((current) => payload.provider.profileData || current);
          setProviderSession?.(updatedSession);
          localStorage.setItem(AUTH_KEYS.provider, JSON.stringify(updatedSession));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [providerSession?.id, providerSession?.token, setDashboardLeads]);
  useEffect(() => {
    if (areaSearch.trim().length < 2) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(areaSearch)}`, { signal: controller.signal });
        const payload = await response.json();
        setAreaOptions(payload.locations || []);
      } catch { if (!controller.signal.aborted) setAreaOptions([]); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [areaSearch]);
  const visibleAreaOptions = areaSearch.trim().length >= 2 ? areaOptions : [];

  if (!providerSession) {
    return <Navigate to="/" replace />;
  }

  const providerName = providerSession?.businessName || 'Provider portal';
  const serviceArea = providerSession?.area || 'Your area';
  const careTypes = providerSession?.serviceType || 'Domiciliary care';
  const responseTarget = providerSession?.responseTarget || 'Under 30 minutes';
  const currentCapacity = providerSession?.capacity || 'Open for new enquiries';
  const verificationStatus = providerSession?.verificationStatus || 'incomplete';
  const registration = profileData.registration || {};
  const nextReview = 'Your verification review is pending';
  const coverage = profileData.coverage || { locations: [] };
  const toggleCapability = (key, value) => setProfileData((current) => {
    const selected = current[key] || [];
    return { ...current, [key]: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value] };
  });
  const pendingDocuments = (profileData.compliance?.documents || []).filter((document) => document.reviewStatus === 'pending').length;
  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');
    try {
      const response = await fetch(`/api/providers/${providerSession.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerSession.token}` },
        body: JSON.stringify({ profileData }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to save profile.');
      setProfileData(payload.provider.profileData || profileData);
      const updatedSession = { ...providerSession, ...payload.provider, profileData: payload.provider.profileData };
      localStorage.setItem(AUTH_KEYS.provider, JSON.stringify(updatedSession));
      setProviderSession?.(updatedSession);
      setProfileMessage('Your coverage and care capabilities have been saved.');
    } catch (error) { setProfileMessage(error.message || 'Unable to save profile.'); }
    finally { setSavingProfile(false); }
  };
  const uploadDocument = async (event) => {
    event.preventDefault();
    if (!documentFile) return;
    setUploadingDocument(true);
    setDocumentMessage('');
    try {
      const body = new FormData();
      body.append('document', documentFile);
      body.append('documentType', documentType);
      const response = await fetch(`/api/providers/${providerSession.id}/documents`, { method: 'POST', headers: { Authorization: `Bearer ${providerSession.token}` }, body });
      const payload = await response.json();
      if (response.status === 401) {
        onLogout?.();
        throw new Error('Your session expired. Please sign in again, then retry the upload.');
      }
      if (!response.ok) throw new Error(payload.details ? `${payload.error || 'Document upload failed.'} ${payload.details}` : (payload.error || 'Document upload failed.'));
      const updatedSession = { ...providerSession, ...payload.provider, profileData: payload.provider.profileData };
      setProfileData(updatedSession.profileData);
      setProviderSession?.(updatedSession);
      localStorage.setItem(AUTH_KEYS.provider, JSON.stringify(updatedSession));
      setDocumentFile(null);
      setDocumentMessage('Document uploaded successfully. It is now in your documents and available to the admin for review.');
    } catch (error) { setDocumentMessage(error.message || 'Document upload failed.'); }
    finally { setUploadingDocument(false); }
  };
  const addCoveragePostcode = async () => {
    try {
      const district = /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(postcodeAreaSearch.replace(/\s/g, ''));
      const response = await fetch(district
        ? `/api/locations/outcode/${encodeURIComponent(postcodeAreaSearch.replace(/\s/g, ''))}`
        : `/api/locations/postcode/${encodeURIComponent(postcodeAreaSearch)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Postcode lookup failed.');
      const location = payload.location.kind === 'postcode-district'
        ? payload.location
        : { ...payload.location, id: `postcode-${payload.location.postcode}`, name: payload.location.postcode, kind: 'postcode' };
      const key = areaExcludedMode ? 'exclusions' : 'locations';
      setProfileData((current) => ({ ...current, coverage: { ...(current.coverage || {}), [key]: [...(current.coverage?.[key] || []).filter((item) => item.id !== location.id), location] } }));
      setPostcodeAreaSearch('');
    } catch (error) { setProfileMessage(error.message || 'Postcode lookup failed.'); }
  };
  const hasRealRating = typeof providerSession?.rating === 'number' && Number.isFinite(providerSession.rating) && (providerSession?.reviewCount ?? 0) > 0;
  const displayRating = hasRealRating ? providerSession.rating.toFixed(1) : 'No rating yet';
  const stats = [
    { label: 'New leads', value: providerSession?.newLeads ?? 0 },
    { label: 'Qualified', value: providerSession?.qualified ?? 0 },
    { label: 'Booked', value: providerSession?.booked ?? 0 },
    { label: 'Rating', value: displayRating },
  ];

  return (
    <div className="provider-dashboard-shell" style={{ minHeight: '100vh', background: '#f5f7fa', padding: 20 }}>
      <style>{`
        .provider-dashboard-shell,
        .provider-dashboard-shell * {
          box-sizing: border-box;
        }
        .provider-dashboard-panel,
        .provider-dashboard-card,
        .provider-dashboard-item,
        .provider-dashboard-profile-copy {
          min-width: 0;
        }
        .provider-dashboard-title,
        .provider-dashboard-item small,
        .provider-dashboard-profile-copy strong,
        .provider-dashboard-profile-copy small {
          overflow-wrap: anywhere;
        }
        @media (max-width: 768px) {
          .provider-dashboard-shell {
            padding: 12px !important;
          }
          .provider-dashboard-shell .provider-dashboard-panel {
            padding: 14px !important;
            border-radius: 16px !important;
          }
          .provider-dashboard-shell .provider-dashboard-main {
            grid-template-columns: 1fr !important;
          }
          .provider-dashboard-shell .provider-dashboard-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .provider-dashboard-shell .provider-dashboard-item {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .provider-dashboard-shell .provider-dashboard-card {
            padding: 14px !important;
          }
          .provider-dashboard-shell .provider-dashboard-topbar {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .provider-dashboard-shell .provider-dashboard-topbar-actions {
            width: 100%;
          }
          .provider-dashboard-shell .provider-dashboard-topbar-actions button {
            flex: 1 1 auto;
          }
        }
        @media (max-width: 420px) {
          .provider-dashboard-shell {
            padding: 8px !important;
          }
          .provider-dashboard-shell .provider-dashboard-panel {
            padding: 12px !important;
          }
          .provider-dashboard-shell .provider-dashboard-topbar-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
          }
          .provider-dashboard-shell .provider-dashboard-card {
            padding: 12px !important;
          }
          .provider-dashboard-shell .provider-dashboard-profile {
            align-items: flex-start !important;
          }
        }
      `}</style>

      <div className="provider-dashboard-panel" style={{ width: '100%', maxWidth: 1100, margin: '0 auto', background: '#fff', borderRadius: 20, boxShadow: '0 16px 40px rgba(11,29,58,0.08)', padding: 18 }}>
        <div className="provider-dashboard-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#28A745', fontWeight: 800, textTransform: 'uppercase' }}>Provider dashboard</div>
            <h2 className="provider-dashboard-title" style={{ margin: '8px 0 0', color: '#0B1D3A', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>{providerName}</h2>
          </div>
          <div className="provider-dashboard-topbar-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost-green" onClick={onBack} style={{ width: 'auto', padding: '10px 16px', fontSize: '0.82rem' }}>Back to site</button>
            {onLogout && (
              <button className="btn btn-navy" onClick={onLogout} style={{ width: 'auto', padding: '10px 16px', fontSize: '0.82rem' }}>Log out</button>
            )}
          </div>
        </div>

        <nav aria-label="Provider dashboard pages" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 14px', marginBottom: 14, borderBottom: '1px solid #e4ecf6' }}>
          {[['overview', 'Overview'], ['bio', 'My bio'], ['documents', 'Documents'], ['referrals', 'Referrals']].map(([id, label]) => <button key={id} type="button" onClick={() => navigate(`/provider/dashboard/${id}`)} aria-current={activeSection === id ? 'page' : undefined} style={{ whiteSpace: 'nowrap', border: activeSection === id ? '1px solid #0B1D3A' : '1px solid #dfeaf8', borderRadius: 999, background: activeSection === id ? '#0B1D3A' : '#fff', color: activeSection === id ? '#fff' : '#34445a', padding: '9px 15px', fontWeight: 700, cursor: 'pointer' }}>{label}</button>)}
        </nav>

        {activeSection === 'overview' && <>
        <div id="provider-overview" className="provider-dashboard-stats" style={{ scrollMarginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ background: stat.label === 'Rating' ? '#eaf7ff' : stat.label === 'Booked' ? '#f2f6fb' : stat.label === 'Qualified' ? '#eefaf2' : '#0B1D3A', color: stat.label === 'Rating' || stat.label === 'Booked' || stat.label === 'Qualified' ? '#0B1D3A' : '#fff', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{stat.label}</div>
              <div style={{ fontSize: stat.label === 'Rating' && stat.value === 'No rating yet' ? 16 : 28, fontWeight: 800, marginTop: 6 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="provider-dashboard-card" style={{ border: '1px solid #dfeaf8', borderRadius: 16, padding: 14, marginBottom: 18, background: '#f9fbff', color: '#34445a', fontSize: 13, lineHeight: 1.6 }}>
          <strong style={{ color: '#0B1D3A' }}>Verification progress</strong>
          <div>Account: {providerSession.accountStatus || providerSession.status || 'pending'} · Platform review: {verificationStatus.replaceAll('_', ' ')} · Referral eligibility: {(providerSession.referralEligibility || 'temporarily_ineligible').replaceAll('_', ' ')}</div>
          <div>Regulatory details are self-declared until reviewed. 3CS platform verification is not regulatory approval.</div>
          {providerSession.referralEligibility !== 'eligible' && <div>Outstanding: wait for administrator review{pendingDocuments ? `; ${pendingDocuments} document(s) awaiting review` : ''}.</div>}
        </div>

        </>}
        {activeSection === 'referrals' && <div id="provider-referrals" className="provider-dashboard-card" style={{ scrollMarginTop: 16, border: '1px solid #e4ecf6', borderRadius: 18, padding: 16, marginBottom: 18 }}>
          <h3 style={{ margin: '0 0 10px', color: '#0B1D3A', fontSize: '1.1rem' }}>Eligible referral opportunities</h3>
          {providerSession.referralEligibility !== 'eligible' ? <p style={{ margin: 0, color: '#5a6a7e' }}>Referrals are restricted while your account or verification is pending. Check the verification progress below.</p>
            : dashboardLeads.length === 0 ? <p style={{ margin: 0, color: '#5a6a7e' }}>No current referrals match your declared coverage, services, care needs and availability.</p>
              : <div style={{ display: 'grid', gap: 9 }}>{dashboardLeads.map((lead) => <div key={lead.id} style={{ border: '1px solid #edf2f7', borderRadius: 11, padding: 12, background: '#f9fbff' }}><strong style={{ color: '#0B1D3A' }}>{lead.need || 'Care support'} · {lead.area || 'Area not provided'}</strong><div style={{ marginTop: 4, fontSize: 12, color: '#5a6a7e' }}>Why this matches: {(lead.matchReasons || []).join(' · ')}</div><div style={{ marginTop: 4, fontSize: 12, color: '#5a6a7e' }}>Submitted {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'recently'} · {lead.urgency || 'Soon'}</div></div>)}</div>}
        </div>}

        {activeSection === 'overview' && <div className="provider-dashboard-main" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
          <div className="provider-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', color: '#0B1D3A', fontSize: '1.1rem' }}>Service overview</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['Care types supported', careTypes],
                ['Average response time', responseTarget],
                ['Current capacity', currentCapacity],
                ['Verification status', verificationStatus],
              ].map(([label, value]) => (
                <div key={label} className="provider-dashboard-item" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0B1D3A' }}>{label}</div>
                    <small style={{ color: '#5a6a7e' }}>{value}</small>
                  </div>
                  <span style={{ background: label === 'Verification status' && verificationStatus !== 'verified' ? '#fff4d8' : '#eafaf1', color: '#0B1D3A', borderRadius: 999, padding: '6px 10px', fontWeight: 700, fontSize: 11 }}>{label === 'Verification status' ? verificationStatus.replace('_', ' ') : 'Self-declared'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="provider-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', color: '#0B1D3A', fontSize: '1.1rem' }}>Provider profile</h3>
            <div className="provider-dashboard-profile" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #0B1D3A, #28A745)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>{providerName.slice(0, 2).toUpperCase() || 'PC'}</div>
              <div className="provider-dashboard-profile-copy">
                <strong style={{ display: 'block', color: '#0B1D3A', fontSize: '0.95rem' }}>{providerName}</strong>
                <small style={{ color: '#5a6a7e' }}>{serviceArea}</small>
              </div>
            </div>
            <div style={{ color: '#5a6a7e', lineHeight: 1.7, fontSize: '0.9rem' }}>
              Service area: {serviceArea}<br />
              Response target: {responseTarget}<br />
              Next review: {nextReview}
            </div>
          </div>
        </div>}
        {activeSection === 'bio' && <>
        <section id="provider-bio" className="provider-dashboard-card" style={{ scrollMarginTop: 16, border: '1px solid #e4ecf6', borderRadius: 18, padding: 16, marginTop: 18 }}>
          <h3 style={{ margin: '0 0 12px', color: '#0B1D3A', fontSize: '1.1rem' }}>My submitted bio</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, color: '#34445a', fontSize: 13 }}>
            {[[ 'Contact', profileData.business?.contactName || providerSession.name ], ['Provider', profileData.business?.providerName || providerSession.businessName], ['Email', providerSession.email], ['Phone', profileData.business?.phone || providerSession.phone], ['Legal business name', profileData.business?.legalName], ['Business type', profileData.business?.type?.replaceAll('_', ' ')], ['Companies House number', profileData.business?.companiesHouseNumber], ['Address', profileData.business?.address], ['Website', profileData.business?.website], ['Nation', registration.nation], ['Regulator', registration.regulator], ['Registration status', registration.isRegistered ? 'Registered' : 'Not registered / not applicable'], ['Registration details', registration.registrationDetails || registration.cqcRegistration || registration.otherRegistration], ['Registration location IDs', (registration.locationIds || []).join(', ')], ['Registered manager', registration.registeredManager], ['Regulated activities', (registration.regulatedActivities || []).join(', ')], ['Office postcode', coverage.basePostcode], ['Travel radius', `${coverage.radiusMiles || 0} miles`], ['Covered locations', (coverage.locations || []).map((item) => item.name).join(', ')], ['Excluded locations', (coverage.exclusions || []).map((item) => item.name).join(', ')], ['Services', (profileData.services || []).join(', ')], ['Care needs supported', (profileData.careNeeds || []).join(', ')], ['Accepting referrals', profileData.availability?.acceptingReferrals ? 'Yes' : 'No'], ['Capacity', profileData.availability?.capacity], ['Earliest referral date', profileData.availability?.earliestDate], ['Service description', profileData.serviceDescription], ['Specialisms', (profileData.specialisms || []).join(', ')], ['Minimum package', profileData.minimumPackage], ['Minimum visit duration', profileData.minimumVisit], ['Indicative pricing', profileData.indicativePrice], ['Public liability expiry', profileData.compliance?.insurance?.publicLiabilityExpiry], ['Employers liability expiry', profileData.compliance?.insurance?.employersLiabilityExpiry], ['Professional indemnity expiry', profileData.compliance?.insurance?.indemnityExpiry], ['Policies declared', Object.entries(profileData.compliance?.policies || {}).filter(([, supplied]) => supplied).map(([policy]) => policy.replaceAll(/([A-Z])/g, ' $1')).join(', ')], ['Provider terms accepted', profileData.consent?.providerTermsAccepted ? `Yes · ${profileData.consent.acceptedAt ? new Date(profileData.consent.acceptedAt).toLocaleDateString() : ''}` : 'No']].map(([label, value]) => <div key={label}><strong style={{ display: 'block', color: '#0B1D3A', marginBottom: 3 }}>{label}</strong><span>{value || 'Not provided'}</span></div>)}
          </div>
          <p style={{ color: '#64748b', fontSize: 12, margin: '14px 0 0' }}>This is the information currently saved to your provider profile. Use the form below to make changes.</p>
        </section>
        <form onSubmit={saveProfile} className="provider-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16, marginTop: 18, display: 'grid', gap: 12 }}>
          <div><h3 style={{ margin: '0 0 4px', color: '#0B1D3A', fontSize: '1.1rem' }}>Edit service coverage and capabilities</h3><p style={{ margin: 0, color: '#5a6a7e', fontSize: 13 }}>Your office postcode is kept separate from the areas you declare you can serve.</p></div>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Contact person<input className="finput" value={profileData.business?.contactName || providerSession.name || ''} onChange={(event) => setProfileData((current) => ({ ...current, business: { ...(current.business || {}), contactName: event.target.value } }))} /></label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Provider/business name<input className="finput" value={profileData.business?.providerName || providerSession.businessName || ''} onChange={(event) => setProfileData((current) => ({ ...current, business: { ...(current.business || {}), providerName: event.target.value } }))} /></label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Business phone<input className="finput" type="tel" value={profileData.business?.phone || providerSession.phone || ''} onChange={(event) => setProfileData((current) => ({ ...current, business: { ...(current.business || {}), phone: event.target.value } }))} /></label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Legal business name<input className="finput" value={profileData.business?.legalName || ''} onChange={(event) => setProfileData((current) => ({ ...current, business: { ...(current.business || {}), legalName: event.target.value } }))} /></label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Business type<select className="finput" value={profileData.business?.type || ''} onChange={(event) => setProfileData((current) => ({ ...current, business: { ...(current.business || {}), type: event.target.value } }))}><option value="">Select business type</option><option value="limited_company">Limited company</option><option value="sole_trader">Sole trader</option><option value="partnership">Partnership</option><option value="charity">Charity</option><option value="other">Other</option></select></label>
          {profileData.business?.type === 'limited_company' && <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Companies House number<input className="finput" value={profileData.business?.companiesHouseNumber || ''} onChange={(event) => setProfileData((current) => ({ ...current, business: { ...(current.business || {}), companiesHouseNumber: event.target.value } }))} /></label>}
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Website<input className="finput" type="url" value={profileData.business?.website || ''} onChange={(event) => setProfileData((current) => ({ ...current, business: { ...(current.business || {}), website: event.target.value } }))} /></label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Registered business address<input className="finput" value={profileData.business?.address || ''} onChange={(event) => setProfileData((current) => ({ ...current, business: { ...(current.business || {}), address: event.target.value } }))} /></label>
          <fieldset style={{ border: '1px solid #dfeaf8', borderRadius: 10, padding: 12, display: 'grid', gap: 10 }}><legend style={{ color: '#0B1D3A', fontWeight: 700, padding: '0 5px' }}>Regulatory registration (self-declared)</legend>
            <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Nation<select className="finput" value={registration.nation || 'England'} onChange={(event) => setProfileData((current) => ({ ...current, registration: { ...(current.registration || {}), nation: event.target.value, regulator: ({ England: 'CQC', Wales: 'Care Inspectorate Wales', Scotland: 'Care Inspectorate Scotland', 'Northern Ireland': 'RQIA' })[event.target.value] } }))}><option>England</option><option>Wales</option><option>Scotland</option><option>Northern Ireland</option></select></label>
            <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Registration status<select className="finput" value={registration.isRegistered ? 'yes' : 'no'} onChange={(event) => setProfileData((current) => ({ ...current, registration: { ...(current.registration || {}), isRegistered: event.target.value === 'yes' } }))}><option value="no">Not registered / not applicable to this service</option><option value="yes">Registered</option></select></label>
            {registration.isRegistered && <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Registration details<input className="finput" value={registration.registrationDetails || registration.cqcRegistration || registration.otherRegistration || ''} onChange={(event) => setProfileData((current) => ({ ...current, registration: { ...(current.registration || {}), registrationDetails: event.target.value } }))} /></label>}
            <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Location ID(s), comma separated<input className="finput" value={(registration.locationIds || []).join(', ')} onChange={(event) => setProfileData((current) => ({ ...current, registration: { ...(current.registration || {}), locationIds: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) } }))} /></label>
            <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Registered manager details<input className="finput" value={registration.registeredManager || ''} onChange={(event) => setProfileData((current) => ({ ...current, registration: { ...(current.registration || {}), registeredManager: event.target.value } }))} /></label>
            <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Regulated activities, comma separated<input className="finput" value={(registration.regulatedActivities || []).join(', ')} onChange={(event) => setProfileData((current) => ({ ...current, registration: { ...(current.registration || {}), regulatedActivities: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) } }))} /></label>
            <small style={{ color: '#5a6a7e' }}>Changes require administrator review. This is not regulatory approval.</small>
          </fieldset>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Main office postcode<input className="finput" value={coverage.basePostcode || ''} onChange={(event) => setProfileData((current) => ({ ...current, coverage: { ...(current.coverage || {}), basePostcode: event.target.value } }))} /></label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Travel radius in miles<input className="finput" type="number" min="0" max="250" value={coverage.radiusMiles || 0} onChange={(event) => setProfileData((current) => ({ ...current, coverage: { ...(current.coverage || {}), radiusMiles: Number(event.target.value) } }))} /></label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Search towns, cities and localities<input className="finput" value={areaSearch} onChange={(event) => setAreaSearch(event.target.value)} placeholder="Search UK places" /></label>
          <label style={{ display: 'flex', gap: 8, color: '#33445b' }}><input type="checkbox" checked={areaExcludedMode} onChange={(event) => setAreaExcludedMode(event.target.checked)} />Add searched places as excluded areas</label>
          {visibleAreaOptions.map((area) => <button key={area.id} type="button" onClick={() => { const key = areaExcludedMode ? 'exclusions' : 'locations'; const locations = coverage[key] || []; if (!locations.some((item) => item.id === area.id)) setProfileData((current) => ({ ...current, coverage: { ...(current.coverage || {}), [key]: [...(current.coverage?.[key] || []), area] } })); setAreaSearch(''); setAreaOptions([]); }} style={{ textAlign: 'left', border: '1px solid #dfeaf8', borderRadius: 8, padding: 8, background: '#fff' }}>{area.name} · {areaExcludedMode ? 'Exclude' : 'Add'}</button>)}
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}><label style={{ flex: 1, display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Add a full postcode<input className="finput" value={postcodeAreaSearch} onChange={(event) => setPostcodeAreaSearch(event.target.value)} /></label><button type="button" onClick={addCoveragePostcode} className="btn btn-ghost-green" style={{ width: 'auto', padding: '10px 14px' }}>Add postcode</button></div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{(coverage.locations || []).map((area) => <span key={area.id || area.name} style={{ background: '#eafaf1', padding: '6px 9px', borderRadius: 20 }}>{area.name}<button type="button" aria-label={`Remove ${area.name}`} onClick={() => setProfileData((current) => ({ ...current, coverage: { ...(current.coverage || {}), locations: (current.coverage?.locations || []).filter((item) => item.id !== area.id) } }))} style={{ border: 0, background: 'transparent', marginLeft: 6, cursor: 'pointer' }}>×</button></span>)}</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{(coverage.exclusions || []).map((area) => <span key={area.id || area.name} style={{ background: '#fff1f2', padding: '6px 9px', borderRadius: 20 }}>{area.name}<button type="button" aria-label={`Remove excluded ${area.name}`} onClick={() => setProfileData((current) => ({ ...current, coverage: { ...(current.coverage || {}), exclusions: (current.coverage?.exclusions || []).filter((item) => item.id !== area.id) } }))} style={{ border: 0, background: 'transparent', marginLeft: 6, cursor: 'pointer' }}>×</button></span>)}</div>
          <fieldset style={{ border: '1px solid #dfeaf8', borderRadius: 10, padding: 12 }}><legend style={{ color: '#0B1D3A', fontWeight: 700, padding: '0 5px' }}>Services offered</legend><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 8 }}>{dashboardServices.map((service) => <label key={service} style={{ display: 'flex', gap: 8, color: '#34445a' }}><input type="checkbox" checked={(profileData.services || []).includes(service)} onChange={() => toggleCapability('services', service)} />{service}</label>)}</div></fieldset>
          <fieldset style={{ border: '1px solid #dfeaf8', borderRadius: 10, padding: 12 }}><legend style={{ color: '#0B1D3A', fontWeight: 700, padding: '0 5px' }}>Care needs supported</legend><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 8 }}>{dashboardCareNeeds.map((need) => <label key={need} style={{ display: 'flex', gap: 8, color: '#34445a' }}><input type="checkbox" checked={(profileData.careNeeds || []).includes(need)} onChange={() => toggleCapability('careNeeds', need)} />{need}</label>)}</div></fieldset>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Service description<textarea className="finput" rows="3" value={profileData.serviceDescription || ''} onChange={(event) => setProfileData((current) => ({ ...current, serviceDescription: event.target.value }))} /></label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Specialisms, comma separated<input className="finput" value={(profileData.specialisms || []).join(', ')} onChange={(event) => setProfileData((current) => ({ ...current, specialisms: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} /></label>
          <div className="provider-form-grid"><label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Minimum package/hours<input className="finput" value={profileData.minimumPackage || ''} onChange={(event) => setProfileData((current) => ({ ...current, minimumPackage: event.target.value }))} /></label><label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Minimum visit duration<input className="finput" value={profileData.minimumVisit || ''} onChange={(event) => setProfileData((current) => ({ ...current, minimumVisit: event.target.value }))} /></label><label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Indicative pricing<input className="finput" value={profileData.indicativePrice || ''} onChange={(event) => setProfileData((current) => ({ ...current, indicativePrice: event.target.value }))} /></label></div>
          <label style={{ display: 'flex', gap: 8, color: '#33445b' }}><input type="checkbox" checked={profileData.availability?.acceptingReferrals === true} onChange={(event) => setProfileData((current) => ({ ...current, availability: { ...(current.availability || {}), acceptingReferrals: event.target.checked } }))} />Currently accepting referrals</label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Capacity for new clients<input className="finput" type="number" min="0" value={profileData.availability?.capacity || 0} onChange={(event) => setProfileData((current) => ({ ...current, availability: { ...(current.availability || {}), capacity: Number(event.target.value) } }))} /></label>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Earliest date you can accept a referral<input className="finput" type="date" value={profileData.availability?.earliestDate || ''} onChange={(event) => setProfileData((current) => ({ ...current, availability: { ...(current.availability || {}), earliestDate: event.target.value } }))} /></label>
          <div className="provider-form-grid"><label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Public liability expiry<input className="finput" type="date" value={profileData.compliance?.insurance?.publicLiabilityExpiry || ''} onChange={(event) => setProfileData((current) => ({ ...current, compliance: { ...(current.compliance || {}), insurance: { ...(current.compliance?.insurance || {}), publicLiabilityExpiry: event.target.value } } }))} /></label><label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Employers liability expiry<input className="finput" type="date" value={profileData.compliance?.insurance?.employersLiabilityExpiry || ''} onChange={(event) => setProfileData((current) => ({ ...current, compliance: { ...(current.compliance || {}), insurance: { ...(current.compliance?.insurance || {}), employersLiabilityExpiry: event.target.value } } }))} /></label><label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Professional indemnity expiry<input className="finput" type="date" value={profileData.compliance?.insurance?.indemnityExpiry || ''} onChange={(event) => setProfileData((current) => ({ ...current, compliance: { ...(current.compliance || {}), insurance: { ...(current.compliance?.insurance || {}), indemnityExpiry: event.target.value } } }))} /></label></div>
          <fieldset style={{ border: '1px solid #dfeaf8', borderRadius: 10, padding: 12 }}><legend style={{ color: '#0B1D3A', fontWeight: 700, padding: '0 5px' }}>Policies (self-declared)</legend>{[['safeguarding', 'Safeguarding policy'], ['complaints', 'Complaints procedure'], ['medication', 'Medication policy'], ['infectionControl', 'Infection prevention and control']].map(([key, label]) => <label key={key} style={{ display: 'flex', gap: 8, color: '#34445a', marginBottom: 7 }}><input type="checkbox" checked={profileData.compliance?.policies?.[key] === true} onChange={(event) => setProfileData((current) => ({ ...current, compliance: { ...(current.compliance || {}), policies: { ...(current.compliance?.policies || {}), [key]: event.target.checked } } }))} />{label}</label>)}</fieldset>
          {profileMessage && <div role="status" style={{ color: profileMessage.toLowerCase().includes('unable') || profileMessage.toLowerCase().includes('failed') ? '#b42318' : '#1e7d3d', fontSize: 13 }}>{profileMessage}</div>}
          <button type="submit" className="btn btn-green" disabled={savingProfile} style={{ padding: 12 }}>{savingProfile ? 'Saving…' : 'Save profile updates'}</button>
        </form>
        </>}
        {activeSection === 'documents' && <form id="provider-documents" onSubmit={uploadDocument} className="provider-dashboard-card" style={{ scrollMarginTop: 16, border: '1px solid #e4ecf6', borderRadius: 18, padding: 16, marginTop: 18, display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0, color: '#0B1D3A', fontSize: '1.1rem' }}>Verification documents</h3>
          <p style={{ margin: 0, color: '#5a6a7e', fontSize: 13 }}>PDF, DOC or DOCX, up to 5 MB. Documents are private and stay pending until reviewed by an administrator.</p>
          <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Document type<select className="finput" value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="public_liability">Public liability insurance</option><option value="employers_liability">Employers' liability insurance</option><option value="professional_indemnity">Professional indemnity insurance</option><option value="safeguarding">Safeguarding policy</option><option value="complaints">Complaints procedure</option><option value="medication">Medication policy</option><option value="infection_control">Infection prevention and control policy</option><option value="registration">Regulator registration evidence</option><option value="other">Other supporting document</option></select></label>
          <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
          <button type="submit" className="btn btn-ghost-green" disabled={!documentFile || uploadingDocument} style={{ padding: 12 }}>{uploadingDocument ? 'Uploading…' : 'Upload document'}</button>
          {documentMessage && <div role="status" aria-live="polite" style={{ borderRadius: 10, padding: '12px 14px', background: documentMessage.toLowerCase().includes('failed') || documentMessage.toLowerCase().includes('unable') ? '#fff1f2' : '#eafaf1', color: documentMessage.toLowerCase().includes('failed') || documentMessage.toLowerCase().includes('unable') ? '#b42318' : '#1e7d3d', fontSize: 13, fontWeight: 600 }}>{documentMessage}</div>}
          {(profileData.compliance?.documents || []).length === 0 ? <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>No documents submitted yet.</p> : <div style={{ display: 'grid', gap: 8 }}>{(profileData.compliance?.documents || []).map((document) => <div key={document.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, border: '1px solid #edf2f7', borderRadius: 10, padding: '10px 12px', color: '#34445a', fontSize: 13 }}><span><strong style={{ color: '#0B1D3A' }}>{document.name}</strong><br />{String(document.type || 'other').replaceAll('_', ' ')} · {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Submitted'}</span><strong style={{ color: document.reviewStatus === 'rejected' ? '#b42318' : document.reviewStatus === 'reviewed' ? '#1e7d3d' : '#9a6700', textTransform: 'capitalize' }}>{String(document.reviewStatus || 'pending review').replaceAll('_', ' ')}</strong></div>)}</div>}
        </form>}
      </div>
    </div>
  );
}

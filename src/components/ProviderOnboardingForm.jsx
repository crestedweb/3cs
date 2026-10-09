import { useEffect, useState } from 'react';
import { AUTH_KEYS } from '../data/siteData';
import { normalizePostcode } from '../../provider-matching.mjs';

const steps = ['Business', 'Registration', 'Coverage', 'Services', 'Compliance'];
const services = ['Visiting/home care', 'Personal care', 'Live-in care', 'Overnight care', '24-hour care', 'Respite care', 'Emergency or urgent care', 'Hospital discharge and reablement', 'Companionship', 'Medication support', 'Domestic support', 'Complex care', 'Other'];
const careNeeds = ['Older adults', 'Dementia', 'Complex care', 'Physical disabilities', 'Learning disabilities', 'Autism', 'Mental health needs', 'Palliative or end-of-life care', 'Nursing care', 'Other specialist needs'];
const emptyForm = {
  name: '', businessName: '', legalBusinessName: '', businessType: '', email: '', phone: '', website: '', address: '', mainOfficePostcode: '', companiesHouseNumber: '', password: '', confirmPassword: '',
  nation: 'England', cqcRegistered: 'no', cqcRegistration: '', cqcLocationIds: '', otherRegistered: 'no', otherRegistration: '', otherLocationIds: '', otherActivities: '', registeredManager: '', regulatedActivities: '',
  radiusMiles: '', customRadiusMiles: '', locationSearch: '', explicitPostcode: '', locations: [], excludedLocations: [],
  services: [], careNeeds: [], serviceDescription: '', specialisms: '', minimumPackage: '', minimumVisit: '', indicativePrice: '', acceptingReferrals: false, capacity: '', earliestDate: '',
  publicLiabilityExpiry: '', employersLiabilityExpiry: '', indemnityExpiry: '', safeguardingPolicy: false, complaintsProcedure: false, medicationPolicy: false, infectionPolicy: false, termsAccepted: false,
};

function CheckList({ title, options, selected, onChange }) {
  return <fieldset style={{ border: '1px solid #dfeaf8', borderRadius: 10, padding: 12, margin: '0 0 12px' }}><legend style={{ color: '#0B1D3A', fontWeight: 700, padding: '0 5px' }}>{title}</legend><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 8 }}>{options.map((item) => <label key={item} style={{ color: '#34445a', display: 'flex', gap: 8, alignItems: 'flex-start' }}><input type="checkbox" checked={selected.includes(item)} onChange={() => onChange(selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item])} />{item}</label>)}</div></fieldset>;
}

export default function ProviderOnboardingForm({ setProviderSession, onOpenProviderDashboard, setDashboardLeads }) {
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [locationBusy, setLocationBusy] = useState(false);
  const [addingExclusion, setAddingExclusion] = useState(false);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };
  const updateList = (name, values) => setForm((current) => ({ ...current, [name]: values }));

  useEffect(() => {
    const query = form.locationSearch.trim();
    if (query.length < 2) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLocationBusy(true);
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const payload = await response.json();
        setSuggestions(payload.locations || []);
      } catch { if (!controller.signal.aborted) setSuggestions([]); }
      finally { if (!controller.signal.aborted) setLocationBusy(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [form.locationSearch]);
  const visibleSuggestions = form.locationSearch.trim().length >= 2 ? suggestions : [];

  const addPlace = (place) => {
    const listName = addingExclusion ? 'excludedLocations' : 'locations';
    if (form[listName].some((item) => item.id === place.id)) return;
    updateList(listName, [...form[listName], place]);
    setForm((current) => ({ ...current, locationSearch: '' }));
    setSuggestions([]);
  };

  const addPostcode = async () => {
    const value = form.explicitPostcode.trim();
    if (!value) return;
    try {
      const district = /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(value.replace(/\s/g, ''));
      const response = await fetch(district
        ? `/api/locations/outcode/${encodeURIComponent(value.replace(/\s/g, ''))}`
        : `/api/locations/postcode/${encodeURIComponent(value)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Postcode lookup failed.');
      const location = payload.location.kind === 'postcode-district'
        ? payload.location
        : { ...payload.location, id: `postcode-${payload.location.postcode}`, name: payload.location.postcode, kind: 'postcode' };
      if (!form.locations.some((item) => item.id === location.id)) updateList('locations', [...form.locations, location]);
      setForm((current) => ({ ...current, explicitPostcode: '' }));
      setStatus({ type: '', message: '' });
    } catch (error) { setStatus({ type: 'error', message: error.message }); }
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name || !form.businessName || !form.businessType || !form.email || !form.phone || !form.address || !form.mainOfficePostcode || !form.password) return 'Complete all required business and account fields.';
      if (form.password.length < 10) return 'Use a password with at least 10 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    }
    if (step === 1 && form.nation === 'England' && form.cqcRegistered === 'yes' && !form.cqcRegistration) return 'Enter the CQC registration details or change the registration answer.';
    if (step === 1 && form.nation !== 'England' && form.otherRegistered === 'yes' && !form.otherRegistration) return 'Enter the applicable regulator registration details or change the registration answer.';
    if (step === 2 && ((!form.radiusMiles || (form.radiusMiles === 'custom' && Number(form.customRadiusMiles) <= 0)) && !form.locations.length)) return 'Choose a travel radius, add one or more locations, or use both.';
    if (step === 3 && (!form.services.length || !form.careNeeds.length)) return 'Choose at least one service and one care need.';
    if (step === 4 && !form.termsAccepted) return 'Accept the provider terms to submit your registration.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const issue = validateStep();
    if (issue) { setStatus({ type: 'error', message: issue }); return; }
    if (step < steps.length - 1) { setStatus({ type: '', message: '' }); setStep((current) => current + 1); return; }
    setSubmitting(true);
    setStatus({ type: '', message: '' });
    try {
      const normalizedOfficePostcode = normalizePostcode(form.mainOfficePostcode);
      if (!normalizedOfficePostcode) throw new Error('We could not recognize that postcode format. Enter a full UK postcode, for example SW1A 1AA.');
      const postcodeResponse = await fetch(`/api/locations/postcode/${encodeURIComponent(normalizedOfficePostcode)}`);
      const postcodePayload = await postcodeResponse.json();
      if (!postcodeResponse.ok && postcodeResponse.status !== 503) throw new Error(postcodePayload.error || 'The postcode was not found. Check it and try again.');
      const base = postcodePayload.location || { postcode: normalizedOfficePostcode, areaName: '', latitude: null, longitude: null };
      const profileData = {
        business: { contactName: form.name, providerName: form.businessName, phone: form.phone, legalName: form.legalBusinessName, type: form.businessType, website: form.website, address: form.address, mainOfficePostcode: base.postcode, companiesHouseNumber: form.companiesHouseNumber },
        registration: { nation: form.nation, isRegistered: form.nation === 'England' ? form.cqcRegistered === 'yes' : form.otherRegistered === 'yes', cqcRegistered: form.nation === 'England' && form.cqcRegistered === 'yes', cqcRegistration: form.nation === 'England' ? form.cqcRegistration : '', registrationDetails: form.nation === 'England' ? form.cqcRegistration : form.otherRegistration, locationIds: (form.nation === 'England' ? form.cqcLocationIds : form.otherLocationIds).split(',').map((item) => item.trim()).filter(Boolean), cqcLocationIds: form.cqcLocationIds.split(',').map((item) => item.trim()).filter(Boolean), registeredManager: form.registeredManager, regulatedActivities: (form.nation === 'England' ? form.regulatedActivities : form.otherActivities).split(',').map((item) => item.trim()).filter(Boolean), regulator: ({ England: 'CQC', Wales: 'Care Inspectorate Wales', Scotland: 'Care Inspectorate Scotland', 'Northern Ireland': 'RQIA' })[form.nation], verificationSource: 'Self-declared; pending manual verification' },
        coverage: { basePostcode: base.postcode, baseCoordinates: { latitude: base.latitude, longitude: base.longitude }, baseArea: base.areaName, radiusMiles: form.radiusMiles === 'custom' ? Number(form.customRadiusMiles) : Number(form.radiusMiles) || 0, locations: form.locations, exclusions: form.excludedLocations },
        services: form.services, careNeeds: form.careNeeds, serviceDescription: form.serviceDescription, specialisms: form.specialisms.split(',').map((item) => item.trim()).filter(Boolean),
        minimumPackage: form.minimumPackage, minimumVisit: form.minimumVisit, indicativePrice: form.indicativePrice, availability: { acceptingReferrals: form.acceptingReferrals, capacity: Number(form.capacity) || 0, earliestDate: form.earliestDate },
        compliance: { insurance: { publicLiabilityExpiry: form.publicLiabilityExpiry, employersLiabilityExpiry: form.employersLiabilityExpiry, indemnityExpiry: form.indemnityExpiry }, policies: { safeguarding: form.safeguardingPolicy, complaints: form.complaintsProcedure, medication: form.medicationPolicy, infectionControl: form.infectionPolicy }, documentReviewStatus: 'not_submitted' },
        consent: { providerTermsAccepted: true, acceptedAt: new Date().toISOString() },
      };
      const response = await fetch('/api/providers/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, businessName: form.businessName, email: form.email, phone: form.phone, cqcRegistration: form.cqcRegistration, serviceType: form.services[0] || '', area: base.areaName || base.postcode, password: form.password, termsAccepted: form.termsAccepted, profileData }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.details ? `${payload.error} ${payload.details}` : (payload.error || 'Provider registration failed.'));

      const loginResponse = await fetch('/api/providers/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, password: form.password }) });
      const loginPayload = await loginResponse.json();
      if (!loginResponse.ok) throw new Error(loginPayload.error || 'Automatic provider login failed.');
      const session = { ...loginPayload.provider, token: loginPayload.token };
      setProviderSession?.(session);
      localStorage.setItem(AUTH_KEYS.provider, JSON.stringify(session));
      onOpenProviderDashboard?.();
      if (setDashboardLeads) {
        const dashboardResponse = await fetch(`/api/provider/dashboard/${loginPayload.provider.id}`, { headers: { Authorization: `Bearer ${loginPayload.token}` } });
        const dashboardPayload = await dashboardResponse.json();
        if (dashboardResponse.ok) setDashboardLeads(dashboardPayload.dashboard.leads || []);
      }
      setStatus({ type: 'success', message: 'Registration received. Your account is pending review; referrals stay restricted until approval.' });
    } catch (error) { setStatus({ type: 'error', message: error.message || 'Something went wrong.' }); }
    finally { setSubmitting(false); }
  };

  const input = (name, label, type = 'text', required = false) => <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>{label}{required && ' *'}<input className="finput" name={name} type={type} value={form[name]} onChange={update} required={required} autoComplete={type === 'password' ? 'new-password' : 'off'} /></label>;
  const select = (name, label, options) => <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>{label}<select className="finput" name={name} value={form[name]} onChange={update}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
  const toggle = (name, text) => <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#33445b', marginBottom: 8 }}><input type="checkbox" checked={form[name]} onChange={update} name={name} />{text}</label>;

  return <form className="provider-form-wrap" onSubmit={handleSubmit} autoComplete="off">
    <div style={{ marginBottom: 18 }}><div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>{steps.map((label, index) => <span key={label} style={{ height: 5, flex: 1, borderRadius: 8, background: index <= step ? '#28A745' : '#e4ecf6' }} />)}</div><strong style={{ color: '#0B1D3A' }}>Step {step + 1} of {steps.length}: {steps[step]}</strong></div>
    {step === 0 && <div className="provider-form-grid">
      {input('name', 'Contact person full name', 'text', true)}{input('businessName', 'Provider/business name', 'text', true)}{input('legalBusinessName', 'Legal business name (if different)')}
      {select('businessType', 'Business type', [['', 'Select business type'], ['limited_company', 'Limited company'], ['sole_trader', 'Sole trader'], ['partnership', 'Partnership'], ['charity', 'Charity'], ['other', 'Other']])}
      {input('email', 'Business email address', 'email', true)}{input('phone', 'Business phone number', 'tel', true)}{input('website', 'Website (optional)', 'url')}
      {input('address', 'Registered business address', 'text', true)}{input('mainOfficePostcode', 'Main office postcode', 'text', true)}{input('companiesHouseNumber', 'Companies House number (where applicable)')}
      {input('password', 'Password (10+ characters)', 'password', true)}{input('confirmPassword', 'Confirm password', 'password', true)}
    </div>}
    {step === 1 && <div style={{ display: 'grid', gap: 10 }}>
      {select('nation', 'Nation where services are delivered', [['England', 'England'], ['Wales', 'Wales'], ['Scotland', 'Scotland'], ['Northern Ireland', 'Northern Ireland']])}
      {form.nation === 'England' ? <>
        {select('cqcRegistered', 'Registered with CQC?', [['no', 'No / not applicable to this service'], ['yes', 'Yes']])}
        {form.cqcRegistered === 'yes' && <div className="provider-form-grid">{input('cqcRegistration', 'CQC provider registration details', 'text', true)}{input('cqcLocationIds', 'CQC location ID(s), comma separated')}{input('registeredManager', 'Registered manager details')}{input('regulatedActivities', 'Regulated activities, comma separated')}</div>}
      </> : <>
        {select('otherRegistered', 'Registered with the applicable care regulator?', [['no', 'No / not applicable to this service'], ['yes', 'Yes']])}
        {form.otherRegistered === 'yes' && <div className="provider-form-grid">{input('otherRegistration', 'Regulator registration details', 'text', true)}{input('otherLocationIds', 'Registration location ID(s), comma separated')}{input('registeredManager', 'Registered manager details')}{input('otherActivities', 'Regulated activities, comma separated')}</div>}
      </>}
      <p style={{ color: '#5a6a7e', fontSize: 13, lineHeight: 1.6 }}>Regulator: {({ England: 'CQC', Wales: 'Care Inspectorate Wales', Scotland: 'Care Inspectorate Scotland', 'Northern Ireland': 'RQIA' })[form.nation]}. Details are self-declared and will remain pending review; CQC ratings cannot be entered here or treated as verified.</p>
    </div>}
    {step === 2 && <div style={{ display: 'grid', gap: 12 }}>
      <p style={{ margin: 0, color: '#5a6a7e' }}>Office location is recorded separately. Select the areas you actually serve; nearby areas are never added automatically.</p>
      {select('radiusMiles', 'Travel radius from the main office (optional)', [['', 'No radius'], ['5', '5 miles'], ['10', '10 miles'], ['15', '15 miles'], ['25', '25 miles'], ['50', '50 miles'], ['custom', 'Custom miles']])}
      {form.radiusMiles === 'custom' && input('customRadiusMiles', 'Custom radius in miles', 'number')}
      <label style={{ display: 'flex', gap: 8, color: '#33445b' }}><input type="checkbox" checked={addingExclusion} onChange={(event) => setAddingExclusion(event.target.checked)} />Add searched places as locations I cannot serve</label>
      <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>Search towns, cities and localities<input className="finput" name="locationSearch" value={form.locationSearch} onChange={update} placeholder="Start typing a place" />{locationBusy && <small>Searching UK place data…</small>}</label>
      {visibleSuggestions.length > 0 && <div style={{ display: 'grid', gap: 4 }}>{visibleSuggestions.map((item) => <button type="button" key={item.id} onClick={() => addPlace(item)} style={{ textAlign: 'left', border: '1px solid #dfeaf8', borderRadius: 8, padding: 8, background: '#fff', cursor: 'pointer' }}>{item.name}</button>)}</div>}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{form.locations.map((item) => <span key={item.id} style={{ background: '#eafaf1', padding: '6px 9px', borderRadius: 20 }}>{item.name}<button type="button" aria-label={`Remove ${item.name}`} onClick={() => updateList('locations', form.locations.filter((location) => location.id !== item.id))} style={{ border: 0, background: 'transparent', marginLeft: 6, cursor: 'pointer' }}>×</button></span>)}</div>
      {form.excludedLocations.length > 0 && <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{form.excludedLocations.map((item) => <span key={item.id} style={{ background: '#fff1f2', padding: '6px 9px', borderRadius: 20 }}>{item.name} (excluded)<button type="button" aria-label={`Remove excluded ${item.name}`} onClick={() => updateList('excludedLocations', form.excludedLocations.filter((location) => location.id !== item.id))} style={{ border: 0, background: 'transparent', marginLeft: 6, cursor: 'pointer' }}>×</button></span>)}</div>}
      <div style={{ display: 'flex', gap: 8 }}>{input('explicitPostcode', 'Add a full postcode')}<button type="button" className="btn btn-ghost-green" onClick={addPostcode} style={{ alignSelf: 'end', width: 'auto', padding: '10px 14px' }}>Add postcode</button></div>
      <p style={{ margin: 0, color: '#5a6a7e', fontSize: 12 }}>Postcodes are checked with Postcodes.io; place choices use its UK place search. Custom radius is not available until you select one of the listed distances.</p>
    </div>}
    {step === 3 && <div style={{ display: 'grid', gap: 10 }}>
      <CheckList title="Services offered" options={services} selected={form.services} onChange={(items) => updateList('services', items)} />
      <CheckList title="Client groups and care needs supported" options={careNeeds} selected={form.careNeeds} onChange={(items) => updateList('careNeeds', items)} />
      <textarea className="finput" name="serviceDescription" rows="3" value={form.serviceDescription} onChange={update} placeholder="Service description" />
      <textarea className="finput" name="specialisms" rows="2" value={form.specialisms} onChange={update} placeholder="Specialisms (comma separated)" />
      <div className="provider-form-grid">{input('minimumPackage', 'Minimum care package/hours')}{input('minimumVisit', 'Minimum visit duration')}{input('indicativePrice', 'Indicative pricing (optional)')}{input('capacity', 'New client capacity', 'number')}{input('earliestDate', 'Earliest referral date', 'date')}</div>
      {toggle('acceptingReferrals', 'Currently accepting referrals')}
    </div>}
    {step === 4 && <div style={{ display: 'grid', gap: 8 }}>
      <p style={{ margin: 0, color: '#5a6a7e' }}>These declarations are self-reported until reviewed by an administrator. Uploads can be added from the dashboard once private document storage is configured.</p>
      <div className="provider-form-grid">{input('publicLiabilityExpiry', 'Public liability expiry', 'date')}{input('employersLiabilityExpiry', 'Employers liability expiry (where applicable)', 'date')}{input('indemnityExpiry', 'Professional indemnity expiry (where applicable)', 'date')}</div>
      {toggle('safeguardingPolicy', 'Safeguarding policy is available')}{toggle('complaintsProcedure', 'Complaints procedure is available')}{toggle('medicationPolicy', 'Medication policy is available where relevant')}{toggle('infectionPolicy', 'Infection prevention policy is available where relevant')}
      <details style={{ margin: '8px 0', padding: 12, border: '1px solid #dfeaf8', borderRadius: 10, background: '#f9fbff', color: '#0B1D3A', fontSize: 13 }}><summary style={{ cursor: 'pointer', fontWeight: 800 }}>Provider Terms and Conditions</summary><p>Information is self-declared unless marked as checked by an administrator. 3CS platform verification is not regulatory approval. Registration does not guarantee enquiries or placements.</p></details>
      {toggle('termsAccepted', 'I confirm the details are accurate and accept the Provider Terms and Conditions.')}
    </div>}
    {status.message && <div role="status" style={{ margin: '12px 0', fontSize: 13, color: status.type === 'error' ? '#b42318' : '#1e7d3d' }}>{status.message}</div>}
    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
      {step > 0 && <button type="button" className="btn btn-ghost-green" onClick={() => { setStatus({ type: '', message: '' }); setStep((current) => current - 1); }} style={{ flex: 1, padding: 13 }}>Back</button>}
      <button className="btn btn-green" type="submit" disabled={submitting} style={{ flex: 2, padding: 13 }}>{submitting ? 'Submitting…' : step === steps.length - 1 ? 'Submit registration for review' : 'Continue'}</button>
    </div>
  </form>;
}

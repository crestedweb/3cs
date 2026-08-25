import { useState } from 'react';
import { AUTH_KEYS } from '../data/siteData';

export default function ProviderSignupForm({ setProviderSession, onOpenProviderDashboard, setDashboardLeads }) {
  const [form, setForm] = useState({
    name: '',
    business: '',
    email: '',
    phone: '',
    cqc: '',
    service: '',
    area: '',
    password: '',
    confirmPassword: '',
    message: '',
    website: '',
    cqcRating: '',
    liveInCare: '',
    overnightCare: '',
    twentyFourHourCare: '',
    minimumPackage: '',
    capacity: '',
    specialisms: '',
    termsAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.business || !form.email || !form.service || !form.area) {
      setStatus({ type: 'error', message: 'Please complete your name, business name, email, service type, and service area.' });
      return;
    }

    if (!form.password || form.password.length < 6) {
      setStatus({ type: 'error', message: 'Create a password with at least 6 characters.' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    if (!form.termsAccepted) {
      setStatus({ type: 'error', message: 'Please read and accept the Provider Terms and Conditions before registering.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('/api/providers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          businessName: form.business,
          email: form.email,
          phone: form.phone,
          cqcRegistration: form.cqc,
          serviceType: form.service,
          area: form.area,
          password: form.password,
          message: `Website: ${form.website}; CQC rating/status: ${form.cqcRating}; Live-in care: ${form.liveInCare}; Overnight care: ${form.overnightCare}; 24-hour care: ${form.twentyFourHourCare}; Minimum package: ${form.minimumPackage}; Current capacity: ${form.capacity}; Specialisms: ${form.specialisms}; ${form.message}`,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Provider registration failed.');
      }

      const loginResponse = await fetch('/api/providers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const loginPayload = await loginResponse.json();
      if (!loginResponse.ok) {
        throw new Error(loginPayload.error || 'Automatic provider login failed.');
      }

      const providerSessionData = { ...loginPayload.provider, token: loginPayload.token };
      if ((providerSessionData.reviewCount ?? 0) <= 0) {
        delete providerSessionData.rating;
      }
      if (setProviderSession) {
        setProviderSession(providerSessionData);
      }
      localStorage.setItem(AUTH_KEYS.provider, JSON.stringify(providerSessionData));

      if (onOpenProviderDashboard) {
        onOpenProviderDashboard();
      }

      if (setDashboardLeads) {
        const dashboardResponse = await fetch(`/api/provider/dashboard/${loginPayload.provider.id}`, {
          headers: { Authorization: `Bearer ${loginPayload.token}` },
        });
        const dashboardPayload = await dashboardResponse.json();
        if (dashboardResponse.ok) {
          setDashboardLeads(dashboardPayload.dashboard.leads || []);
        }
      }

      setStatus({
        type: 'success',
        message: `Registration successful. You are now logged in as ${loginPayload.provider.businessName}.`,
      });
      setForm({
        name: '',
        business: '',
        email: '',
        phone: '',
        cqc: '',
        service: '',
        area: '',
        password: '',
        confirmPassword: '',
        message: '',
        website: '', cqcRating: '', liveInCare: '', overnightCare: '', twentyFourHourCare: '', minimumPackage: '', capacity: '', specialisms: '', termsAccepted: false,
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="provider-form-wrap" onSubmit={handleSubmit} autoComplete="off">
      <div className="provider-form-grid">
        <input className="finput" name="name" type="text" value={form.name} placeholder="Contact name" onChange={update} autoComplete="off" />
        <input className="finput" name="business" type="text" value={form.business} placeholder="Provider business name" onChange={update} autoComplete="off" />
        <input className="finput" name="email" type="email" value={form.email} placeholder="Email address" onChange={update} autoComplete="off" />
        <input className="finput" name="phone" type="tel" value={form.phone} placeholder="Phone number" onChange={update} autoComplete="off" />
        <input className="finput" name="cqc" type="text" value={form.cqc} placeholder="CQC registration number" onChange={update} autoComplete="off" />
        <input className="finput" name="cqcRating" type="text" value={form.cqcRating} placeholder="CQC rating/status" onChange={update} autoComplete="off" />
        <input className="finput" name="website" type="text" inputMode="url" value={form.website} placeholder="Website (e.g. careprovider.co.uk)" onChange={update} autoComplete="off" autoCapitalize="off" spellCheck={false} />
        <select className="finput" name="service" value={form.service} onChange={update}>
          <option value="" disabled>Select service type</option>
          <option value="Domiciliary care">Domiciliary care</option>
          <option value="Dementia care">Dementia care</option>
          <option value="Live-in care">Live-in care</option>
          <option value="Respite care">Respite care</option>
          <option value="Supported living">Supported living</option>
        </select>
        <input className="finput" name="area" type="text" value={form.area} placeholder="Primary service area" onChange={update} autoComplete="off" />
        <input className="finput" name="minimumPackage" type="text" value={form.minimumPackage} placeholder="Minimum package normally accepted" onChange={update} autoComplete="off" />
        <input className="finput" name="capacity" type="text" value={form.capacity} placeholder="Current capacity" onChange={update} autoComplete="off" />
        <select className="finput" name="liveInCare" value={form.liveInCare} onChange={update}><option value="">Offer live-in care?</option><option>Yes</option><option>No</option></select>
        <select className="finput" name="overnightCare" value={form.overnightCare} onChange={update}><option value="">Offer overnight care?</option><option>Yes</option><option>No</option></select>
        <select className="finput" name="twentyFourHourCare" value={form.twentyFourHourCare} onChange={update}><option value="">Offer 24-hour care?</option><option>Yes</option><option>No</option></select>
        <input className="finput" name="password" type="password" value={form.password} placeholder="Create password" onChange={update} autoComplete="new-password" />
        <input className="finput" name="confirmPassword" type="password" value={form.confirmPassword} placeholder="Confirm password" onChange={update} autoComplete="new-password" />
      </div>
      <textarea className="finput" name="message" rows="4" value={form.message} placeholder="Tell us about your service and care specialisms" onChange={update} />
      <textarea className="finput" name="specialisms" rows="3" value={form.specialisms} placeholder="Any specialisms" onChange={update} />
      <details style={{ margin: '2px 0 14px', padding: '12px 14px', border: '1px solid #dfeaf8', borderRadius: 10, background: '#f9fbff', color: '#0B1D3A', fontSize: '0.82rem', lineHeight: 1.6 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 800 }}>Provider Terms and Conditions</summary>
        <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
          <li>You confirm that the registration information is accurate and that you are authorised to register this service.</li>
          <li>You remain responsible for all applicable registrations, insurance, safeguarding, and regulatory obligations.</li>
          <li>Registration does not guarantee enquiries, placements, or work.</li>
          <li>Referral fees and commercial terms must be agreed before client-identifying information is released.</li>
          <li>You will handle any information received through the service lawfully and confidentially.</li>
        </ul>
      </details>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14, color: '#0B1D3A', fontSize: '0.84rem', lineHeight: 1.5, cursor: 'pointer' }}>
        <input name="termsAccepted" type="checkbox" checked={form.termsAccepted} onChange={update} required style={{ marginTop: 3, accentColor: '#28A745' }} />
        <span>I have read and agree to the Provider Terms and Conditions.</span>
      </label>
      <p style={{ color: '#5a6a7e', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 14 }}>Referral fees are based on the size of the successful care package. Full commercial terms and our current fee schedule are provided during onboarding.</p>
      {status.message && (
        <div style={{ marginBottom: 12, fontSize: '0.9rem', color: status.type === 'error' ? '#d32f2f' : '#1e7d3d' }}>
          {status.message}
        </div>
      )}
      <button className="btn btn-green" type="submit" disabled={submitting} style={{ width: '100%', padding: '15px' }}>
        {submitting ? 'Registering...' : 'Register as provider'}
      </button>
    </form>
  );
}

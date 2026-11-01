import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import ProviderSignupForm from './ProviderSignupForm';

export default function ProviderSignupPage({ onBack, onLogin, setProviderSession, onOpenProviderDashboard, setDashboardLeads }) {
  const location = useLocation();
  const googleSignup = location.state?.googleSignup || null;
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const startGoogleSignup = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const response = await fetch('/api/providers/oauth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'signup' }),
      });
      const payload = await response.json().catch(() => ({ error: 'The server did not return a valid response. Please try again later.' }));
      if (!response.ok) throw new Error(payload.error || 'Google sign-up is unavailable.');
      if (!payload.url) throw new Error('Google sign-up could not be started. Please try again.');
      window.location.assign(payload.url);
    } catch (error) {
      setGoogleError(error.message || 'Google sign-up is unavailable.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="provider-page">
      <header className="provider-site-nav">
        <button className="provider-brand-link" type="button" onClick={onBack} aria-label="3Cs Care Services home">
          <img src={logoImage} alt="" />
          <span><strong>3C<span>s</span></strong><small>Care Services Limited</small></span>
        </button>
        <nav className="provider-nav-actions" aria-label="Provider portal navigation">
          <button type="button" onClick={onBack}>Home</button>
          <button type="button" onClick={onBack}>Find care</button>
          <button className="provider-nav-cta provider-nav-login" type="button" onClick={onLogin}>Provider login</button>
        </nav>
      </header>

      <main className="provider-registration-page">
        <section className="provider-registration-card">
          <div className="provider-registration-heading">
            <div className="provider-eyebrow provider-eyebrow-light">Provider onboarding</div>
            <h1>Grow Your Care Business With Qualified Care Referrals</h1>
            <p>Join the 3CS Care Services Provider Network and receive suitable care opportunities in the areas you cover. There is no registration or joining fee. A one-off introduction fee is due only if a 3CS referral results in a care package being agreed and started.</p>
            <div style={{ margin: '14px 0', padding: '14px 16px', border: '1px solid #dfeaf8', borderRadius: 12, background: '#f9fbff', color: '#34445a', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', color: '#0B1D3A', marginBottom: 6 }}>How referral fees work</strong>
              <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
                <li>Packages below 10 hours per week: £250 one-off introduction fee.</li>
                <li>Packages of 10 hours per week or more: £500 one-off introduction fee.</li>
              </ul>
              <p style={{ margin: '0 0 6px' }}>There are no ongoing weekly commissions or recurring referral charges. For larger live-in, 24-hour or particularly complex packages, the fee will be agreed with you in advance before the referral is made. Referral terms are agreed before client-identifying information is released.</p>
              <small>Fee structure proposed by 3CS; the applicable fee is confirmed with the provider before each referral.</small>
            </div>
            <p>Tell us about your service to create your provider portal and start receiving relevant care enquiries.</p>
          </div>
          <div style={{ margin: '18px 0', padding: 16, border: '1px solid #dfeaf8', borderRadius: 12, background: '#f9fbff', textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', color: '#34445a' }}>Start with Google, then complete the provider details below.</p>
            <button className="btn btn-ghost-green" type="button" onClick={startGoogleSignup} disabled={googleLoading} style={{ width: '100%', background: '#fff' }}>
              {googleLoading ? 'Connecting to Google…' : 'Sign up with Google'}
            </button>
            {googleError && <p role="alert" style={{ color: '#b42318', margin: '10px 0 0' }}>{googleError}</p>}
            {googleSignup?.email && <p role="status" style={{ color: '#1e7d3d', margin: '10px 0 0' }}>Google account verified: {googleSignup.email}</p>}
          </div>
          <ProviderSignupForm
            setProviderSession={setProviderSession}
            onOpenProviderDashboard={onOpenProviderDashboard}
            setDashboardLeads={setDashboardLeads}
            googleSignup={googleSignup}
          />
          <p className="provider-login-prompt">Already have an account? <button type="button" onClick={onLogin}>Log in as a provider</button></p>
        </section>
      </main>
    </div>
  );
}

import { useState } from 'react';
import logoImage from '../assets/logo.png';
import { AUTH_KEYS } from '../data/siteData';

export default function ProviderLoginPage({ onSuccess, onAdminSuccess, onBack, onRegister, setProviderSession, onOpenProviderDashboard, setDashboardLeads }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/providers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        const adminResponse = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const adminPayload = await adminResponse.json();

        if (!adminResponse.ok) {
          throw new Error(payload.error || adminPayload.error || 'Invalid login credentials.');
        }

        const adminSessionData = { ...(adminPayload.admin || adminPayload.user), token: adminPayload.token };
        localStorage.setItem(AUTH_KEYS.admin, JSON.stringify(adminSessionData));
        onAdminSuccess?.(adminSessionData);
        return;
      }

      const providerSessionData = { ...payload.provider, token: payload.token };
      if ((providerSessionData.reviewCount ?? 0) <= 0) {
        delete providerSessionData.rating;
      }
      localStorage.setItem(AUTH_KEYS.provider, JSON.stringify(providerSessionData));
      if (setProviderSession) {
        setProviderSession(providerSessionData);
      }
      if (onSuccess) {
        onSuccess(providerSessionData);
      }
      if (onOpenProviderDashboard) {
        onOpenProviderDashboard();
      }
      if (setDashboardLeads) {
        const dashboardResponse = await fetch(`/api/provider/dashboard/${payload.provider.id}`, {
          headers: { Authorization: `Bearer ${payload.token}` },
        });
        const dashboardPayload = await dashboardResponse.json();
        if (dashboardResponse.ok) {
          setDashboardLeads(dashboardPayload.dashboard.leads || []);
        }
      }
    } catch (err) {
      setError(err.message || 'Provider login failed.');
    } finally {
      setLoading(false);
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
          <button className="provider-nav-cta" type="button" onClick={onRegister}>Join as a provider</button>
        </nav>
      </header>
      <div className="dashboard-shell provider-access-shell" style={{ background: '#f5f7fa' }}>
      <div className="dashboard-inner provider-access-grid" style={{ maxWidth: 1180 }}>
        <div className="provider-hero-panel">
          <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#4cde6e', fontWeight: 800, textTransform: 'uppercase' }}>Professional care portal</div>
          <h2>Join a better care marketplace.</h2>
          <p>
            Help families find trusted care by showcasing your service, responding to relevant enquiries, and growing your care business with confidence.
          </p>

          <div className="provider-benefit-list">
            <div className="provider-benefit">
              <span>✓</span>
              <div>
                <strong>Receive suitable enquiries</strong>
                <small>Connect with families looking for the care you provide.</small>
              </div>
            </div>
            <div className="provider-benefit">
              <span>✓</span>
              <div>
                <strong>Build trust fast</strong>
                <small>Showcase your service area, specialisms, and registration status.</small>
              </div>
            </div>
            <div className="provider-benefit">
              <span>✓</span>
              <div>
                <strong>Operate from one dashboard</strong>
                <small>Manage leads, service updates, and provider activity in one place.</small>
              </div>
            </div>
          </div>

          <div className="provider-metric-grid">
            <div className="provider-metric">
              <strong>500+</strong>
              <span>Families guided</span>
            </div>
            <div className="provider-metric">
              <strong>5</strong>
              <span>Care specialisms</span>
            </div>
            <div className="provider-metric">
              <strong>24/7</strong>
              <span>Lead alerts</span>
            </div>
            <div className="provider-metric">
              <strong>CQC</strong>
              <span>Ready</span>
            </div>
          </div>
        </div>

        <div className="provider-auth-card">
          <div className="provider-auth-header">
            <div>
              <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#28A745', fontWeight: 800, textTransform: 'uppercase' }}>Secure access</div>
              <h3>Log in to your account</h3>
            </div>
            {onBack && (
              <button className="btn btn-ghost-green" onClick={onBack} style={{ width: 'auto', padding: '10px 16px', fontSize: '0.82rem' }}>Back</button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="provider-login-form" autoComplete="off">
            <input className="finput" name="email" type="email" value={form.email} onChange={update} placeholder="Email address" autoComplete="off" />
            <input className="finput" name="password" type="password" value={form.password} onChange={update} placeholder="Password" autoComplete="new-password" />
            {error && <div className="provider-error" style={{ color: '#d32f2f' }}>{error}</div>}
            <button className="btn btn-green" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="provider-auth-divider">or</div>

          <div className="provider-cta-card">
            <h4>New to 3Cs?</h4>
            <p>Register your service and start receiving qualified enquiries from families seeking care.</p>
            <button
              className="btn btn-ghost-green"
              type="button"
              style={{ width: '100%' }}
              onClick={onRegister}
            >
              Register as provider
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

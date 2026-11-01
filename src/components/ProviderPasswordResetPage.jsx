import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import logoImage from '../assets/logo.png';

export default function ProviderPasswordResetPage({ onBack, onLogin }) {
  const location = useLocation();
  const params = new URLSearchParams(location.hash.slice(1));
  const accessToken = params.get('access_token') || '';
  const refreshToken = params.get('refresh_token') || '';
  const recovery = {
    accessToken,
    refreshToken,
    error: params.get('type') === 'recovery' && accessToken && refreshToken
      ? ''
      : 'This password reset link is invalid or expired. Request a new link and try again.',
  };
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 10) {
      setStatus({ type: 'error', message: 'Use a password with at least 10 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await fetch('/api/providers/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: recovery.accessToken,
          refreshToken: recovery.refreshToken,
          password,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to update your password.');
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
      setStatus({ type: 'success', message: payload.message || 'Your password has been updated. You can now log in.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to update your password.' });
    } finally {
      setSubmitting(false);
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
          <button className="provider-nav-cta" type="button" onClick={onLogin}>Provider login</button>
        </nav>
      </header>
      <main className="dashboard-shell provider-access-shell" style={{ background: '#f5f7fa' }}>
        <section className="provider-auth-card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="provider-auth-header">
            <div>
              <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#28A745', fontWeight: 800, textTransform: 'uppercase' }}>Secure access</div>
              <h1 style={{ fontSize: '1.4rem', margin: '8px 0' }}>Set a new password</h1>
              <p style={{ color: '#5a6a7e', margin: 0 }}>Choose a password with at least 10 characters.</p>
            </div>
          </div>
          {recovery.error && <div className="provider-error" role="alert">{recovery.error}</div>}
          {!recovery.error && status.type !== 'success' && (
            <form onSubmit={handleSubmit} className="provider-login-form" autoComplete="on">
              <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>
                New password
                <input className="finput" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={10} />
              </label>
              <label style={{ display: 'grid', gap: 5, color: '#33445b', fontSize: 13 }}>
                Confirm new password
                <input className="finput" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={10} />
              </label>
              {status.type === 'error' && <div className="provider-error" role="alert">{status.message}</div>}
              <button className="btn btn-green" type="submit" disabled={submitting} style={{ width: '100%' }}>
                {submitting ? 'Updating password…' : 'Update password'}
              </button>
            </form>
          )}
          {status.type === 'success' && <div role="status" style={{ color: '#1e7d3d', marginTop: 16 }}>{status.message}</div>}
          {(recovery.error || status.type === 'success') && (
            <button className="btn btn-green" type="button" onClick={onLogin} style={{ width: '100%', marginTop: 16 }}>
              Back to provider login
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

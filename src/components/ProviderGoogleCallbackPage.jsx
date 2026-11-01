import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AUTH_KEYS } from '../data/siteData';

export default function ProviderGoogleCallbackPage({ onSuccess, setProviderSession, onOpenProviderDashboard, setDashboardLeads, onBack }) {
  const location = useLocation();
  const params = new URLSearchParams(location.hash.slice(1));
  const accessToken = params.get('access_token') || '';
  const oauthError = params.get('error_description') || params.get('error') || '';
  const started = useRef(false);
  const [status, setStatus] = useState(() => accessToken
    ? { type: 'loading', message: 'Signing you in with Google…' }
    : { type: 'error', message: oauthError || 'Google sign-in did not complete. Please try again.' });

  useEffect(() => {
    if (started.current || !accessToken) return;
    started.current = true;
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);

    const completeSignIn = async () => {
      try {
        const response = await fetch('/api/providers/oauth/google/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });
        const payload = await response.json().catch(() => ({ error: 'The server did not return a valid response. Please try again.' }));
        if (!response.ok) throw new Error(payload.error || 'Google sign-in failed.');

        const providerSession = { ...payload.provider, token: payload.token };
        if ((providerSession.reviewCount ?? 0) <= 0) delete providerSession.rating;
        localStorage.setItem(AUTH_KEYS.provider, JSON.stringify(providerSession));
        if (setProviderSession) setProviderSession(providerSession);
        if (setDashboardLeads) {
          const dashboardResponse = await fetch(`/api/provider/dashboard/${payload.provider.id}`, {
            headers: { Authorization: `Bearer ${payload.token}` },
          });
          const dashboardPayload = await dashboardResponse.json().catch(() => ({}));
          if (dashboardResponse.ok) setDashboardLeads(dashboardPayload.dashboard?.leads || []);
        }
        setStatus({ type: 'success', message: 'Google sign-in successful. Opening your provider dashboard…' });
        if (onSuccess) onSuccess(providerSession);
        else onOpenProviderDashboard?.();
      } catch (error) {
        setStatus({ type: 'error', message: error.message || 'Google sign-in failed. Please try again.' });
      }
    };

    void completeSignIn();
  }, [accessToken, onOpenProviderDashboard, onSuccess, setDashboardLeads, setProviderSession]);

  return (
    <main className="dashboard-shell provider-access-shell" style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <section className="provider-auth-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="provider-auth-header">
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#28A745', fontWeight: 800, textTransform: 'uppercase' }}>Secure access</div>
            <h1 style={{ fontSize: '1.4rem', margin: '8px 0' }}>Google sign-in</h1>
          </div>
        </div>
        <p role={status.type === 'error' ? 'alert' : 'status'} style={{ color: status.type === 'error' ? '#b42318' : '#5a6a7e' }}>
          {status.message}
        </p>
        {status.type === 'error' && (
          <button className="btn btn-green" type="button" onClick={onBack} style={{ width: '100%' }}>
            Back to provider login
          </button>
        )}
      </section>
    </main>
  );
}

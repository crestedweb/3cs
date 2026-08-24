import { useState } from 'react';
import { AUTH_KEYS } from '../data/siteData';

export default function AdminLoginPage({ onSuccess, onBack }) {
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
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Admin login failed.');
      }

      const session = {
        name: payload.admin?.name || '3Cs Care Admin',
        email: payload.admin?.email || form.email,
        role: payload.admin?.role || 'Operations admin',
        token: payload.token,
      };
      localStorage.setItem(AUTH_KEYS.admin, JSON.stringify(session));
      onSuccess(session);
    } catch (err) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-shell" style={{ background: '#f5f7fa' }}>
      <div className="dashboard-inner" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#28A745', fontWeight: 800, textTransform: 'uppercase' }}>Admin access</div>
            <h2 style={{ margin: '8px 0 0', color: '#0B1D3A', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Secure admin login</h2>
          </div>
          {onBack && (
            <button className="btn btn-ghost-green" onClick={onBack} style={{ width: 'auto', padding: '10px 16px', fontSize: '0.82rem' }}>Back</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="provider-login-form" autoComplete="off" style={{ background: '#fff', border: '1px solid #e8edf4', borderRadius: 18, padding: 20 }}>
          <input className="finput" name="email" type="email" value={form.email} onChange={update} placeholder="Admin email" autoComplete="off" />
          <input className="finput" name="password" type="password" value={form.password} onChange={update} placeholder="Password" autoComplete="new-password" />
          {error && <div className="provider-error" style={{ color: '#d32f2f' }}>{error}</div>}
          <button className="btn btn-green" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Log in as admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

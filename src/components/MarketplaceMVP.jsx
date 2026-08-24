import { useEffect, useState } from 'react';
import ProviderSignupForm from './ProviderSignupForm';
import { AUTH_KEYS } from '../data/siteData';

export default function MarketplaceMVP({ providerSession, setProviderSession, onOpenProviderDashboard, adminSession, setAdminSession, onOpenAdminDashboard }) {
  const [filter, setFilter] = useState('All');
  const [providerLogin, setProviderLogin] = useState({ email: '', password: '' });
  const [adminLogin, setAdminLogin] = useState({ email: '', password: '' });
  const [providerError, setProviderError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [providerSummary, setProviderSummary] = useState({ totalProviders: 0, activeProviders: 0, totalLeads: 0, newLeads: 0, qualifiedLeads: 0, bookedLeads: 0, averageRating: '0.0' });
  const [dashboardLeads, setDashboardLeads] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/marketplace/summary');
        const payload = await response.json();
        if (response.ok && payload.summary) {
          setProviderSummary(payload.summary);
        }
      } catch (error) {
        console.error('Summary fetch failed', error);
      }
    };

    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/leads');
        const payload = await response.json();
        if (response.ok && Array.isArray(payload.leads)) {
          const nextLeads = payload.leads.map((lead) => ({ ...lead, status: lead.status || 'New' }));
          if (!providerSession) {
            setDashboardLeads(nextLeads.slice(0, 4));
          }
        }
      } catch (error) {
        console.error('Lead fetch failed', error);
      }
    };

    fetchLeads();
  }, [providerSession]);

  const filteredLeads = filter === 'All' ? dashboardLeads : dashboardLeads.filter((lead) => lead.status === filter);

  const handleProviderLogin = async (event) => {
    event.preventDefault();
    setProviderError('');

    try {
      const response = await fetch('/api/providers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerLogin),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Provider login failed.');
      }

      const providerSessionData = { ...payload.provider, token: payload.token };
      setProviderSession(providerSessionData);
      localStorage.setItem(AUTH_KEYS.provider, JSON.stringify(providerSessionData));
      onOpenProviderDashboard();

      const dashboardResponse = await fetch(`/api/provider/dashboard/${payload.provider.id}`, {
        headers: { Authorization: `Bearer ${payload.token}` },
      });
      const dashboardPayload = await dashboardResponse.json();
      if (dashboardResponse.ok) {
        setDashboardLeads(dashboardPayload.dashboard.leads || []);
      }
    } catch (error) {
      setProviderError(error.message || 'Provider login failed.');
    }
  };

  const handleProviderInput = (event) => {
    const { name, value } = event.target;
    setProviderLogin((current) => ({ ...current, [name]: value }));
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAdminError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminLogin),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Admin login failed.');
      }

      const adminSessionData = {
        name: payload.admin?.name || '3Cs Care Admin',
        role: payload.admin?.role || 'Operations admin',
        email: payload.admin?.email || adminLogin.email,
        token: payload.token,
      };

      setAdminSession(adminSessionData);
      localStorage.setItem(AUTH_KEYS.admin, JSON.stringify(adminSessionData));
      onOpenAdminDashboard();
    } catch (error) {
      setAdminError(error.message || 'Invalid admin credentials.');
    }
  };

  const handleAdminInput = (event) => {
    const { name, value } = event.target;
    setAdminLogin((current) => ({ ...current, [name]: value }));
  };

  return (
    <section id="marketplace" className="sec" style={{ background: '#f7fafc' }}>
      <div className="sec-wide">
        <div className="text-center" style={{ marginBottom: 36 }}>
          <span className="label">MARKETPLACE MVP</span>
          <h2 className="sec-h2">Care marketplace operations in one view</h2>
        </div>

        <div className="marketplace-grid">
          <div className="market-card market-hero">
            <div className="market-card-header">
              <span className="mini-pill">Provider onboarding</span>
              <h3>Build the provider network</h3>
            </div>
            <ProviderSignupForm
              setProviderSession={setProviderSession}
              onOpenProviderDashboard={onOpenProviderDashboard}
              setDashboardLeads={setDashboardLeads}
            />
          </div>

          <div className="market-card provider-login-panel">
            <div className="market-card-header">
              <span className="mini-pill">Provider portal</span>
              <h3>{providerSession ? 'Provider dashboard' : 'Secure provider login'}</h3>
            </div>

            {!providerSession ? (
              <form onSubmit={handleProviderLogin} className="provider-login-form" autoComplete="off">
                <input className="finput" name="email" type="email" value={providerLogin.email} onChange={handleProviderInput} placeholder="Provider email" autoComplete="off" />
                <input className="finput" name="password" type="password" value={providerLogin.password} onChange={handleProviderInput} placeholder="Password" autoComplete="new-password" />
                {providerError && <div className="provider-error">{providerError}</div>}
                <button className="btn btn-green" type="submit" style={{ width: '100%', padding: '15px' }}>Log in</button>
              </form>
            ) : (
              <div className="provider-dashboard-shell">
                <div className="provider-profile-card">
                  <div className="provider-avatar">{providerSession.businessName?.slice(0, 2).toUpperCase() || 'PC'}</div>
                  <div>
                    <strong>{providerSession.businessName}</strong>
                    <small>{providerSession.area}</small>
                  </div>
                </div>

                <div style={{ color: '#dfe8f4', lineHeight: 1.7 }}>
                  You are logged in as a provider. Open your dashboard to view leads and enquiries.
                </div>

                <button className="btn btn-green" type="button" onClick={onOpenProviderDashboard} style={{ width: '100%', padding: '15px' }}>Open provider dashboard</button>
              </div>
            )}
          </div>

          <div className="market-card provider-login-panel">
            <div className="market-card-header">
              <span className="mini-pill">Admin portal</span>
              <h3>{adminSession ? 'Admin dashboard' : 'Secure admin login'}</h3>
            </div>

            {!adminSession ? (
              <form onSubmit={handleAdminLogin} className="provider-login-form" autoComplete="off">
                <input className="finput" name="email" type="email" value={adminLogin.email} onChange={handleAdminInput} placeholder="Admin email" autoComplete="off" />
                <input className="finput" name="password" type="password" value={adminLogin.password} onChange={handleAdminInput} placeholder="Password" autoComplete="new-password" />
                {adminError && <div className="provider-error">{adminError}</div>}
                <button className="btn btn-green" type="submit" style={{ width: '100%', padding: '15px' }}>Log in as admin</button>
              </form>
            ) : (
              <div className="provider-dashboard-shell">
                <div className="provider-profile-card">
                  <div className="provider-avatar">AD</div>
                  <div>
                    <strong>{adminSession.name}</strong>
                    <small>{adminSession.role}</small>
                  </div>
                </div>

                <div style={{ color: '#dfe8f4', lineHeight: 1.7 }}>
                  You are logged in as admin. Open the admin dashboard to manage leads and provider activity.
                </div>

                <button className="btn btn-green" type="button" onClick={onOpenAdminDashboard} style={{ width: '100%', padding: '15px' }}>Open admin dashboard</button>
              </div>
            )}
          </div>
        </div>

        <div className="marketplace-grid second-row" style={{ marginTop: 24 }}>
          <div className="market-card">
            <div className="market-card-header">
              <span className="mini-pill">Lead management</span>
              <h3>Qualified enquiries</h3>
            </div>
            <div className="lead-controls">
              {['All', 'New', 'Qualified', 'Replied', 'Booked'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-chip${filter === status ? ' active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="lead-table-wrap">
              <table className="lead-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Need</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div className="lead-name">{lead.family}</div>
                        <small>{lead.area}</small>
                      </td>
                      <td>{lead.need}</td>
                      <td>{lead.provider}</td>
                      <td>
                        <span className={`lead-status ${lead.status.toLowerCase()}`}>{lead.status}</span>
                      </td>
                      <td><strong>{lead.score || 90}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="market-card">
            <div className="market-card-header">
              <span className="mini-pill">Matching flow</span>
              <h3>How the marketplace works</h3>
            </div>
            <div className="matching-steps">
              <div className="match-step">
                <span>1</span>
                <div>
                  <strong>Capture the family need</strong>
                  <p>Location, budget, urgency, and care type are recorded in one enquiry.</p>
                </div>
              </div>
              <div className="match-step">
                <span>2</span>
                <div>
                  <strong>Match to suitable providers</strong>
                  <p>We shortlist providers by service area, qualification, and care specialism.</p>
                </div>
              </div>
              <div className="match-step">
                <span>3</span>
                <div>
                  <strong>Provider responds</strong>
                  <p>Providers review the request and respond directly to begin the assessment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

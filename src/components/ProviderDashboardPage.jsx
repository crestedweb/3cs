import { Navigate } from 'react-router-dom';

export default function ProviderDashboardPage({ providerSession, onBack, onLogout }) {
  if (!providerSession) {
    return <Navigate to="/" replace />;
  }

  const providerName = providerSession?.businessName || 'Provider portal';
  const serviceArea = providerSession?.area || 'Your area';
  const careTypes = providerSession?.serviceType || 'Domiciliary care';
  const responseTarget = providerSession?.responseTarget || 'Under 30 minutes';
  const currentCapacity = providerSession?.capacity || 'Open for new enquiries';
  const verificationStatus = providerSession?.verificationStatus || 'CQC registered and approved';
  const nextReview = providerSession?.nextReview || 'Today at 3:00 PM';
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
        @media (max-width: 768px) {
          .provider-dashboard-shell {
            padding: 12px !important;
          }
          .provider-dashboard-shell .provider-dashboard-main {
            grid-template-columns: 1fr !important;
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
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', borderRadius: 20, boxShadow: '0 16px 40px rgba(11,29,58,0.08)', padding: 18 }}>
        <div className="provider-dashboard-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#28A745', fontWeight: 800, textTransform: 'uppercase' }}>Provider dashboard</div>
            <h2 style={{ margin: '8px 0 0', color: '#0B1D3A', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>{providerName}</h2>
          </div>
          <div className="provider-dashboard-topbar-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost-green" onClick={onBack} style={{ width: 'auto', padding: '10px 16px', fontSize: '0.82rem' }}>Back to site</button>
            {onLogout && (
              <button className="btn btn-navy" onClick={onLogout} style={{ width: 'auto', padding: '10px 16px', fontSize: '0.82rem' }}>Log out</button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ background: stat.label === 'Rating' ? '#eaf7ff' : stat.label === 'Booked' ? '#f2f6fb' : stat.label === 'Qualified' ? '#eefaf2' : '#0B1D3A', color: stat.label === 'Rating' || stat.label === 'Booked' || stat.label === 'Qualified' ? '#0B1D3A' : '#fff', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{stat.label}</div>
              <div style={{ fontSize: stat.label === 'Rating' && stat.value === 'No rating yet' ? 16 : 28, fontWeight: 800, marginTop: 6 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="provider-dashboard-main" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
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
                  <span style={{ background: '#eafaf1', color: '#0B1D3A', borderRadius: 999, padding: '6px 10px', fontWeight: 700, fontSize: 11 }}>Live</span>
                </div>
              ))}
            </div>
          </div>

          <div className="provider-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', color: '#0B1D3A', fontSize: '1.1rem' }}>Provider profile</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #0B1D3A, #28A745)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>{providerName.slice(0, 2).toUpperCase() || 'PC'}</div>
              <div>
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
        </div>
      </div>
    </div>
  );
}

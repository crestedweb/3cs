import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

export default function AdminDashboardPage({ adminSession, onBack, onLogout }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  if (!adminSession) {
    return <Navigate to="/" replace />;
  }

  const adminTitle = '3Cs Care Admin';

  const [summary, setSummary] = useState({
    totalLeads: 0,
    providers: 0,
    activeProviders: 0,
    pendingProviders: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    bookedLeads: 0,
  });
  const [overview, setOverview] = useState([
    ['New enquiries', '0'],
    ['Pending provider responses', '0'],
    ['Qualified matches', '0'],
    ['Booked', '0'],
  ]);
  const [providers, setProviders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('All');
  const [providerSearch, setProviderSearch] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [providerMatches, setProviderMatches] = useState([]);
  const [matchesForLeadId, setMatchesForLeadId] = useState('');
  const [expandedRecentLeadId, setExpandedRecentLeadId] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get('view');
    return ['overview', 'recent-leads', 'providers', 'leads', 'bookings', 'reports', 'enquiry'].includes(current) ? current : 'overview';
  });

  const updateView = (nextView, nextLeadId = null) => {
    setCurrentView(nextView);
    const params = new URLSearchParams(location.search || '');
    params.set('view', nextView);
    if (nextLeadId) {
      params.set('leadId', String(nextLeadId));
    } else {
      params.delete('leadId');
    }
    const nextSearch = params.toString();
    navigate({ pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' }, { replace: false });
  };

  const refreshDashboard = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${adminSession?.token || ''}`,
        },
      });
      const payload = await response.json();
      if (response.ok && payload.dashboard) {
        const nextProviders = Array.isArray(payload.dashboard.providers) ? payload.dashboard.providers : [];
        const nextLeads = Array.isArray(payload.dashboard.leads) ? payload.dashboard.leads : [];
        const nextEnquiries = Array.isArray(payload.dashboard.enquiries) ? payload.dashboard.enquiries : [];
        setSummary(payload.dashboard.summary || summary);
        setOverview(payload.dashboard.overview || [
          ['New enquiries', String(payload.dashboard.summary?.newLeads || 0)],
          ['Pending provider responses', String(payload.dashboard.summary?.pendingProviders || 0)],
          ['Qualified matches', String(payload.dashboard.summary?.qualifiedLeads || 0)],
          ['Booked', String(payload.dashboard.summary?.bookedLeads || 0)],
        ]);
        setProviders(nextProviders);
        // Only show records returned by the API. A locally cached submission can
        // have an ID the server cannot update, which makes editable controls
        // appear to reset after every selection.
        setLeads(nextLeads);
        setEnquiries(nextEnquiries);
      }
    } catch (error) {
      console.error('Admin dashboard fetch failed', error);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const nextView = ['overview', 'recent-leads', 'providers', 'leads', 'bookings', 'reports', 'enquiry'].includes(params.get('view')) ? params.get('view') : 'overview';
    setCurrentView(nextView);
    const nextLeadId = params.get('leadId');
    if (nextLeadId) {
      setSelectedLeadId(String(nextLeadId));
    }
  }, [location.search]);

  useEffect(() => {
    refreshDashboard();
  }, [adminSession?.token]);

  useEffect(() => {
    const handleLeadUpdate = (event) => {
      if (['3cs:lead-updated', '3cs:enquiry-updated'].includes(event.key) && event.newValue) {
        refreshDashboard();
      }
    };

    window.addEventListener('storage', handleLeadUpdate);
    return () => window.removeEventListener('storage', handleLeadUpdate);
  }, [adminSession?.token]);

  useEffect(() => {
    if (!providers.length) {
      setSelectedProviderId('');
      return;
    }

    if (!selectedProviderId || !providers.some((provider) => String(provider.id) === String(selectedProviderId))) {
      setSelectedProviderId(String(providers[0].id));
    }
  }, [providers, selectedProviderId]);

  const newestLead = [...leads].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
  const newestEnquiry = [...enquiries].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;

  useEffect(() => {
    if (!leads.length) {
      setSelectedLeadId('');
      return;
    }

    if (!selectedLeadId || !leads.some((lead) => String(lead.id) === String(selectedLeadId))) {
      const nextLeadId = newestLead?.id || leads[0].id;
      setSelectedLeadId(String(nextLeadId));
    }
  }, [leads, selectedLeadId, newestLead]);

  const filteredProviders = providers.filter((provider) => {
    const text = `${provider.businessName || provider.name || ''} ${provider.email || ''} ${provider.area || ''}`.toLowerCase();
    return text.includes(providerSearch.toLowerCase());
  });

  const filteredLeads = statusFilter === 'All'
    ? leads
    : leads.filter((lead) => String(lead.status || 'New').toLowerCase() === statusFilter.toLowerCase());

  const selectedProvider = providers.find((provider) => String(provider.id) === String(selectedProviderId)) || providers[0] || null;
  const selectedLead = leads.find((lead) => String(lead.id) === String(selectedLeadId)) || newestLead || null;
  const bookedLeads = leads.filter((lead) => String(lead.status || 'New').toLowerCase() === 'booked');
  const pendingProviders = providers.filter((provider) => String(provider.status || 'pending').toLowerCase() === 'pending');
  const activeProviders = providers.filter((provider) => String(provider.status || 'pending').toLowerCase() === 'active');
  const topServiceAreas = [...new Set(providers.map((provider) => provider.area).filter(Boolean))].slice(0, 3);

  const navItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'enquiry', label: 'Latest Enquiry' },
    { key: 'recent-leads', label: 'Recent leads' },
    { key: 'providers', label: 'Providers' },
    { key: 'leads', label: 'Leads' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'reports', label: 'Reports' },
  ];

  const handleProviderReview = async (provider, accountStatus, verificationStatus) => {
    try {
      const response = await fetch(`/api/admin/providers/${provider.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSession?.token || ''}` },
        body: JSON.stringify({ accountStatus, verificationStatus }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to save provider review.');
      await refreshDashboard();
      setActionFeedback(`${provider.businessName || 'Provider'} review updated: ${verificationStatus.replace('_', ' ')}.`);
    } catch (error) { setActionFeedback(error.message || 'Unable to save provider review.'); }
  };

  const handleProviderDocument = async (provider, document, action) => {
    try {
      if (action === 'open') {
        const response = await fetch(`/api/admin/providers/${provider.id}/documents/${document.id}/url`, { headers: { Authorization: `Bearer ${adminSession?.token || ''}` } });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to open document.');
        window.open(payload.url, '_blank', 'noopener,noreferrer');
        return;
      }
      const response = await fetch(`/api/admin/providers/${provider.id}/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSession?.token || ''}` },
        body: JSON.stringify({ reviewStatus: action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to save document review.');
      await refreshDashboard();
      setActionFeedback(`Document marked ${action}.`);
    } catch (error) { setActionFeedback(error.message || 'Unable to review document.'); }
  };

  const loadProviderMatches = async (leadId) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/matches`, { headers: { Authorization: `Bearer ${adminSession?.token || ''}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to calculate provider matches.');
      setProviderMatches(payload.matches || []);
      setMatchesForLeadId(String(leadId));
    } catch (error) { setActionFeedback(error.message || 'Unable to calculate provider matches.'); }
  };

  const handleLeadStatusChange = async (leadId, nextStatus, onSuccess) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession?.token || ''}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update lead status.');
      }

      if (payload.lead) {
        setLeads((currentLeads) => currentLeads.map((lead) => (
          String(lead.id) === String(leadId) ? { ...lead, ...payload.lead } : lead
        )));
      }
      setActionFeedback(`Enquiry marked ${nextStatus.toLowerCase()}.`);
      onSuccess?.();
      void refreshDashboard();
    } catch (error) {
      console.error('Lead status update failed', error);
      setActionFeedback(error.message || 'Unable to update this enquiry.');
    }
  };

  const handleLeadDelete = async (lead) => {
    if (!window.confirm(`Delete ${lead.family || 'this lead'} permanently? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminSession?.token || ''}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to delete lead.');
      }
      setSelectedLeadId('');
      setExpandedRecentLeadId('');
      setLeads((currentLeads) => currentLeads.filter((currentLead) => String(currentLead.id) !== String(lead.id)));
      setActionFeedback(`${lead.status === 'Booked' ? 'Booking' : 'Enquiry'} for ${lead.family || 'this family'} deleted.`);
      void refreshDashboard();
    } catch (error) {
      console.error('Lead deletion failed', error);
      setActionFeedback(`Error: ${error.message || 'Unable to delete this record.'}`);
    }
  };

  const handleProviderDelete = async (provider) => {
    const providerName = provider.businessName || provider.name || 'this provider';
    if (!window.confirm(`Delete ${providerName} permanently? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminSession?.token || ''}` },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to delete provider.');
      }
      setSelectedProviderId('');
      await refreshDashboard();
    } catch (error) {
      console.error('Provider deletion failed', error);
    }
  };

  const handleLeadMatch = async (leadId, providerName, matchStatus = 'Matched') => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/match`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession?.token || ''}`,
        },
        body: JSON.stringify({ providerName, matchStatus }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to match lead.');
      }

      if (payload.lead) {
        setLeads((currentLeads) => currentLeads.map((lead) => (
          String(lead.id) === String(leadId) ? { ...lead, ...payload.lead } : lead
        )));
      }
      setActionFeedback(`Matched to ${providerName}.`);
      void refreshDashboard();
    } catch (error) {
      console.error('Lead match failed', error);
      setActionFeedback(error.message || 'Unable to match this enquiry.');
    }
  };

  const handleLeadFollowUp = async (leadId, followUpStage, adminNote = '') => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/followup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession?.token || ''}`,
        },
        body: JSON.stringify({ followUpStage, adminNote }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update follow-up.');
      }

      if (payload.lead) {
        setLeads((currentLeads) => currentLeads.map((lead) => (
          String(lead.id) === String(leadId) ? { ...lead, ...payload.lead } : lead
        )));
      }
      setActionFeedback(`Follow-up set to ${followUpStage.toLowerCase()}.`);
      void refreshDashboard();
    } catch (error) {
      console.error('Lead follow-up update failed', error);
      setActionFeedback(error.message || 'Unable to update follow-up.');
    }
  };

  const handleLeadRating = async (leadId, rating, adminNote = '') => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/rating`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession?.token || ''}`,
        },
        body: JSON.stringify({ rating, adminNote }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to record rating.');
      }

      if (payload.lead) {
        setLeads((currentLeads) => currentLeads.map((lead) => (
          String(lead.id) === String(leadId) ? { ...lead, ...payload.lead } : lead
        )));
      }
      setActionFeedback(rating ? `Final rating set to ${rating}/5.` : 'Final rating removed.');
      void refreshDashboard();
    } catch (error) {
      console.error('Lead rating update failed', error);
      setActionFeedback(error.message || 'Unable to record final rating.');
    }
  };

  const renderOverview = ({ recentOnly = false } = {}) => (
    <>
      {!recentOnly && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: '#0B1D3A', color: '#fff', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Total leads</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{summary.totalLeads}</div>
        </div>
        <div style={{ background: '#eefaf2', color: '#0B1D3A', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Providers</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{summary.providers}</div>
        </div>
        <div style={{ background: '#f2f6fb', color: '#0B1D3A', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Qualified</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{summary.qualifiedLeads}</div>
        </div>
        <div style={{ background: '#eaf7ff', color: '#0B1D3A', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Booked</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{summary.bookedLeads}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Latest enquiry', detail: newestEnquiry ? `${newestEnquiry.family || 'Family'} · ${newestEnquiry.need || 'Care support'}` : 'No enquiry yet', action: () => updateView('enquiry', newestEnquiry?.id) },
          { label: 'Recent leads', detail: `${summary.totalLeads} lead records`, action: () => updateView('recent-leads') },
          { label: 'Review leads', detail: `${summary.newLeads} new leads`, action: () => { setStatusFilter('New'); updateView('leads'); } },
          { label: 'Approve providers', detail: `${pendingProviders.length} pending`, action: () => updateView('providers') },
          { label: 'Booked this week', detail: `${bookedLeads.length} bookings`, action: () => updateView('bookings') },
          { label: 'Reporting', detail: `${summary.providers} provider profiles`, action: () => updateView('reports') },
        ].map((actionItem) => (
          <button
            key={actionItem.label}
            type="button"
            onClick={actionItem.action}
            style={{
              border: '1px solid #e4ecf6',
              background: 'linear-gradient(135deg, #ffffff 0%, #f3f9ff 100%)',
              borderRadius: 18,
              padding: '16px 18px',
              textAlign: 'left',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(11,29,58,0.04)',
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 1.2, color: '#28A745', fontWeight: 800, textTransform: 'uppercase' }}>{actionItem.label}</div>
            <div style={{ marginTop: 10, color: '#0B1D3A', fontWeight: 700, fontSize: '1.05rem' }}>{actionItem.detail}</div>
          </button>
        ))}
      </div>

      <div className="admin-dashboard-main" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: 18, marginTop: 18 }}>
        <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', color: '#0B1D3A', fontSize: '1.1rem' }}>Operations overview</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {overview.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #edf2f7', paddingBottom: 10 }}>
                <span style={{ color: '#5a6a7e' }}>{label}</span>
                <strong style={{ color: '#0B1D3A' }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#0B1D3A', fontSize: '1.1rem' }}>Registered providers</h3>
            <span style={{ background: '#eefaf2', color: '#0B1D3A', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>{providers.length}</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <input
              value={providerSearch}
              onChange={(event) => setProviderSearch(event.target.value)}
              placeholder="Search provider or area"
              style={{ width: '100%', border: '1px solid #dfeaf8', borderRadius: 10, padding: '10px 12px', fontSize: '0.9rem', color: '#0B1D3A', background: '#fff' }}
            />
          </div>

          {filteredProviders.length === 0 ? (
            <div style={{ color: '#5a6a7e', padding: '12px 0' }}>No providers match your search.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {filteredProviders.slice(0, 3).map((provider) => (
                <button
                  key={provider.id || provider.email}
                  type="button"
                  onClick={() => { setSelectedProviderId(String(provider.id)); updateView('providers'); }}
                  style={{
                    textAlign: 'left',
                    width: '100%',
                    padding: '12px 14px',
                    border: selectedProvider && String(provider.id) === String(selectedProvider.id) ? '1px solid #28A745' : '1px solid #edf2f7',
                    borderRadius: 12,
                    background: selectedProvider && String(provider.id) === String(selectedProvider.id) ? '#eefaf2' : '#f9fbff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <strong style={{ color: '#0B1D3A' }}>{provider.businessName || provider.name || 'Provider'}</strong>
                    <span style={{ background: provider.status === 'pending' ? '#fff4d8' : '#eafaf1', color: '#0B1D3A', borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>{(provider.status || 'pending').toString()}</span>
                  </div>
                  <div style={{ color: '#5a6a7e', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {provider.email || 'No email'}<br />
                    {provider.area || 'Area not set'} · {provider.serviceType || 'Service not set'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      </>}

      {recentOnly && <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: '#0B1D3A', fontSize: '1.1rem' }}>Recent leads</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All', 'New', 'Qualified', 'Booked', 'Replied'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => { setStatusFilter(item); updateView('leads'); }}
                style={{
                  border: '1px solid #dfeaf8',
                  background: statusFilter === item ? '#0B1D3A' : '#fff',
                  color: statusFilter === item ? '#fff' : '#0B1D3A',
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div style={{ color: '#5a6a7e' }}>No leads yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {filteredLeads.map((lead) => {
              const expanded = String(expandedRecentLeadId) === String(lead.id);
              return (
                <div key={lead.id || lead.family} style={{ border: expanded ? '1px solid #28A745' : '1px solid #edf2f7', borderRadius: 12, background: expanded ? '#f6fcf8' : '#fff', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedRecentLeadId(expanded ? '' : String(lead.id));
                      setSelectedLeadId(String(lead.id));
                    }}
                    aria-expanded={expanded}
                    style={{ width: '100%', border: 0, background: 'transparent', padding: '13px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                  >
                    <span>
                      <strong style={{ display: 'block', color: '#0B1D3A' }}>{lead.family || 'Unknown family'}</strong>
                      <span style={{ display: 'block', color: '#5a6a7e', fontSize: '0.82rem', marginTop: 3 }}>{lead.need || 'Care support'} · {lead.area || 'Not set'}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: lead.status === 'Booked' ? '#eafaf1' : lead.status === 'Qualified' ? '#eefaf2' : '#fff4d8', color: '#0B1D3A', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 700 }}>{lead.status || 'New'}</span>
                      <span aria-hidden="true" style={{ color: '#0B1D3A', fontSize: 18 }}>{expanded ? '−' : '+'}</span>
                    </span>
                  </button>
                  {expanded && (
                    <div style={{ borderTop: '1px solid #dfeaf8', padding: '12px 14px', color: '#0B1D3A', display: 'grid', gap: 7, fontSize: '0.88rem' }}>
                      <div><strong>Urgency:</strong> {lead.urgency || 'Soon'} · <strong>Budget:</strong> {lead.budget || 'TBC'}</div>
                      <div><strong>Contact:</strong> {lead.contactEmail || lead.phone || 'Not provided'}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                        <button type="button" className="btn btn-ghost-green" onClick={() => updateView('enquiry', lead.id)} style={{ width: 'fit-content', padding: '8px 12px', fontSize: '0.75rem' }}>Open full case</button>
                        <button type="button" onClick={() => handleLeadDelete(lead)} style={{ border: '1px solid #dc3545', color: '#b42318', background: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>}
    </>
  );

  const renderProviders = () => (
    <div className="admin-provider-layout" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 18 }}>
      <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: '#0B1D3A', fontSize: '1.1rem' }}>Provider management</h3>
          <span style={{ background: '#eefaf2', color: '#0B1D3A', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>{filteredProviders.length}</span>
        </div>

        <input
          value={providerSearch}
          onChange={(event) => setProviderSearch(event.target.value)}
          placeholder="Search provider or area"
          style={{ width: '100%', border: '1px solid #dfeaf8', borderRadius: 10, padding: '10px 12px', fontSize: '0.9rem', color: '#0B1D3A', background: '#fff', marginBottom: 12 }}
        />

        <div style={{ display: 'grid', gap: 10 }}>
          {filteredProviders.length === 0 ? (
            <div style={{ color: '#5a6a7e' }}>No providers found.</div>
          ) : (
            filteredProviders.map((provider) => (
              <button
                key={provider.id || provider.email}
                type="button"
                onClick={() => setSelectedProviderId(String(provider.id))}
                style={{
                  textAlign: 'left',
                  width: '100%',
                  padding: '12px 14px',
                  border: selectedProvider && String(provider.id) === String(selectedProvider.id) ? '1px solid #28A745' : '1px solid #edf2f7',
                  borderRadius: 12,
                  background: selectedProvider && String(provider.id) === String(selectedProvider.id) ? '#eefaf2' : '#f9fbff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <strong style={{ color: '#0B1D3A' }}>{provider.businessName || provider.name || 'Provider'}</strong>
                  <span style={{ background: provider.status === 'pending' ? '#fff4d8' : '#eafaf1', color: '#0B1D3A', borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>{(provider.status || 'pending').toString()}</span>
                </div>
                <div style={{ color: '#5a6a7e', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {provider.email || 'No email'}<br />
                  {provider.area || 'Area not set'} · {provider.serviceType || 'Service not set'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: '#28A745', fontSize: 11, fontWeight: 800, letterSpacing: 1.1, textTransform: 'uppercase' }}>Provider profile</div>
          <h3 style={{ margin: '4px 0 0', color: '#0B1D3A', fontSize: '1.15rem' }}>Provider details</h3>
        </div>
        {selectedProvider ? (
          <div style={{ display: 'grid', gap: 14, color: '#0B1D3A' }}>
            <div style={{ padding: 14, borderRadius: 14, background: 'linear-gradient(135deg, #0B1D3A, #173969)', color: '#fff' }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: '#8be6a0', fontWeight: 800, textTransform: 'uppercase' }}>Care provider</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4 }}>{selectedProvider.businessName || selectedProvider.name}</div>
              <div style={{ marginTop: 7, display: 'inline-flex', background: selectedProvider.status === 'active' ? '#d7f5df' : '#fff0c9', color: '#0B1D3A', borderRadius: 999, padding: '5px 9px', fontSize: 11, fontWeight: 800 }}>{selectedProvider.status || 'pending'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 9 }}>
              {[
                ['Contact', selectedProvider.email || 'Not provided', '#eef5ff'],
                ['Area', selectedProvider.area || 'Not set', '#eafaf1'],
                ['Service', selectedProvider.serviceType || 'Not set', '#fff4d8'],
                ['Rating', selectedProvider.rating ? `${selectedProvider.rating} / 5` : 'No rating yet', '#f5efff'],
              ].map(([label, value, background]) => (
                <div key={label} style={{ minWidth: 0, border: '1px solid #dfeaf8', borderRadius: 11, padding: '9px 10px', background }}>
                  <div style={{ color: '#5a6a7e', fontSize: 10, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                  <div style={{ color: '#0B1D3A', fontWeight: 700, fontSize: '0.84rem', overflowWrap: 'anywhere' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid #dfeaf8', borderRadius: 11, padding: 12, background: '#f9fbff' }}>
              <strong>Verification and referral eligibility</strong>
              <div style={{ marginTop: 6 }}>Verification: {selectedProvider.verificationStatus || 'incomplete'}</div>
              <div>Referrals: {selectedProvider.referralEligibility || 'temporarily_ineligible'}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#5a6a7e' }}>Registration details and policies are self-declared unless separately checked. Platform verification is not regulatory approval.</div>
              {selectedProvider.profileData?.registration && <div style={{ marginTop: 8, fontSize: 12, color: '#34445a' }}>Regulator: {selectedProvider.profileData.registration.regulator || 'Not selected'} · CQC registration: {selectedProvider.profileData.registration.cqcRegistration || 'Not declared'}</div>}
              {selectedProvider.profileData?.business && <div style={{ marginTop: 8, fontSize: 12, color: '#34445a' }}>Legal name: {selectedProvider.profileData.business.legalName || 'Not supplied'} · Business type: {selectedProvider.profileData.business.type || 'Not supplied'} · Address: {selectedProvider.profileData.business.address || 'Not supplied'} · Companies House: {selectedProvider.profileData.business.companiesHouseNumber || 'Not supplied'}</div>}
              {selectedProvider.profileData?.registration && <div style={{ marginTop: 8, fontSize: 12, color: '#34445a' }}>Nation: {selectedProvider.profileData.registration.nation || 'Not supplied'} · Registration ID: {selectedProvider.profileData.registration.registrationDetails || 'Not supplied'} · Activities: {(selectedProvider.profileData.registration.regulatedActivities || []).join(', ') || 'Not supplied'}</div>}
              {selectedProvider.profileData?.coverage && <div style={{ marginTop: 8, fontSize: 12, color: '#34445a' }}>Office: {selectedProvider.profileData.coverage.basePostcode || 'Not set'} · Radius: {selectedProvider.profileData.coverage.radiusMiles || 0} miles · Explicit areas: {(selectedProvider.profileData.coverage.locations || []).map((item) => item.name).join(', ') || 'None'}</div>}
              {selectedProvider.profileData?.coverage?.exclusions?.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: '#34445a' }}>Excluded areas: {selectedProvider.profileData.coverage.exclusions.map((item) => item.name).join(', ')}</div>}
              {selectedProvider.profileData?.services && <div style={{ marginTop: 8, fontSize: 12, color: '#34445a' }}>Services: {selectedProvider.profileData.services.join(', ') || 'None declared'}</div>}
              {selectedProvider.profileData?.careNeeds && <div style={{ marginTop: 8, fontSize: 12, color: '#34445a' }}>Care needs: {selectedProvider.profileData.careNeeds.join(', ') || 'None declared'} · Capacity: {selectedProvider.profileData.availability?.capacity || 0} · Accepting referrals: {selectedProvider.profileData.availability?.acceptingReferrals ? 'Yes' : 'No'}</div>}
              {selectedProvider.profileData?.compliance && <div style={{ marginTop: 8, fontSize: 12, color: '#34445a' }}>Insurance expiry: Public liability {selectedProvider.profileData.compliance.insurance?.publicLiabilityExpiry || 'Not supplied'} · Employers liability {selectedProvider.profileData.compliance.insurance?.employersLiabilityExpiry || 'Not supplied'} · Professional indemnity {selectedProvider.profileData.compliance.insurance?.indemnityExpiry || 'Not supplied'}</div>}
              {(selectedProvider.profileData?.compliance?.documents || []).map((document) => <div key={document.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8, paddingTop: 8, borderTop: '1px solid #dfeaf8', fontSize: 12 }}><span>{document.name} · {document.reviewStatus || 'pending'}</span><div style={{ display: 'flex', gap: 6 }}><button type="button" onClick={() => handleProviderDocument(selectedProvider, document, 'open')} style={{ border: '1px solid #28A745', color: '#0B1D3A', background: '#fff', borderRadius: 7, padding: '5px 8px', cursor: 'pointer' }}>Open securely</button>{document.reviewStatus === 'pending' && <><button type="button" onClick={() => handleProviderDocument(selectedProvider, document, 'reviewed')} style={{ border: '1px solid #28A745', color: '#0B1D3A', background: '#eafaf1', borderRadius: 7, padding: '5px 8px', cursor: 'pointer' }}>Mark reviewed</button><button type="button" onClick={() => handleProviderDocument(selectedProvider, document, 'rejected')} style={{ border: '1px solid #dc3545', color: '#b42318', background: '#fff', borderRadius: 7, padding: '5px 8px', cursor: 'pointer' }}>Reject</button></>}</div></div>)}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <button type="button" className="btn btn-green" onClick={() => handleProviderReview(selectedProvider, 'active', 'verified')} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.75rem' }}>Verify and activate</button>
              <button type="button" className="btn btn-ghost-green" onClick={() => handleProviderReview(selectedProvider, 'pending', 'pending_review')} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.75rem' }}>Set pending review</button>
              <button type="button" className="btn btn-ghost-green" onClick={() => handleProviderReview(selectedProvider, 'pending', 'rejected')} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.75rem' }}>Reject verification</button>
              <button type="button" className="btn btn-ghost-green" onClick={() => handleProviderReview(selectedProvider, 'suspended', selectedProvider.verificationStatus || 'pending_review')} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.75rem' }}>Suspend account</button>
              <button type="button" onClick={() => handleProviderDelete(selectedProvider)} style={{ border: '1px solid #dc3545', color: '#b42318', background: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                Delete provider
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color: '#5a6a7e' }}>No provider selected.</div>
        )}
      </div>
    </div>
  );

  const renderLeads = () => (
    <div className="admin-lead-layout" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
      <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: '#0B1D3A', fontSize: '1.1rem' }}>Lead pipeline</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All', 'New', 'Qualified', 'Booked', 'Replied'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatusFilter(item)}
                style={{
                  border: '1px solid #dfeaf8',
                  background: statusFilter === item ? '#0B1D3A' : '#fff',
                  color: statusFilter === item ? '#fff' : '#0B1D3A',
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div style={{ color: '#5a6a7e' }}>No leads yet.</div>
        ) : (
          <div className="admin-leads-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="admin-leads-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#5a6a7e' }}>
                  <th style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>Family</th>
                  <th style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>Need</th>
                  <th style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>Area</th>
                  <th style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>Status</th>
                  <th style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id || lead.family} onClick={() => setSelectedLeadId(String(lead.id))} style={{ cursor: 'pointer', background: selectedLead && String(lead.id) === String(selectedLead.id) ? '#f5f9ff' : 'transparent' }}>
                    <td data-label="Family" style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7', color: '#0B1D3A' }}>{lead.family || 'Unknown family'}</td>
                    <td data-label="Care need" style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7', color: '#5a6a7e' }}>{lead.need || 'Care support'}</td>
                    <td data-label="Area" style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7', color: '#5a6a7e' }}>{lead.area || 'Not set'}</td>
                    <td data-label="Status" style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>
                      <span style={{ background: lead.status === 'Booked' ? '#eafaf1' : lead.status === 'Qualified' ? '#eefaf2' : '#fff4d8', color: '#0B1D3A', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 700 }}>{lead.status || 'New'}</span>
                    </td>
                    <td data-label="Actions" style={{ padding: '10px 8px', borderBottom: '1px solid #edf2f7' }}>
                      <button type="button" onClick={(event) => { event.stopPropagation(); handleLeadDelete(lead); }} style={{ border: '1px solid #dc3545', color: '#b42318', background: '#fff', borderRadius: 8, padding: '6px 9px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-dashboard-card" style={{ border: '1px solid #dce8f3', borderRadius: 18, padding: 16, background: 'linear-gradient(160deg, #ffffff 0%, #f5f9ff 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ color: '#28A745', fontSize: 11, fontWeight: 800, letterSpacing: 1.1, textTransform: 'uppercase' }}>Case overview</div>
            <h3 style={{ margin: '4px 0 0', color: '#0B1D3A', fontSize: '1.2rem' }}>Lead insight</h3>
          </div>
          <span style={{ color: '#0B1D3A', background: '#eafaf1', border: '1px solid #bde8c9', borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800 }}>
            {selectedLead?.status || 'New'}
          </span>
        </div>
        {selectedLead ? (
          <div style={{ display: 'grid', gap: 16, color: '#0B1D3A' }}>
            <div style={{ padding: 14, borderRadius: 14, background: '#0B1D3A', color: '#fff', boxShadow: '0 10px 22px rgba(11,29,58,0.14)' }}>
              <div style={{ fontSize: 11, color: '#8be6a0', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Family enquiry</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedLead.family || 'Unknown family'}</div>
              <div style={{ marginTop: 4, color: '#d2deed', fontSize: '0.88rem' }}>{selectedLead.need || 'Care support'} · {selectedLead.area || 'Not set'}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {[
                ['Urgency', selectedLead.urgency || 'Soon', '#fff4d8'],
                ['Budget', selectedLead.budget || 'TBC', '#eef5ff'],
                ['Fit score', `${selectedLead.score || 0}%`, '#eafaf1'],
                ['Final rating', selectedLead.adminRating ? `${selectedLead.adminRating}/5` : 'Not rated yet', '#f5efff'],
              ].map(([label, value, background]) => (
                <div key={label} style={{ border: '1px solid #dfeaf8', borderRadius: 12, padding: '10px 11px', background }}>
                  <div style={{ color: '#5a6a7e', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ color: '#0B1D3A', fontSize: '0.88rem', fontWeight: 800, lineHeight: 1.35 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#eafaf1', color: '#146c2e', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 800 }}>Status: {selectedLead.status || 'New'}</span>
              <span style={{ background: '#edf4ff', color: '#174c8e', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 800 }}>Match: {selectedLead.matchStatus || 'Awaiting triage'}</span>
              <span style={{ background: '#fff4d8', color: '#805a08', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 800 }}>Follow-up: {selectedLead.followUpStage || 'Pending'}</span>
            </div>

            <div style={{ borderTop: '1px solid #dfeaf8', paddingTop: 14 }}>
              <div style={{ color: '#0B1D3A', fontSize: 12, fontWeight: 800, marginBottom: 10 }}>Manage this lead</div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Recommended providers</label>
              <select
                value={selectedLead.providerName || 'Unassigned'}
                onChange={(event) => {
                  const nextProvider = event.target.value;
                  handleLeadMatch(selectedLead.id, nextProvider, 'Matched');
                }}
                style={{ width: '100%', border: '1px solid #dfeaf8', borderRadius: 10, padding: '10px 12px', fontSize: '0.9rem', background: '#fff' }}
              >
                <option value="Unassigned">Unassigned</option>
                {(matchesForLeadId === String(selectedLead.id) ? providerMatches : []).filter((item) => item.eligible).map(({ provider }) => (
                  <option key={provider.id} value={provider.businessName || provider.name || 'Provider'}>
                    {provider.businessName || provider.name || 'Provider'}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => loadProviderMatches(selectedLead.id)} style={{ marginTop: 7, border: '1px solid #28A745', color: '#0B1D3A', background: '#fff', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' }}>Check coverage and eligibility</button>
              {matchesForLeadId === String(selectedLead.id) && <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>{providerMatches.map((item) => <div key={item.provider.id} style={{ border: '1px solid #dfeaf8', borderRadius: 9, padding: 9, fontSize: 12 }}><strong>{item.provider.businessName}</strong> · {item.eligible ? 'Eligible' : 'Not eligible'}<div style={{ color: '#5a6a7e', marginTop: 3 }}>{item.reasons.join(' · ')}</div></div>)}</div>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Follow-up stage</label>
              <select
                value={selectedLead.followUpStage || 'Pending'}
                onChange={(event) => handleLeadFollowUp(selectedLead.id, event.target.value, selectedLead.adminNote || '')}
                style={{ width: '100%', border: '1px solid #dfeaf8', borderRadius: 10, padding: '10px 12px', fontSize: '0.9rem', background: '#fff' }}
              >
                {['Pending', 'Provider contacted', 'Family contacted', 'Assessment booked', 'Service started', 'Service completed'].map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Admin case note</label>
              <textarea
                rows={3}
                defaultValue={selectedLead.adminNote || ''}
                onBlur={(event) => handleLeadFollowUp(selectedLead.id, selectedLead.followUpStage || 'Pending', event.target.value)}
                style={{ width: '100%', border: '1px solid #dfeaf8', borderRadius: 10, padding: '10px 12px', fontSize: '0.9rem', resize: 'vertical', background: '#fff' }}
                placeholder="Record the follow-up note for this case"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Final provider rating</label>
              <select
                value={selectedLead.adminRating ?? ''}
                onChange={(event) => handleLeadRating(selectedLead.id, event.target.value ? Number(event.target.value) : null, selectedLead.adminNote || '')}
                style={{ width: '100%', border: '1px solid #dfeaf8', borderRadius: 10, padding: '10px 12px', fontSize: '0.9rem', background: '#fff' }}
              >
                <option value="">Not rated yet</option>
                {[5, 4, 3, 2, 1].map((ratingOption) => (
                  <option key={ratingOption} value={ratingOption}>{ratingOption}/5</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>Update status</label>
              <select
                value={selectedLead.status || 'New'}
                onChange={(event) => handleLeadStatusChange(selectedLead.id, event.target.value)}
                style={{ width: '100%', border: '1px solid #dfeaf8', borderRadius: 10, padding: '10px 12px', fontSize: '0.9rem', background: '#fff' }}
              >
                {['New', 'Qualified', 'Booked', 'Replied', 'Closed'].map((statusOption) => (
                  <option key={statusOption} value={statusOption}>{statusOption}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => handleLeadDelete(selectedLead)} style={{ justifySelf: 'start', border: '1px solid #dc3545', color: '#b42318', background: '#fff', borderRadius: 8, padding: '9px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              Delete lead
            </button>
            </div>
          </div>
        ) : (
          <div style={{ color: '#5a6a7e' }}>No lead selected.</div>
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
      <h3 style={{ margin: '0 0 12px', color: '#0B1D3A', fontSize: '1.1rem' }}>Bookings</h3>
      {bookedLeads.length === 0 ? (
        <div style={{ color: '#5a6a7e' }}>No bookings yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {bookedLeads.map((lead) => (
            <div key={lead.id} style={{ border: '1px solid #edf2f7', borderRadius: 12, padding: 14, background: '#f9fbff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <strong style={{ color: '#0B1D3A' }}>{lead.family}</strong>
                <span style={{ background: '#eafaf1', borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>{lead.status}</span>
                <button type="button" onClick={() => handleLeadDelete(lead)} style={{ border: '1px solid #dc3545', color: '#b42318', background: '#fff', borderRadius: 8, padding: '6px 9px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Delete booking</button>
              </div>
              <div style={{ color: '#5a6a7e', lineHeight: 1.6 }}>
                {lead.need} · {lead.area}<br />
                Provider: {lead.providerName || 'Unassigned'} · Budget: {lead.budget || 'TBC'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
      <div className="admin-dashboard-card" style={{ border: '1px solid #c9efd4', borderRadius: 18, padding: 16, background: 'linear-gradient(135deg, #eafaf1, #ffffff)' }}>
        <div style={{ color: '#1e7d3d', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.1 }}>Qualified rate</div>
        <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: '#0B1D3A' }}>{summary.totalLeads ? Math.round((summary.qualifiedLeads / summary.totalLeads) * 100) : 0}%</div>
      </div>
      <div className="admin-dashboard-card" style={{ border: '1px solid #cfdef7', borderRadius: 18, padding: 16, background: 'linear-gradient(135deg, #eef5ff, #ffffff)' }}>
        <div style={{ color: '#174c8e', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.1 }}>Active providers</div>
        <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: '#0B1D3A' }}>{activeProviders.length}</div>
      </div>
      <div className="admin-dashboard-card" style={{ border: '1px solid #f1dfaa', borderRadius: 18, padding: 16, background: 'linear-gradient(135deg, #fff7df, #ffffff)' }}>
        <div style={{ color: '#805a08', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.1 }}>Pending approvals</div>
        <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: '#0B1D3A' }}>{pendingProviders.length}</div>
      </div>
      <div className="admin-dashboard-card" style={{ border: '1px solid #e6d5f7', borderRadius: 18, padding: 16, background: 'linear-gradient(135deg, #f8f0ff, #ffffff)' }}>
        <div style={{ color: '#6c3ca0', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.1 }}>Coverage</div>
        <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: '#0B1D3A' }}>{topServiceAreas.length || 0}</div>
      </div>

      <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16, gridColumn: '1 / -1' }}>
        <h3 style={{ margin: '0 0 10px', color: '#0B1D3A', fontSize: '1.1rem' }}>Coverage areas</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {topServiceAreas.length === 0 ? (
            <div style={{ color: '#5a6a7e' }}>No provider coverage data yet.</div>
          ) : (
            topServiceAreas.map((area) => (
              <div key={area} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: 8 }}>
                <span style={{ color: '#5a6a7e' }}>{area}</span>
                <strong style={{ color: '#0B1D3A' }}>{providers.filter((provider) => provider.area === area).length} providers</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16, gridColumn: '1 / -1' }}>
        <h3 style={{ margin: '0 0 6px', color: '#0B1D3A', fontSize: '1.1rem' }}>Case records</h3>
        <p style={{ margin: '0 0 12px', color: '#5a6a7e', fontSize: '0.85rem' }}>Delete an individual case if it was entered in error. Report totals update automatically.</p>
        {leads.length === 0 ? (
          <div style={{ color: '#5a6a7e' }}>No case records to display.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {leads.map((lead) => (
              <div key={lead.id} className="admin-report-record" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 8, borderBottom: '1px solid #edf2f7' }}>
                <span style={{ minWidth: 0 }}><strong style={{ display: 'block', color: '#0B1D3A' }}>{lead.family || 'Unknown family'}</strong><small style={{ color: '#5a6a7e' }}>{lead.need || 'Care support'} · {lead.area || 'Not set'}</small></span>
                <button type="button" onClick={() => handleLeadDelete(lead)} style={{ flex: '0 0 auto', border: '1px solid #dc3545', color: '#b42318', background: '#fff', borderRadius: 8, padding: '7px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderEnquiryDetail = () => {
    const requestedLeadId = new URLSearchParams(location.search || '').get('leadId');
    // A case can be opened from Recent leads as well as Latest Enquiry. Search
    // the complete lead list first so ordinary leads do not produce a false
    // "not found" result.
    const enquiryLead = requestedLeadId
      ? leads.find((lead) => String(lead.id) === String(requestedLeadId))
        || enquiries.find((enquiry) => String(enquiry.id) === String(requestedLeadId))
        || null
      : newestEnquiry;

    const sortedEnquiries = [...enquiries].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (!enquiryLead) {
      return (
        <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', color: '#0B1D3A', fontSize: '1.1rem' }}>Latest enquiry</h3>
          <div style={{ color: '#5a6a7e' }}>No enquiry has been submitted yet.</div>
        </div>
      );
    }

    const enquiryTimeline = [
      { label: 'Submitted', value: enquiryLead.createdAt ? new Date(enquiryLead.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently' },
      { label: 'Current status', value: enquiryLead.status || 'New' },
      { label: 'Assigned match', value: enquiryLead.matchStatus || 'Awaiting triage' },
      { label: 'Follow-up stage', value: enquiryLead.followUpStage || 'Pending' },
      { label: 'Final rating', value: enquiryLead.adminRating ? `${enquiryLead.adminRating}/5` : 'Not rated yet' },
    ];

    return (
      <div style={{ display: 'grid', gap: 14 }}>
      <div className="admin-dashboard-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
        <h3 style={{ margin: '0 0 12px', color: '#0B1D3A', fontSize: '1.1rem' }}>All enquiries ({sortedEnquiries.length})</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {sortedEnquiries.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', border: String(item.id) === String(enquiryLead.id) ? '1px solid #28A745' : '1px solid #edf2f7', borderRadius: 10, background: '#fff' }}>
              <button type="button" onClick={() => updateView('enquiry', item.id)} style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 0, background: 'transparent', cursor: 'pointer', padding: 0, color: '#0B1D3A' }}>
                <strong style={{ display: 'block' }}>{item.family || 'Unknown family'}</strong>
                <small style={{ color: '#5a6a7e' }}>{item.need || 'Care support'} · {item.area || 'Not set'} · {item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}</small>
              </button>
              <button type="button" onClick={() => handleLeadDelete(item)} style={{ flex: '0 0 auto', border: '1px solid #dc3545', color: '#b42318', background: '#fff', borderRadius: 8, padding: '7px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          ))}
        </div>
      </div>
      <div className="admin-dashboard-card admin-enquiry-card" style={{ border: '1px solid #e4ecf6', borderRadius: 18, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: '#28A745', fontWeight: 800 }}>Case overview</div>
            <h3 style={{ margin: '6px 0 0', color: '#0B1D3A', fontSize: '1.1rem' }}>Enquiry detail</h3>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-green" onClick={() => updateView('leads')} style={{ width: 'auto', padding: '10px 14px', fontSize: '0.8rem' }}>Back to leads</button>
            <button type="button" className="btn btn-ghost-green" onClick={() => handleLeadStatusChange(enquiryLead.id, 'Qualified')} style={{ width: 'auto', padding: '10px 14px', fontSize: '0.8rem' }}>Mark qualified</button>
          </div>
        </div>

        <div className="admin-enquiry-layout" style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 10, color: '#0B1D3A' }}>
            <div style={{ background: '#f9fbff', border: '1px solid #edf2f7', borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0B1D3A' }}>{enquiryLead.family || 'Unknown family'}</div>
                <span style={{ background: '#eafaf1', color: '#0B1D3A', borderRadius: 999, padding: '5px 9px', fontSize: 11, fontWeight: 700 }}>{enquiryLead.status || 'New'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px 12px' }}>
                {[
                  ['Care need', enquiryLead.need || 'Care support'],
                  ['Area', enquiryLead.area || 'Not set'],
                  ['Urgency', enquiryLead.urgency || 'Soon'],
                  ['Budget', enquiryLead.budget || 'TBC'],
                  ['Contact email', enquiryLead.contactEmail || 'Not provided'],
                  ['Phone', enquiryLead.phone || 'Not provided'],
                  ['Assigned provider', enquiryLead.providerName || 'Unassigned'],
                  ['Match status', enquiryLead.matchStatus || 'Awaiting triage'],
                ].map(([label, value]) => (
                  <div key={label} style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#5a6a7e', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{label}</div>
                    <div style={{ color: '#0B1D3A', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.5, wordBreak: 'break-word' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {enquiryLead.adminNote && (
              <div style={{ background: '#eefaf2', border: '1px solid #d7f1df', borderRadius: 12, padding: 10, color: '#0B1D3A', fontSize: '0.9rem' }}>
                <strong>Admin note:</strong> {enquiryLead.adminNote}
              </div>
            )}

            <div style={{ border: '1px solid #edf2f7', borderRadius: 12, padding: 12, color: '#5a6a7e', lineHeight: 1.6, background: '#fff', fontSize: '0.92rem', wordBreak: 'break-word' }}>
              <div style={{ marginBottom: 8, color: '#0B1D3A', fontWeight: 700 }}>Message</div>
              {enquiryLead.message || 'No message supplied.'}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ border: '1px solid #edf2f7', borderRadius: 12, padding: 12, background: '#f9fbff' }}>
              <h4 style={{ margin: '0 0 10px', color: '#0B1D3A', fontSize: '0.96rem' }}>Case timeline</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                {enquiryTimeline.map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid #edf2f7', paddingBottom: 6, fontSize: '0.82rem' }}>
                    <span style={{ color: '#5a6a7e' }}>{item.label}</span>
                    <strong style={{ color: '#0B1D3A', textAlign: 'right' }}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: '1px solid #edf2f7', borderRadius: 12, padding: 12, background: '#fff' }}>
              <h4 style={{ margin: '0 0 10px', color: '#0B1D3A', fontSize: '0.96rem' }}>Admin actions</h4>
              {actionFeedback && (
                <div role="status" style={{ marginBottom: 10, borderRadius: 8, padding: '8px 10px', background: actionFeedback.startsWith('Unable') ? '#fff1f2' : '#eefaf2', color: actionFeedback.startsWith('Unable') ? '#b42318' : '#0B1D3A', fontSize: '0.78rem', fontWeight: 700 }}>
                  {actionFeedback}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button type="button" className="btn btn-green" onClick={() => handleLeadStatusChange(enquiryLead.id, 'Qualified')} style={{ width: '100%', padding: '10px 12px', fontSize: '0.8rem' }}>Qualify enquiry</button>
                <button type="button" className="btn btn-ghost-green" onClick={() => handleLeadMatch(enquiryLead.id, providers[0]?.businessName || 'Oakwell Care Ltd', 'Matched')} style={{ width: '100%', padding: '10px 12px', fontSize: '0.8rem' }}>Match provider</button>
                <button type="button" className="btn btn-ghost-green" onClick={() => handleLeadFollowUp(enquiryLead.id, 'Family contacted', 'Admin has contacted the family and is scheduling the next care conversation.')} style={{ width: '100%', padding: '10px 12px', fontSize: '0.8rem' }}>Set follow-up</button>
                <button type="button" className="btn btn-navy" onClick={() => handleLeadStatusChange(enquiryLead.id, 'Booked', () => updateView('bookings'))} style={{ width: '100%', padding: '10px 12px', fontSize: '0.8rem' }}>Mark booked</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'enquiry':
        return renderEnquiryDetail();
      case 'recent-leads':
        return renderOverview({ recentOnly: true });
      case 'providers':
        return renderProviders();
      case 'leads':
        return renderLeads();
      case 'bookings':
        return renderBookings();
      case 'reports':
        return renderReports();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return (
    <div className="admin-dashboard-shell" style={{ minHeight: '100vh', background: '#f5f7fa', padding: 20 }}>
      <style>{`
        .admin-dashboard-shell {
          background: linear-gradient(180deg, #f3f7fb 0%, #edf3f7 100%);
        }
        .admin-dashboard-card {
          background: linear-gradient(150deg, #ffffff 0%, #f8fbff 100%);
          box-shadow: 0 10px 26px rgba(11, 29, 58, 0.06);
          border-top: 3px solid #28A745 !important;
          overflow: hidden;
        }
        .admin-dashboard-card > h3 {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-dashboard-card > h3::before {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #28A745;
          box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.12);
        }
        .admin-dashboard-card .admin-leads-table thead tr {
          background: #0B1D3A;
          color: #ffffff !important;
        }
        .admin-dashboard-card .admin-leads-table th:first-child { border-radius: 9px 0 0 9px; }
        .admin-dashboard-card .admin-leads-table th:last-child { border-radius: 0 9px 9px 0; }
        .admin-dashboard-card .admin-leads-table tbody tr {
          transition: background 0.18s ease, transform 0.18s ease;
        }
        .admin-dashboard-card .admin-leads-table tbody tr:hover {
          background: #eefaf2 !important;
          transform: translateX(2px);
        }
        .admin-dashboard-card .admin-report-record {
          border: 1px solid #e1ebf5 !important;
          border-radius: 12px;
          padding: 10px 12px;
          background: #ffffff;
        }
        @media (max-width: 768px) {
          .admin-dashboard-shell {
            padding: 12px !important;
          }
          .admin-dashboard-shell .admin-dashboard-main,
          .admin-dashboard-shell .admin-provider-layout,
          .admin-dashboard-shell .admin-lead-layout,
          .admin-dashboard-shell .admin-enquiry-layout {
            grid-template-columns: 1fr !important;
          }
          .admin-dashboard-shell .admin-enquiry-card {
            padding: 14px !important;
          }
          .admin-dashboard-shell .admin-secondary-nav {
            overflow-x: auto;
            white-space: nowrap;
          }
          .admin-dashboard-shell .admin-dashboard-card {
            padding: 14px !important;
          }
          .admin-dashboard-shell .admin-dashboard-topbar {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .admin-dashboard-shell .admin-dashboard-topbar-actions {
            width: 100%;
          }
          .admin-dashboard-shell .admin-dashboard-topbar-actions button {
            flex: 1 1 auto;
          }
          .admin-dashboard-shell table {
            min-width: 540px;
          }
          .admin-dashboard-shell .admin-leads-table-wrap {
            overflow: hidden !important;
            max-width: 100%;
          }
          .admin-dashboard-shell .admin-leads-table {
            min-width: 0 !important;
            max-width: 100%;
            table-layout: fixed;
          }
          .admin-dashboard-shell .admin-leads-table thead {
            display: none;
          }
          .admin-dashboard-shell .admin-leads-table,
          .admin-dashboard-shell .admin-leads-table tbody,
          .admin-dashboard-shell .admin-leads-table tr,
          .admin-dashboard-shell .admin-leads-table td {
            display: block;
            width: 100%;
          }
          .admin-dashboard-shell .admin-leads-table tr {
            margin: 0 0 12px;
            padding: 10px 12px;
            border: 1px solid #e4ecf6;
            border-radius: 12px;
          }
          .admin-dashboard-shell .admin-leads-table td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 7px 0 !important;
            border-bottom: 1px solid #edf2f7;
            text-align: right;
            overflow-wrap: anywhere;
          }
          .admin-dashboard-shell .admin-leads-table td:last-child {
            border-bottom: 0;
          }
          .admin-dashboard-shell .admin-leads-table td::before {
            content: attr(data-label);
            color: #5a6a7e;
            font-size: 0.73rem;
            font-weight: 700;
            text-align: left;
          }
          .admin-dashboard-shell .admin-lead-layout select,
          .admin-dashboard-shell .admin-lead-layout textarea {
            box-sizing: border-box;
            max-width: 100%;
          }
          .admin-dashboard-shell .admin-report-record {
            align-items: flex-start !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', background: '#fff', borderRadius: 24, boxShadow: '0 18px 48px rgba(11,29,58,0.08)', padding: 18 }}>
        <div className="admin-dashboard-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#28A745', fontWeight: 800, textTransform: 'uppercase' }}>Admin dashboard</div>
            <h2 style={{ margin: '8px 0 0', color: '#0B1D3A', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>{adminTitle}</h2>
          </div>
          <div className="admin-dashboard-topbar-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost-green" onClick={onBack} style={{ width: 'auto', padding: '10px 16px', fontSize: '0.82rem' }}>Back to site</button>
            {onLogout && (
              <button className="btn btn-navy" onClick={onLogout} style={{ width: 'auto', padding: '10px 16px', fontSize: '0.82rem' }}>Log out</button>
            )}
          </div>
        </div>

        <div className="admin-secondary-nav" style={{ display: 'flex', gap: 10, background: '#f3f7fb', borderRadius: 14, padding: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => updateView(item.key)}
              style={{
                border: 'none',
                background: currentView === item.key ? '#0B1D3A' : 'transparent',
                color: currentView === item.key ? '#fff' : '#0B1D3A',
                borderRadius: 10,
                padding: '10px 14px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {actionFeedback && (
          <div role="status" style={{ marginBottom: 16, borderRadius: 10, padding: '10px 12px', background: actionFeedback.startsWith('Error:') ? '#fff1f2' : '#eefaf2', color: actionFeedback.startsWith('Error:') ? '#b42318' : '#0B1D3A', fontSize: '0.84rem', fontWeight: 700 }}>
            {actionFeedback}
          </div>
        )}

        {renderCurrentView()}
      </div>
    </div>
  );
}

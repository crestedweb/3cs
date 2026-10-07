const base = 'http://localhost:3000';
const payloads = ['First', 'Second'].map((suffix) => ({
  name: `Regression Test ${suffix}`,
  email: `regression-${suffix.toLowerCase()}@example.com`,
  phone: '07123 456789',
  postcode: 'LE1 1AA',
  service: 'Domiciliary care',
  careNeed: 'Domiciliary care',
  urgency: 'This week',
  budget: '£30/hr',
  recordType: 'enquiry',
  message: `Ordering verification ${suffix}.`,
}));
const results = [];
for (const payload of payloads) {
  const response = await fetch(`${base}/api/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  results.push({ status: response.status, body: await response.json() });
}
const leadsResponse = await fetch(`${base}/api/leads`);
const leads = await leadsResponse.json();
const matches = (leads.leads || []).filter((lead) =>
  String(lead.family || '').includes('Regression Test'),
).map((lead) => ({
  id: lead.id,
  family: lead.family,
  createdAt: lead.createdAt,
  recordType: lead.recordType,
}));
console.log(JSON.stringify({ results, matches, count: matches.length }, null, 2));

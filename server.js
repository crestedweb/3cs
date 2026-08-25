import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
  },
});

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, '.env'));

const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

const supabaseAnon = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

const supabase = supabaseAdmin;
const hasSupabaseAuth = Boolean(supabaseAnon || supabaseAdmin);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('dist'));

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "info@3cscareservices.co.uk";

const providers = [
  {
    id: 1,
    name: 'Aisha Rahman',
    businessName: 'Oakwell Care Ltd',
    email: 'provider@oakwellcare.com',
    phone: '07700900011',
    cqcRegistration: '1-234567890',
    serviceType: 'Domiciliary care',
    area: 'Leicester',
    verified: true,
    rating: 4.9,
    responseTime: '< 30 mins',
    capacity: '2 new enquiries',
    status: 'active',
    password: 'demo123',
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 2,
    name: 'Daniel Holt',
    businessName: 'Grace House Support',
    email: 'hello@gracehousecare.com',
    phone: '07700900012',
    cqcRegistration: '1-234567891',
    serviceType: 'Dementia care',
    area: 'Coventry',
    verified: true,
    rating: 4.8,
    responseTime: '< 1 hour',
    capacity: '4 new enquiries',
    status: 'active',
    password: 'demo123',
    createdAt: '2026-08-10T09:00:00.000Z',
  },
];

const leads = [
  {
    id: 'L-1042',
    family: 'M. Ahmed',
    need: 'Dementia care',
    area: 'Leicester LE2',
    urgency: 'Urgent',
    budget: '£35/hr',
    status: 'New',
    providerName: 'Oakwell Care Ltd',
    score: 92,
    createdAt: '2026-08-20T17:30:00.000Z',
  },
  {
    id: 'L-1048',
    family: 'S. Patel',
    need: 'Respite care',
    area: 'Coventry CV1',
    urgency: 'This week',
    budget: '£28/hr',
    status: 'Qualified',
    providerName: 'Grace House Support',
    score: 86,
    createdAt: '2026-08-20T15:00:00.000Z',
  },
  {
    id: 'L-1052',
    family: 'K. Morgan',
    need: 'Live-in care',
    area: 'Nottingham NG1',
    urgency: 'Soon',
    budget: '£40/hr',
    status: 'Replied',
    providerName: 'The Hearth Collective',
    score: 89,
    createdAt: '2026-08-19T12:15:00.000Z',
  },
  {
    id: 'L-1059',
    family: 'T. Benson',
    need: 'Personal care',
    area: 'Birmingham B16',
    urgency: 'This month',
    budget: '£30/hr',
    status: 'Booked',
    providerName: 'Sunrise Health & Care',
    score: 80,
    createdAt: '2026-08-18T10:20:00.000Z',
  },
];
const fallbackLeads = [];

function clean(value) {
  return String(value || "").trim();
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function isConfiguredAdminRequest(req) {
  const adminEmail = clean(process.env.ADMIN_EMAIL).toLowerCase();
  return Boolean(adminEmail) && getBearerToken(req) === `admin-${adminEmail}-token`;
}

function normalizeProvider(row) {
  return {
    id: row.id,
    name: row.name,
    businessName: row.business_name || row.businessName || row.businessname,
    email: row.email,
    phone: row.phone,
    cqcRegistration: row.cqc_registration || row.cqcRegistration,
    serviceType: row.service_type || row.serviceType,
    area: row.area,
    verified: Boolean(row.verified),
    rating: Number(row.rating || 0),
    responseTime: row.response_time || row.responseTime || '< 1 hour',
    capacity: row.capacity || 'Open for leads',
    status: row.status || 'pending',
    password: row.password,
    createdAt: row.created_at || row.createdAt,
  };
}

function normalizeLead(row) {
  const storedMessage = row.message || '';
  const sourceMatch = storedMessage.match(/^\[(lead|enquiry)\]\s*/i);
  const recordType = sourceMatch?.[1]?.toLowerCase() || (/^Care enquiry for\b/i.test(storedMessage) ? 'lead' : 'enquiry');
  const message = storedMessage.replace(/^\[(lead|enquiry)\]\s*/i, '');
  const submittedUrgency = message.match(/(?:^|\|\s*)Urgency:\s*([^|]+)/i)?.[1]?.trim();
  const submittedBudget = message.match(/(?:^|\|\s*)Budget:\s*([^|]+)/i)?.[1]?.trim();

  return {
    id: row.id,
    family: row.family || row.family_name,
    need: row.need || row.care_need,
    area: row.area,
    urgency: submittedUrgency || row.urgency || 'Soon',
    budget: submittedBudget || row.budget || 'TBC',
    status: row.status || 'New',
    providerName: row.provider_name || row.providerName || 'Unassigned',
    score: Number(row.score || 0),
    matchStatus: row.match_status || row.matchStatus || 'Awaiting triage',
    followUpStage: row.follow_up_stage || row.followUpStage || 'Pending',
    adminRating: row.admin_rating || row.adminRating || null,
    adminNote: row.admin_note || row.adminNote || '',
    createdAt: row.created_at || row.createdAt,
    contactEmail: row.contact_email || row.contactEmail || '',
    phone: row.phone || '',
    message,
    recordType,
  };
}

function buildLeadFromEnquiry(body = {}) {
  const family = clean(body.family || body.name || 'Unknown family');
  const need = clean(body.need || body.service || 'Care support');
  const area = clean(body.area || body.postcode || 'Not set');

  return {
    id: `L-${Date.now().toString().slice(-4)}`,
    family,
    need,
    area,
    urgency: clean(body.urgency || 'Soon'),
    budget: clean(body.budget || 'TBC'),
    status: 'New',
    providerName: 'Unassigned',
    score: Number(body.score || 80),
    matchStatus: 'Awaiting triage',
    followUpStage: 'Pending',
    adminRating: null,
    adminNote: '',
    createdAt: new Date().toISOString(),
    contactEmail: clean(body.email || ''),
    phone: clean(body.phone || ''),
    message: clean(body.message || ''),
    recordType: clean(body.recordType).toLowerCase() === 'enquiry' ? 'enquiry' : 'lead',
  };
}

async function persistLeadFromEnquiry(body = {}) {
  const nextLead = buildLeadFromEnquiry(body);

  if (supabase) {
    const { data, error } = await supabase.from('leads').insert([{
      family_name: nextLead.family,
      care_need: nextLead.need,
      area: nextLead.area,
      urgency: nextLead.urgency,
      budget: nextLead.budget,
      status: 'new',
      provider_name: 'Unassigned',
      score: nextLead.score,
      contact_email: nextLead.contactEmail,
      phone: nextLead.phone,
      message: `[${nextLead.recordType}] ${nextLead.message}`,
    }]).select();

    if (!error && data && data[0]) {
      const normalizedLead = normalizeLead(data[0]);
      leads.unshift(normalizedLead);
      return normalizedLead;
    }

    if (error) {
      console.error('Supabase lead insert failed:', error.message);
    }
  }

  leads.unshift(nextLead);
  fallbackLeads.unshift(nextLead);
  return nextLead;
}

async function getProvidersFromDataSource() {
  if (!supabase) {
    return providers.map(buildProviderSnapshot);
  }

  const { data, error } = await supabase.from('providers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase provider query failed:', error.message);
    return providers.map(buildProviderSnapshot);
  }

  return (data || []).map(normalizeProvider);
}

async function getLeadsFromDataSource() {
  if (!supabase) {
    return leads;
  }

  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase lead query failed:', error.message);
    return leads;
  }

  return [...(data || []).map(normalizeLead), ...fallbackLeads]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

async function updateLeadRecord(leadId, localUpdates, databaseUpdates) {
  if (supabase) {
    const { data, error } = await supabase
      .from('leads')
      .update(databaseUpdates)
      .eq('id', leadId)
      .select();

    if (error) {
      throw new Error(error.message);
    }
    if (data?.[0]) {
      const updatedLead = normalizeLead(data[0]);
      const leadIndex = leads.findIndex((lead) => String(lead.id) === String(leadId));
      if (leadIndex === -1) {
        leads.unshift(updatedLead);
      } else {
        leads[leadIndex] = updatedLead;
      }
      return updatedLead;
    }
  }

  const leadIndex = leads.findIndex((lead) => String(lead.id) === String(leadId));
  if (leadIndex === -1) {
    return null;
  }

  Object.assign(leads[leadIndex], localUpdates);
  return leads[leadIndex];
}

async function deleteLeadRecord(leadId) {
  let deletedFromDatabase = false;
  if (supabase) {
    const { data, error } = await supabase.from('leads').delete().eq('id', leadId).select();
    if (error) throw new Error(error.message);
    deletedFromDatabase = Boolean(data?.[0]);
  }

  const leadIndex = leads.findIndex((lead) => String(lead.id) === String(leadId));
  if (leadIndex === -1 && !deletedFromDatabase) return false;
  if (leadIndex !== -1) leads.splice(leadIndex, 1);
  const fallbackIndex = fallbackLeads.findIndex((lead) => String(lead.id) === String(leadId));
  if (fallbackIndex !== -1) fallbackLeads.splice(fallbackIndex, 1);
  return true;
}

async function deleteProviderRecord(providerId) {
  let deletedFromDatabase = false;
  if (supabase) {
    const { data, error } = await supabase.from('providers').delete().eq('id', providerId).select();
    if (error) throw new Error(error.message);
    deletedFromDatabase = Boolean(data?.[0]);
  }

  const providerIndex = providers.findIndex((provider) => String(provider.id) === String(providerId));
  if (providerIndex === -1 && !deletedFromDatabase) return false;
  if (providerIndex !== -1) providers.splice(providerIndex, 1);
  return true;
}

async function getMarketplaceSummaryFromDataSource() {
  const providerList = await getProvidersFromDataSource();
  const leadList = await getLeadsFromDataSource();

  const activeProviders = providerList.filter((provider) => provider.status === 'active' || provider.status === 'pending').length;
  const newLeads = leadList.filter((lead) => String(lead.status).toLowerCase() === 'new').length;
  const qualifiedLeads = leadList.filter((lead) => String(lead.status).toLowerCase() === 'qualified').length;
  const bookedLeads = leadList.filter((lead) => String(lead.status).toLowerCase() === 'booked').length;

  return {
    totalProviders: providerList.length,
    activeProviders,
    totalLeads: leadList.length,
    newLeads,
    qualifiedLeads,
    bookedLeads,
    averageRating: providerList.length
      ? (providerList.reduce((sum, provider) => sum + Number(provider.rating || 0), 0) / providerList.length).toFixed(1)
      : '0.0',
  };
}

function buildProviderSnapshot(provider) {
  return {
    id: provider.id,
    name: provider.name,
    businessName: provider.businessName,
    email: provider.email,
    phone: provider.phone,
    cqcRegistration: provider.cqcRegistration,
    serviceType: provider.serviceType,
    area: provider.area,
    verified: provider.verified,
    rating: provider.rating,
    responseTime: provider.responseTime,
    capacity: provider.capacity,
    status: provider.status,
  };
}

function buildMarketplaceSummary() {
  const activeProviders = providers.filter((provider) => provider.status === 'active').length;
  const newLeads = leads.filter((lead) => lead.status === 'New').length;
  const qualifiedLeads = leads.filter((lead) => lead.status === 'Qualified').length;
  const bookedLeads = leads.filter((lead) => lead.status === 'Booked').length;

  return {
    totalProviders: providers.length,
    activeProviders,
    totalLeads: leads.length,
    newLeads,
    qualifiedLeads,
    bookedLeads,
    averageRating: (providers.reduce((sum, provider) => sum + provider.rating, 0) / providers.length).toFixed(1),
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: '3CS marketplace API is online.' });
});

app.get('/api/providers', async (req, res) => {
  const providerList = await getProvidersFromDataSource();
  res.json({ providers: providerList.map(buildProviderSnapshot) });
});

app.get('/api/providers/:id', async (req, res) => {
  const providerList = await getProvidersFromDataSource();
  const provider = providerList.find((item) => String(item.id) === String(req.params.id));
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found.' });
  }

  return res.json({ provider: buildProviderSnapshot(provider) });
});

app.post('/api/providers/register', async (req, res) => {
  const body = req.body || {};
  const name = clean(body.name);
  const businessName = clean(body.businessName);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const cqcRegistration = clean(body.cqcRegistration);
  const serviceType = clean(body.serviceType || body.service);
  const area = clean(body.area);
  const password = clean(body.password || 'welcome123');

  if (!name || !businessName || !email || !serviceType || !area) {
    return res.status(400).json({ error: 'All key registration fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existingProvider = providers.find((provider) => provider.email.toLowerCase() === email.toLowerCase());
  if (existingProvider) {
    return res.status(409).json({ error: 'A provider with this email already exists.' });
  }

  const newProvider = {
    id: Date.now(),
    name,
    businessName,
    email,
    phone,
    cqcRegistration,
    serviceType,
    area,
    verified: false,
    rating: 4.8,
    responseTime: '< 1 hour',
    capacity: 'Open for leads',
    status: 'pending',
    password,
    createdAt: new Date().toISOString(),
  };

  if (supabaseAdmin) {
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'provider',
          business_name: businessName,
          name,
          service_type: serviceType,
          area,
        },
      });

      if (authError) {
        console.error('Supabase provider auth create failed:', authError.message);
      }

      const { data, error } = await supabase.from('providers').insert([{
        name,
        business_name: businessName,
        email,
        phone,
        cqc_registration: cqcRegistration,
        service_type: serviceType,
        area,
        verified: false,
        rating: 4.8,
        response_time: '< 1 hour',
        status: 'pending',
        auth_user_id: authData?.user?.id || null,
      }]).select();

      if (!error && data && data[0]) {
        const provider = normalizeProvider(data[0]);
        return res.status(201).json({
          message: 'Provider registered successfully with Supabase auth.',
          provider: buildProviderSnapshot(provider),
        });
      }

      if (error) {
        console.error('Supabase provider insert failed:', error.message);
      }
    } catch (error) {
      console.error('Supabase provider registration fallback triggered:', error.message);
    }
  }

  providers.push(newProvider);
  return res.status(201).json({
    message: hasSupabaseAuth
      ? `Provider registered successfully in fallback mode. Use email ${email} and your chosen password to sign in.`
      : `Provider registered successfully. Use email ${email} and your chosen password to sign in.`,
    provider: buildProviderSnapshot(newProvider),
  });
});

app.post('/api/providers/login', async (req, res) => {
  const body = req.body || {};
  const email = clean(body.email).toLowerCase();
  const password = clean(body.password);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (supabaseAnon) {
    try {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
      if (!error && data?.user && data.user.user_metadata?.role === 'provider') {
        const provider = providers.find((item) => item.email.toLowerCase() === email);
        const providerRecord = provider || { id: Date.now(), businessName: data.user.user_metadata?.business_name || 'Provider', email, area: data.user.user_metadata?.area || 'Not set' };
        return res.json({
          token: `provider-${providerRecord.id}-token`,
          provider: buildProviderSnapshot({
            ...providerRecord,
            businessName: providerRecord.businessName || providerRecord.business_name,
            name: providerRecord.name || data.user.user_metadata?.name || 'Provider user',
            area: providerRecord.area || data.user.user_metadata?.area || 'Not set',
            status: providerRecord.status || 'active',
            rating: providerRecord.rating || 4.8,
          }),
        });
      }
    } catch (error) {
      console.error('Supabase provider login attempt failed:', error.message);
    }
  }

  const provider = providers.find((item) => item.email.toLowerCase() === email && item.password === password);
  if (!provider) {
    return res.status(401).json({ error: 'Invalid provider login credentials.' });
  }

  return res.json({
    token: `provider-${provider.id}-token`,
    provider: buildProviderSnapshot(provider),
  });
});

app.get('/api/leads', async (req, res) => {
  const leadList = await getLeadsFromDataSource();
  res.json({ leads: leadList });
});

app.post('/api/leads', async (req, res) => {
  const body = req.body || {};
  const family = clean(body.family);
  const need = clean(body.need);
  const area = clean(body.area);
  const urgency = clean(body.urgency || 'Soon');
  const budget = clean(body.budget || 'TBC');
  const status = clean(body.status || 'New');

  if (!family || !need || !area) {
    return res.status(400).json({ error: 'Family, care need, and area are required.' });
  }

  const newLead = {
    id: `L-${Date.now().toString().slice(-4)}`,
    family,
    need,
    area,
    urgency,
    budget,
    status,
    providerName: body.providerName || 'Unassigned',
    score: body.score || 80,
    matchStatus: body.matchStatus || 'Awaiting triage',
    followUpStage: body.followUpStage || 'Pending',
    adminRating: body.adminRating || null,
    adminNote: body.adminNote || '',
    createdAt: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase.from('leads').insert([{
      family_name: family,
      care_need: need,
      area,
      urgency,
      budget,
      status: status.toLowerCase(),
      provider_name: body.providerName || 'Unassigned',
      score: body.score || 80,
    }]).select();

    if (error) {
      console.error('Supabase lead insert failed:', error.message);
    } else if (data && data[0]) {
      const createdLead = normalizeLead(data[0]);
      leads.unshift(newLead);
      return res.status(201).json({ message: 'Lead created successfully.', lead: createdLead });
    }
  }

  leads.unshift(newLead);
  return res.status(201).json({ message: 'Lead created successfully.', lead: newLead });
});

app.get('/api/marketplace/summary', async (req, res) => {
  const summary = await getMarketplaceSummaryFromDataSource();
  res.json({ summary });
});

app.post('/api/admin/login', async (req, res) => {
  const body = req.body || {};
  const email = clean(body.email).toLowerCase();
  const password = clean(body.password);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (supabaseAnon) {
    try {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
      if (!error && data?.user && data.user.user_metadata?.role === 'admin') {
        return res.json({
          token: `admin-${email}-token`,
          admin: {
            name: data.user.user_metadata?.name || '3Cs Care Admin',
            email,
            role: data.user.user_metadata?.role || 'Operations admin',
          },
        });
      }
    } catch (error) {
      console.error('Supabase admin login attempt failed:', error.message);
    }
  }

  const configuredAdminEmail = clean(process.env.ADMIN_EMAIL).toLowerCase();
  const configuredAdminPassword = String(process.env.ADMIN_PASSWORD || '');
  if (configuredAdminEmail && configuredAdminPassword && email === configuredAdminEmail && password === configuredAdminPassword) {
    return res.json({
      token: `admin-${configuredAdminEmail}-token`,
      admin: {
        name: '3Cs Care Admin',
        email,
        role: 'Operations admin',
      },
    });
  }

  return res.status(401).json({ error: 'Invalid admin credentials.' });
});

app.put('/api/admin/providers/:id/status', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  const providerId = String(req.params.id);
  const nextStatus = String(req.body?.status || '').toLowerCase();
  const allowedStatuses = ['pending', 'active', 'suspended'];

  if (!allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({ error: 'Status must be pending, active, or suspended.' });
  }

  const providerIndex = providers.findIndex((provider) => String(provider.id) === providerId);
  if (providerIndex === -1) {
    return res.status(404).json({ error: 'Provider not found.' });
  }

  providers[providerIndex].status = nextStatus;

  return res.json({
    message: `Provider status updated to ${nextStatus}.`,
    provider: buildProviderSnapshot(providers[providerIndex]),
  });
});

app.delete('/api/admin/providers/:id', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  try {
    const deleted = await deleteProviderRecord(String(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Provider not found.' });
    return res.json({ message: 'Provider deleted.' });
  } catch (error) {
    console.error('Provider deletion failed:', error.message);
    return res.status(500).json({ error: 'Unable to delete provider.' });
  }
});

app.put('/api/admin/leads/:id/status', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  const leadId = String(req.params.id);
  const nextStatus = String(req.body?.status || '').trim();
  const allowedStatuses = ['New', 'Qualified', 'Booked', 'Replied', 'Closed'];
  const normalized = nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1).toLowerCase();

  if (!allowedStatuses.includes(normalized)) {
    return res.status(400).json({ error: 'Status must be New, Qualified, Booked, Replied, or Closed.' });
  }

  try {
    const lead = await updateLeadRecord(leadId, { status: normalized }, { status: normalized.toLowerCase() });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    return res.json({ message: `Lead status updated to ${normalized}.`, lead });
  } catch (error) {
    console.error('Lead status update failed:', error.message);
    return res.status(500).json({ error: 'Unable to update lead status.' });
  }
});

app.put('/api/admin/leads/:id/match', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  const leadId = String(req.params.id);
  const providerName = clean(req.body?.providerName || 'Unassigned');
  const matchStatus = clean(req.body?.matchStatus || 'Matched');

  try {
    const lead = await updateLeadRecord(
      leadId,
      { providerName: providerName || 'Unassigned', matchStatus: matchStatus || 'Matched', status: 'Qualified' },
      { provider_name: providerName || 'Unassigned', match_status: matchStatus || 'Matched', status: 'qualified' },
    );
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    return res.json({ message: `Lead matched to ${lead.providerName}.`, lead });
  } catch (error) {
    console.error('Lead match update failed:', error.message);
    return res.status(500).json({ error: 'Unable to update lead match.' });
  }
});

app.put('/api/admin/leads/:id/followup', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  const leadId = String(req.params.id);
  const followUpStage = clean(req.body?.followUpStage || 'Pending');
  const adminNote = clean(req.body?.adminNote || '');

  try {
    const lead = await updateLeadRecord(
      leadId,
      { followUpStage: followUpStage || 'Pending', ...(adminNote ? { adminNote } : {}) },
      { follow_up_stage: followUpStage || 'Pending', ...(adminNote ? { admin_note: adminNote } : {}) },
    );
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    return res.json({ message: `Follow-up stage updated to ${lead.followUpStage}.`, lead });
  } catch (error) {
    console.error('Lead follow-up update failed:', error.message);
    return res.status(500).json({ error: 'Unable to update lead follow-up.' });
  }
});

app.put('/api/admin/leads/:id/rating', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  const leadId = String(req.params.id);
  const hasRating = req.body?.rating !== null && req.body?.rating !== undefined && req.body?.rating !== '';
  const rating = hasRating ? Number(req.body.rating) : null;
  const adminNote = clean(req.body?.adminNote || '');

  if (hasRating && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  try {
    const lead = await updateLeadRecord(
      leadId,
      {
        adminRating: rating,
        ...(hasRating ? { status: 'Closed' } : {}),
        ...(adminNote ? { adminNote } : {}),
      },
      {
        admin_rating: rating,
        ...(hasRating ? { status: 'closed' } : {}),
        ...(adminNote ? { admin_note: adminNote } : {}),
      },
    );
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    return res.json({ message: hasRating ? `Final rating recorded for ${lead.family}.` : `Final rating removed for ${lead.family}.`, lead });
  } catch (error) {
    console.error('Lead rating update failed:', error.message);
    return res.status(500).json({ error: 'Unable to record final rating.' });
  }
});

app.put('/api/admin/leads/:id/assign', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  const leadId = String(req.params.id);
  const providerName = clean(req.body?.providerName || 'Unassigned');
  try {
    const lead = await updateLeadRecord(
      leadId,
      { providerName: providerName || 'Unassigned' },
      { provider_name: providerName || 'Unassigned' },
    );
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    return res.json({ message: `Lead assigned to ${lead.providerName}.`, lead });
  } catch (error) {
    console.error('Lead assignment update failed:', error.message);
    return res.status(500).json({ error: 'Unable to assign lead.' });
  }
});

app.delete('/api/admin/leads/:id', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  try {
    const deleted = await deleteLeadRecord(String(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Lead not found.' });
    return res.json({ message: 'Lead deleted.' });
  } catch (error) {
    console.error('Lead deletion failed:', error.message);
    return res.status(500).json({ error: 'Unable to delete lead.' });
  }
});

app.get('/api/admin/dashboard', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }

  const providerList = await getProvidersFromDataSource();
  const leadList = await getLeadsFromDataSource();

  // Website submissions are stored as enquiries. They are still leads and must
  // be included in the dashboard totals and lead pipeline.
  const leadRecords = leadList;
  const enquiryRecords = leadList.filter((lead) => lead.recordType === 'enquiry');
  const totalLeads = leadRecords.length;
  const newLeads = leadRecords.filter((lead) => String(lead.status).toLowerCase() === 'new').length;
  const qualifiedLeads = leadRecords.filter((lead) => String(lead.status).toLowerCase() === 'qualified').length;
  const bookedLeads = leadRecords.filter((lead) => String(lead.status).toLowerCase() === 'booked').length;
  const pendingProviders = providerList.filter((provider) => String(provider.status).toLowerCase() === 'pending').length;
  const activeProviders = providerList.filter((provider) => String(provider.status).toLowerCase() === 'active').length;

  const matchedLeads = leadRecords.filter((lead) => String(lead.matchStatus || '').toLowerCase() === 'matched').length;
  const followUpActive = leadRecords.filter((lead) => String(lead.followUpStage || '').toLowerCase() !== 'pending').length;

  return res.json({
    dashboard: {
      summary: {
        totalLeads,
        providers: providerList.length,
        activeProviders,
        pendingProviders,
        newLeads,
        qualifiedLeads,
        bookedLeads,
        matchedLeads,
        followUpActive,
      },
      leads: leadRecords.slice(0, 8),
      enquiries: enquiryRecords.slice(0, 8),
      providers: providerList.slice(0, 6),
      overview: [
        ['New enquiries', String(newLeads)],
        ['Matched cases', String(matchedLeads)],
        ['Follow-up active', String(followUpActive)],
        ['Booked', String(bookedLeads)],
      ],
    },
  });
});

app.get('/api/provider/dashboard/:providerId', async (req, res) => {
  const token = getBearerToken(req);
  const providerId = String(req.params.providerId);
  const expectedProviderToken = `provider-${providerId}-token`;

  if (token !== expectedProviderToken) {
    return res.status(401).json({ error: 'Unauthorized. Provider session required.' });
  }

  const providerList = await getProvidersFromDataSource();
  const provider = providerList.find((item) => String(item.id) === providerId);
  if (!provider) {
    return res.status(404).json({ error: 'Provider dashboard not found.' });
  }

  const leadList = await getLeadsFromDataSource();
  const assignedLeads = leadList
    .filter((lead) => lead.providerName === provider.businessName || lead.providerName === 'Unassigned')
    .slice(0, 4)
    .map(({ contactEmail, phone, message, family, ...lead }) => ({
      ...lead,
      family: 'Private care opportunity',
      matchStatus: lead.matchStatus || 'Awaiting triage',
      followUpStage: lead.followUpStage || 'Pending',
    }));

  return res.json({
    provider: buildProviderSnapshot(provider),
    dashboard: {
      summary: {
        totalLeads: assignedLeads.length,
        conversionRate: '31%',
        responseTime: provider.responseTime,
        capacity: provider.capacity,
      },
      leads: assignedLeads,
    },
  });
});

app.post('/api/send-message', upload.single('cv'), async (req, res) => {
  let leadRecord = null;
  try {
    const body = req.body || {};
    const name = clean(body.name);
    const email = clean(body.email);
    const phone = clean(body.phone);
    const postcode = clean(body.postcode);
    const service = clean(body.service);
    const message = clean(body.message);
    const urgency = clean(body.urgency || 'Soon');
    const budget = clean(body.budget || 'TBC');
    const recordType = clean(body.recordType).toLowerCase() === 'enquiry' ? 'enquiry' : 'lead';

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }

    leadRecord = await persistLeadFromEnquiry({
      name,
      email,
      phone,
      postcode,
      service,
      message,
      urgency,
      budget,
      recordType,
    });

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
      return res.status(200).json({
        message: "Your enquiry was saved successfully and is ready for the admin team to review.",
        lead: leadRecord,
      });
    }

    const subject = `New Care Enquiry from ${name}`;
    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Postcode: ${postcode || "Not provided"}`,
      `Service: ${service || "Not selected"}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Care Enquiry</title>
</head>

<body style="margin:0;padding:30px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="700" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:14px;overflow:hidden;
box-shadow:0 8px 25px rgba(0,0,0,.08);">

<!-- Header -->
<tr>
<td style="background:#0d2240;padding:30px;text-align:center;">

<h1 style="margin:0;color:#ffffff;font-size:32px;">
3CS Care Services
</h1>

<p style="margin:10px 0 0;color:#b8ffd2;font-size:17px;">
New Care Enquiry Received
</p>

</td>
</tr>

<!-- Greeting -->
<tr>
<td style="padding:35px;">

<p style="font-size:17px;color:#333;margin-top:0;">
A new enquiry has been submitted through your website.
</p>

<!-- Client Information -->
<table width="100%" cellpadding="12" cellspacing="0"
style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">

<tr style="background:#f8fafc;">
<td width="180"><strong>Full Name</strong></td>
<td>${name}</td>
</tr>

<tr>
<td><strong>Email Address</strong></td>
<td>
<a href="mailto:${email}" style="color:#16a34a;text-decoration:none;">
${email}
</a>
</td>
</tr>

<tr style="background:#f8fafc;">
<td><strong>Phone Number</strong></td>
<td>${phone || "Not provided"}</td>
</tr>

<tr>
<td><strong>Postcode</strong></td>
<td>${postcode || "Not provided"}</td>
</tr>

<tr style="background:#f8fafc;">
<td><strong>Service Required</strong></td>
<td>${service || "Not selected"}</td>
</tr>

</table>

<!-- Message -->
<h2 style="margin-top:35px;color:#16a34a;font-size:22px;">
Client Message
</h2>

<div style="
background:#f8fafc;
padding:20px;
border-left:5px solid #16a34a;
border-radius:6px;
line-height:1.8;
font-size:15px;
color:#333;
">

${message.replace(/\n/g,"<br>")}

</div>

<!-- Attachment -->
${
req.file
? `
<h2 style="margin-top:35px;color:#16a34a;font-size:22px;">
Attached Document
</h2>

<div style="
background:#ecfdf5;
padding:15px;
border-radius:8px;
border:1px solid #bbf7d0;
font-size:15px;
">

📎 <strong>${req.file.originalname}</strong>

</div>
`
: ""
}

<!-- Buttons -->
<table width="100%" style="margin-top:40px;">
<tr>

<td align="center">

<a href="mailto:${email}"
style="
display:inline-block;
background:#16a34a;
color:#ffffff;
padding:14px 30px;
text-decoration:none;
border-radius:8px;
font-weight:bold;
margin-right:10px;
">
Reply to Client
</a>

${
phone
? `
<a href="tel:${phone}"
style="
display:inline-block;
background:#0d2240;
color:#ffffff;
padding:14px 30px;
text-decoration:none;
border-radius:8px;
font-weight:bold;
">
Call Client
</a>
`
: ""
}

</td>

</tr>
</table>

<hr style="margin:40px 0;border:none;border-top:1px solid #e5e7eb;">

<p style="font-size:13px;color:#777;text-align:center;line-height:1.6;">

This enquiry was submitted via the
<strong>3CS Care Services</strong> website.

<br><br>

Received on:
<strong>${new Date().toLocaleString("en-GB", {
  dateStyle: "full",
  timeStyle: "short",
})}</strong>

</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort === 587,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const attachments = [];
    if (req.file) {
      attachments.push({
        filename: req.file.originalname,
        content: req.file.buffer,
        contentType: req.file.mimetype,
      });
    }

    // A lead has already been saved. Do not make the visitor wait for the
    // mail provider before confirming their submission or updating admin.
    transporter.sendMail({
      from: fromEmail,
      to: TO_EMAIL,
      replyTo: email,
      subject,
      text,
      html,
      attachments,
    }).catch((error) => {
      console.error('Email delivery failed after lead was saved:', error.message);
    });

    return res.status(200).json({ ok: true, lead: leadRecord });
  } catch (error) {
    console.error('Email error:', error);
    console.error('req.body:', req.body);
    console.error('req.file:', req.file);
    return res.status(502).json({ error: "Email could not be sent.", details: error.message, lead: leadRecord });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

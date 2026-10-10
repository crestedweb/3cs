import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import process from 'node:process';
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'url';
import { Buffer } from 'node:buffer';
import { createClient } from '@supabase/supabase-js';
import { matchProviderToRequest, normalizePostcode } from './provider-matching.mjs';
import { calculateReferralEligibility, isProviderSessionFor } from './provider-policy.mjs';
import {
  createProviderId,
  createSubmissionId,
  getDestinationTable,
  isEnquiryRecord,
  normalizeRecordType,
  normalizeSubmissionRecordType,
} from './record-routing.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowed[extension] === file.mimetype) {
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
const supabaseAuth = supabaseAnon || supabaseAdmin;

const app = express();
const PORT = process.env.PORT || 3000;
const authSessions = new Map();
const revokedAdminSessions = new Set();
const revokedProviderSessions = new Set();
const adminSessionSecret = process.env.ADMIN_SESSION_SECRET
  || process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.ADMIN_PASSWORD;
const postcodeLookupCache = new Map();
const providerServiceOptions = ['Visiting/home care', 'Personal care', 'Live-in care', 'Overnight care', '24-hour care', 'Respite care', 'Emergency or urgent care', 'Hospital discharge and reablement', 'Companionship', 'Medication support', 'Domestic support', 'Complex care', 'Other'];
const providerCareNeedOptions = ['Older adults', 'Dementia', 'Complex care', 'Physical disabilities', 'Learning disabilities', 'Autism', 'Mental health needs', 'Palliative or end-of-life care', 'Nursing care', 'Other specialist needs'];
const normalizeSelections = (values, allowed) => [...new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter((value) => allowed.includes(value)))];

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('dist'));

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "info@3cscareservices.co.uk";
const DATA_FILE = path.join(__dirname, 'data', 'app-data.json');
const PROVIDER_DOCUMENTS_DIR = path.join(__dirname, 'data', 'provider-documents');

const defaultProviders = [
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

const defaultLeads = [
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

function ensureDataStore() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ providers: defaultProviders, leads: defaultLeads }, null, 2));
  }
}

function loadPersistedData() {
  ensureDataStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return {
      providers: Array.isArray(parsed.providers) ? parsed.providers : defaultProviders,
      leads: Array.isArray(parsed.leads) ? parsed.leads : defaultLeads,
    };
  } catch (error) {
    console.error('Failed to read persisted app data:', error.message);
    return { providers: defaultProviders, leads: defaultLeads };
  }
}

const persistedData = loadPersistedData();
let providers = [...persistedData.providers];
let leads = [...persistedData.leads];
const fallbackLeads = [];
let migratedLocalPasswords = false;
providers = providers.map((provider) => {
  const password = String(provider.password || '');
  if (!password || password.startsWith('scrypt:')) return provider;
  migratedLocalPasswords = true;
  return { ...provider, password: hashProviderPassword(password) };
});
if (migratedLocalPasswords) persistAppData();

function persistAppData() {
  try {
    ensureDataStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify({ providers, leads }, null, 2));
  } catch (error) {
    console.error('Failed to persist app data:', error.message);
  }
}

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

let cachedSessionSecret = adminSessionSecret;

function getSessionSigningSecret() {
  if (cachedSessionSecret) return cachedSessionSecret;
  const secretFile = path.join(path.dirname(DATA_FILE), 'session-signing-key');
  fs.mkdirSync(path.dirname(secretFile), { recursive: true });
  try {
    cachedSessionSecret = fs.readFileSync(secretFile, 'utf8').trim();
  } catch {
    const generatedSecret = randomBytes(32).toString('hex');
    try {
      fs.writeFileSync(secretFile, generatedSecret, { flag: 'wx', mode: 0o600 });
      cachedSessionSecret = generatedSecret;
    } catch {
      cachedSessionSecret = fs.readFileSync(secretFile, 'utf8').trim();
    }
  }
  return cachedSessionSecret;
}

function createSession(role, subject, email) {
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  const session = { role, subject: String(subject), email, expiresAt, sessionId: randomUUID() };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = createHmac('sha256', getSessionSigningSecret()).update(payload).digest('base64url');
  const token = `${role}.${payload}.${signature}`;
  authSessions.set(token, session);
  return token;
}

function getSignedSession(token) {
  const secret = getSessionSigningSecret();
  const [prefix, payload, signature, extra] = String(token || '').split('.');
  if (!['admin', 'provider'].includes(prefix) || !payload || !signature || extra) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let provided;
  try {
    provided = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (session.role !== prefix || !session.subject || !session.sessionId) return null;
    if (session.role === 'admin' && revokedAdminSessions.has(session.sessionId)) return null;
    if (session.role === 'provider' && revokedProviderSessions.has(session.sessionId)) return null;
    return session;
  } catch {
    return null;
  }
}

function getSession(req) {
  const token = getBearerToken(req);
  const session = token ? (authSessions.get(token) || getSignedSession(token)) : null;
  if (session && session.expiresAt > Date.now()) return session;
  if (token) authSessions.delete(token);
  return null;
}

app.post('/api/logout', (req, res) => {
  const token = getBearerToken(req);
  const session = token ? getSession(req) : null;
  if (session?.role === 'admin' && session.sessionId) revokedAdminSessions.add(session.sessionId);
  if (session?.role === 'provider' && session.sessionId) revokedProviderSessions.add(session.sessionId);
  if (token) authSessions.delete(token);
  return res.json({ ok: true });
});

function isConfiguredAdminRequest(req) {
  return getSession(req)?.role === 'admin';
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
    accountStatus: row.account_status || row.accountStatus || row.status || 'pending',
    verificationStatus: row.verification_status || row.verificationStatus || (row.verified ? 'verified' : 'incomplete'),
    referralEligibility: row.referral_eligibility || row.referralEligibility || 'temporarily_ineligible',
    profileData: row.profile_data || row.profileData || {},
  };
}

function hashProviderPassword(password) {
  const salt = randomUUID();
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function providerPasswordMatches(stored, supplied) {
  const parts = String(stored || '').split(':');
  if (parts.length === 3 && parts[0] === 'scrypt') {
    const expected = Buffer.from(parts[2], 'hex');
    const actual = scryptSync(supplied, parts[1], 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
  // Keep existing local demo accounts usable; new local registrations are hashed.
  return String(stored || '') === supplied;
}

function normalizeLead(row) {
  const storedMessage = row.message || '';
  const sourceMatch = storedMessage.match(/^\[(lead|enquiry)\]\s*/i);
  const explicitRecordType = clean(row.record_type || row.recordType || '').toLowerCase();
  const recordType = sourceMatch?.[1]?.toLowerCase()
    || explicitRecordType
    || normalizeRecordType(row.record_type || row.recordType || '', 'lead');
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
    activity: Array.isArray(row.case_activity || row.activity) ? (row.case_activity || row.activity) : [],
    createdAt: row.created_at || row.createdAt,
    contactEmail: row.contact_email || row.contactEmail || '',
    phone: row.phone || '',
    message,
    recordType,
  };
}

function buildLeadFromEnquiry(body = {}) {
  const family = clean(body.family || body.name || 'Unknown family');
  const need = clean(body.need || body.service || body.careNeed || 'Care support');
  const area = clean(body.area || body.postcode || 'Not set');
  const recordType = normalizeSubmissionRecordType(body);

  return {
    id: createSubmissionId(),
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
    activity: [{ at: new Date().toISOString(), action: 'Enquiry submitted', actor: 'System' }],
    createdAt: new Date().toISOString(),
    contactEmail: clean(body.email || ''),
    phone: clean(body.phone || ''),
    message: clean(body.message || ''),
    recordType,
  };
}

async function persistLeadFromEnquiry(body = {}) {
  const nextLead = buildLeadFromEnquiry(body);

  if (supabase) {
    const destinationTable = getDestinationTable(nextLead.recordType);
    const { data, error } = await supabase.from(destinationTable).insert([{
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
      record_type: nextLead.recordType,
      created_at: nextLead.createdAt,
      case_activity: nextLead.activity,
    }]).select();

    if (!error && data && data[0]) {
      const normalizedLead = normalizeLead({
        ...data[0],
        recordType: nextLead.recordType,
        message: `[${nextLead.recordType}] ${nextLead.message}`,
      });
      return normalizedLead;
    }

    if (error) {
      throw new Error(`Supabase ${destinationTable} insert failed: ${error.message}`);
    }
  }

  if (supabase) {
    throw new Error(`Supabase ${getDestinationTable(nextLead.recordType)} did not return a saved record.`);
  }

  leads.unshift(nextLead);
  fallbackLeads.unshift(nextLead);
  persistAppData();
  return nextLead;
}

async function getProvidersFromDataSource() {
  if (supabase) {
    const { data, error } = await supabase.from('providers').select('*').order('created_at', { ascending: false });
    if (error) {
      throw new Error(`Supabase providers query failed: ${error.message}`);
    }

    return (data || []).map(normalizeProvider).map(buildProviderSnapshot);
  }

  return providers.map(buildProviderSnapshot);
}

async function getLeadsFromDataSource() {
  if (supabase) {
    const databaseLeads = [];
    const tableNames = ['leads', 'enquiries'];
    for (const tableName of tableNames) {
      const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
      if (error) {
        if (tableName === 'leads') throw new Error(`Supabase ${tableName} query failed: ${error.message}`);
        // The current schema stores contact, care-finder, and other submissions
        // in `leads`. Keep legacy `enquiries` records visible when that table
        // exists, but its absence must not hide every admin dashboard section.
        console.warn('Legacy Supabase enquiries table unavailable:', error.message);
        continue;
      }
      const defaultRecordType = tableName === 'enquiries' ? 'enquiry' : 'lead';
      databaseLeads.push(...(data || []).map((row) => normalizeLead({
        ...row,
        // The stamped message prefix is written by the submission handler and
        // is more reliable than a stale contradictory record_type value.
        record_type: (row.message?.match(/^\[(lead|enquiry)\]/i)?.[1]) || row.record_type || defaultRecordType,
      })));
    }

    return databaseLeads.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  const combined = [...leads, ...fallbackLeads];
  const uniqueById = new Map();
  for (const lead of combined) {
    if (!lead?.id) continue;
    const key = String(lead.id);
    const existing = uniqueById.get(key);
    const existingDate = new Date(existing?.createdAt || 0).getTime();
    const candidateDate = new Date(lead.createdAt || 0).getTime();
    if (!existing || candidateDate > existingDate) {
      uniqueById.set(key, lead);
    }
  }

  return [...uniqueById.values()]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

async function updateLeadRecord(leadId, localUpdates, databaseUpdates) {
  const activityAt = new Date().toISOString();
  const makeActivityEntries = (previous = {}) => {
    const entries = [];
    const changed = (key, oldValue) => Object.hasOwn(localUpdates, key) && String(localUpdates[key] ?? '') !== String(oldValue ?? '');
    if (changed('status', previous.status)) entries.push({ at: activityAt, action: `Status changed to ${localUpdates.status}`, actor: 'Admin' });
    if (changed('providerName', previous.providerName)) entries.push({ at: activityAt, action: `Provider assignment changed to ${localUpdates.providerName}`, actor: 'Admin' });
    if (changed('followUpStage', previous.followUpStage)) entries.push({ at: activityAt, action: `Follow-up set to ${localUpdates.followUpStage}`, actor: 'Admin' });
    if (changed('adminNote', previous.adminNote)) entries.push({ at: activityAt, action: 'Internal note updated', actor: 'Admin' });
    if (changed('adminRating', previous.adminRating)) entries.push({ at: activityAt, action: `Final rating ${localUpdates.adminRating ? `set to ${localUpdates.adminRating}/5` : 'cleared'}`, actor: 'Admin' });
    return entries;
  };

  if (supabase) {
    const { data: existing, error: existingError } = await supabase
      .from('leads')
      .select('case_activity,status,provider_name,follow_up_stage,admin_note,admin_rating')
      .eq('id', leadId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (!existing) return null;
    const activityEntries = makeActivityEntries({
      status: existing.status,
      providerName: existing.provider_name,
      followUpStage: existing.follow_up_stage,
      adminNote: existing.admin_note,
      adminRating: existing.admin_rating,
    });
    const caseActivity = [...(Array.isArray(existing.case_activity) ? existing.case_activity : []), ...activityEntries].slice(-100);
    const { data, error } = await supabase
      .from('leads')
      .update({ ...databaseUpdates, case_activity: caseActivity })
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
      persistAppData();
      return updatedLead;
    }
  }

  const leadIndex = leads.findIndex((lead) => String(lead.id) === String(leadId));
  if (leadIndex === -1) {
    return null;
  }

  const activityEntries = makeActivityEntries(leads[leadIndex]);
  Object.assign(leads[leadIndex], localUpdates);
  leads[leadIndex].activity = [...(leads[leadIndex].activity || []), ...activityEntries].slice(-100);
  persistAppData();
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
  persistAppData();
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
  persistAppData();
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
  const business = provider.profileData?.business || {};
  return {
    id: provider.id,
    name: business.contactName || provider.name,
    businessName: business.providerName || provider.businessName,
    email: provider.email,
    phone: provider.phone,
    cqcRegistration: provider.cqcRegistration,
    serviceType: provider.profileData?.services?.join(', ') || provider.serviceType,
    area: provider.area,
    verified: provider.verificationStatus === 'verified',
    rating: provider.rating,
    responseTime: provider.responseTime,
    capacity: provider.profileData?.availability ? `${Number(provider.profileData.availability.capacity || 0)} new clients` : provider.capacity,
    status: provider.status,
    accountStatus: provider.accountStatus || provider.status || 'pending',
    verificationStatus: provider.verificationStatus || 'incomplete',
    referralEligibility: provider.referralEligibility || 'temporarily_ineligible',
    profileData: provider.profileData || {},
    createdAt: provider.createdAt,
  };
}

async function lookupPostcodeCoordinates(value) {
  const postcode = normalizePostcode(value);
  if (!postcode) return null;
  if (postcodeLookupCache.has(postcode)) return postcodeLookupCache.get(postcode);
  const lookup = (async () => {
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s/g, ''))}`, { signal: AbortSignal.timeout(5000) });
    const payload = await response.json();
    const result = payload?.result;
    if (!response.ok || !Number.isFinite(result?.latitude) || !Number.isFinite(result?.longitude)) return null;
    return { latitude: result.latitude, longitude: result.longitude, postcode: result.postcode, outcode: result.outcode, areaName: result.parish || result.admin_district };
  } catch { return null; }
  })();
  postcodeLookupCache.set(postcode, lookup);
  if (postcodeLookupCache.size > 1000) postcodeLookupCache.delete(postcodeLookupCache.keys().next().value);
  const result = await lookup;
  if (!result) postcodeLookupCache.delete(postcode);
  return result;
}

async function getMatchesForLead(lead, providerList) {
  const postcode = String(lead.area || '').match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i)?.[0]
    || ( /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(String(lead.area || '').trim()) ? String(lead.area).trim() : '' );
  const coordinates = await lookupPostcodeCoordinates(postcode);
  const arrangement = String(lead.message || '').match(/(?:^|\|\s*)Arrangement:\s*([^|]+)/i)?.[1]?.trim().toLowerCase() || '';
  const serviceMap = { 'visiting care': 'visiting/home care', 'personal care': 'personal care', 'live-in care': 'live-in care', 'overnight care': 'overnight care', '24-hour care': '24-hour care' };
  const needServiceMap = { 'personal care': 'personal care', 'complex care': 'complex care', companionship: 'companionship', 'medication support': 'medication support', 'domestic support': 'domestic support', 'respite care': 'respite care', 'hospital discharge and rehabilitation': 'hospital discharge and reablement', 'other care support': 'other' };
  const careNeedMap = {
    'dementia support': ['dementia'],
    'complex care': ['complex care'],
    'learning disability and autism support': ['learning disabilities', 'autism'],
  };
  const urgency = String(lead.urgency || '').toLowerCase();
  const requestedWithinDays = urgency.includes('as soon') || urgency === 'urgent' || urgency === 'immediately' ? 0
    : urgency.includes('2 week') ? 14
      : urgency.includes('week') ? 7
        : urgency.includes('month') || urgency.includes('exploring') ? 30
          : 7;
  const requestedDateValue = new Date();
  requestedDateValue.setDate(requestedDateValue.getDate() + requestedWithinDays);
  const requestedDate = `${requestedDateValue.getFullYear()}-${String(requestedDateValue.getMonth() + 1).padStart(2, '0')}-${String(requestedDateValue.getDate()).padStart(2, '0')}`;
  const request = {
    postcode,
    coordinates,
    service: lead.serviceType || serviceMap[arrangement] || needServiceMap[String(lead.need || '').toLowerCase()] || '',
    careNeeds: lead.careNeeds || careNeedMap[String(lead.need || '').toLowerCase()] || [],
    areaName: coordinates?.areaName || '',
    requestedDate,
  };
  return providerList.map((provider) => ({ provider: buildProviderSnapshot(provider), areaName: coordinates?.areaName || '', outcode: coordinates?.outcode || '', ...matchProviderToRequest(provider, request) }));
}

async function sendProviderRegistrationEmail(provider) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL || provider.email;

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    console.info('Provider registration email skipped: SMTP is not configured.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort === 587,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const subject = `New provider registration received: ${provider.businessName}`;
  const text = [
    `Provider: ${provider.name}`,
    `Business: ${provider.businessName}`,
    `Email: ${provider.email}`,
    `Phone: ${provider.phone || 'Not provided'}`,
    `CQC registration: ${provider.cqcRegistration || 'Not provided'}`,
    `Service type: ${provider.serviceType}`,
    `Area: ${provider.area}`,
    `Status: ${provider.status}`,
  ].join('\n');

  await transporter.sendMail({
    from: fromEmail,
    to: toEmail,
    replyTo: provider.email,
    subject,
    text,
  });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: '3CS marketplace API is online.' });
});

app.get('/api/providers', async (req, res) => {
  const providerList = await getProvidersFromDataSource();
  res.json({ providers: providerList.map((provider) => ({ ...buildProviderSnapshot(provider), profileData: undefined })) });
});

app.get('/api/locations/postcode/:postcode', async (req, res) => {
  const postcode = normalizePostcode(req.params.postcode);
  if (!postcode) return res.status(400).json({ error: 'Enter a valid UK postcode.' });
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s/g, ''))}`, { signal: AbortSignal.timeout(5000) });
    const payload = await response.json();
    if (!response.ok || !payload?.result) return res.status(404).json({ error: 'Postcode was not found. Check it and try again.' });
    const result = payload.result;
    return res.json({ location: { postcode: result.postcode, country: result.country, areaName: result.parish || result.admin_district, latitude: result.latitude, longitude: result.longitude, outcode: result.outcode } });
  } catch {
    return res.status(503).json({ error: 'Postcode lookup is temporarily unavailable. Try again later.' });
  }
});

app.get('/api/locations/outcode/:outcode', async (req, res) => {
  const outcode = clean(req.params.outcode).toUpperCase();
  if (!/^[A-Z]{1,2}\d[A-Z\d]?$/.test(outcode)) return res.status(400).json({ error: 'Enter a valid UK postcode district.' });
  try {
    const response = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`, { signal: AbortSignal.timeout(5000) });
    const payload = await response.json();
    const result = payload?.result;
    if (!response.ok || !result) return res.status(404).json({ error: 'Postcode district was not found.' });
    return res.json({ location: { id: `outcode-${outcode}`, name: `${outcode} postcode district`, outcode, kind: 'postcode-district' } });
  } catch { return res.status(503).json({ error: 'Postcode district lookup is temporarily unavailable.' }); }
});

app.get('/api/locations/search', async (req, res) => {
  const query = clean(req.query.q);
  if (query.length < 2) return res.json({ locations: [] });
  try {
    const response = await fetch(`https://api.postcodes.io/places?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(5000) });
    const payload = await response.json();
    const locations = (payload?.result || []).slice(0, 8).map((item) => ({ id: item.code, name: item.name_1, aliases: item.name_2 ? [item.name_2] : [], kind: 'place', outcode: item.outcode || '', latitude: Number(item.latitude) || null, longitude: Number(item.longitude) || null }));
    return res.json({ locations });
  } catch {
    return res.status(503).json({ error: 'Location search is temporarily unavailable.' });
  }
});

app.get('/api/providers/:id', async (req, res) => {
  const providerList = await getProvidersFromDataSource();
  const provider = providerList.find((item) => String(item.id) === String(req.params.id));
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found.' });
  }

  return res.json({ provider: { ...buildProviderSnapshot(provider), profileData: undefined } });
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
  const submittedProfileData = body.profileData && typeof body.profileData === 'object' ? body.profileData : {};
  const submittedServices = normalizeSelections(submittedProfileData.services, providerServiceOptions);
  const submittedCareNeeds = normalizeSelections(submittedProfileData.careNeeds, providerCareNeedOptions);
  const businessTypes = ['limited_company', 'sole_trader', 'partnership', 'charity', 'other'];

  if (!name || !businessName || !email || !phone || !serviceType || !area || !businessTypes.includes(submittedProfileData.business?.type) || !submittedProfileData.coverage?.basePostcode || !submittedServices.length || !submittedCareNeeds.length || body.termsAccepted !== true) {
    return res.status(400).json({ error: 'Complete the contact, business, service, and main office postcode fields.' });
  }

  const normalizedBasePostcode = normalizePostcode(submittedProfileData.coverage.basePostcode);
  if (!normalizedBasePostcode) return res.status(400).json({ error: 'Enter a valid UK main office postcode.' });
  const initialRadius = Number(submittedProfileData.coverage.radiusMiles || 0);
  if (!Number.isFinite(initialRadius) || initialRadius < 0 || initialRadius > 250) return res.status(400).json({ error: 'Travel radius must be between 0 and 250 miles.' });
  if (submittedProfileData.registration?.cqcRegistered && !clean(submittedProfileData.registration?.cqcRegistration)) return res.status(400).json({ error: 'CQC registration details are required when marked CQC registered.' });

  if (password.length < 10) {
    return res.status(400).json({ error: 'Password must be at least 10 characters long.' });
  }

  const baseLocation = await lookupPostcodeCoordinates(normalizedBasePostcode);
  const profileData = {
    ...submittedProfileData,
    services: submittedServices,
    careNeeds: submittedCareNeeds,
    coverage: { ...submittedProfileData.coverage, basePostcode: normalizedBasePostcode, baseCoordinates: baseLocation ? { latitude: baseLocation.latitude, longitude: baseLocation.longitude } : null, baseArea: baseLocation?.areaName || '' },
    consent: { providerTermsAccepted: true, acceptedAt: new Date().toISOString() },
  };

  const providerList = await getProvidersFromDataSource();
  const existingProvider = providerList.find((provider) => String(provider.email || '').toLowerCase() === email);
  if (existingProvider) {
    return res.status(409).json({ error: 'A provider with this email already exists.' });
  }

  const newProvider = {
    id: createProviderId(),
    name,
    businessName,
    email,
    phone,
    cqcRegistration,
    serviceType,
    area,
    verified: false,
    rating: 0,
    responseTime: '< 1 hour',
    capacity: 'Open for leads',
    status: 'pending',
    accountStatus: 'pending',
    verificationStatus: 'pending_review',
    referralEligibility: 'temporarily_ineligible',
    profileData: {
      ...profileData,
      coverage: { ...(profileData.coverage || {}), basePostcode: normalizedBasePostcode },
    },
    password: supabaseAdmin ? undefined : hashProviderPassword(password),
    createdAt: new Date().toISOString(),
  };

  let savedProvider = newProvider;
  let source = 'local';
  let createdAuthUserId = null;
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
        throw new Error(authError.message);
      }
      createdAuthUserId = authData?.user?.id || null;

      const { data, error } = await supabase.from('providers').insert([{
        name,
        business_name: businessName,
        email,
        phone,
        cqc_registration: cqcRegistration,
        service_type: serviceType,
          area,
          profile_data: newProvider.profileData,
          account_status: 'pending',
          verification_status: 'pending_review',
          referral_eligibility: 'temporarily_ineligible',
          verified: false,
          rating: 0,
        response_time: '< 1 hour',
        status: 'pending',
      }]).select();

      if (error) {
        throw new Error(error.message);
      }
      if (!data?.[0]) {
        throw new Error('Supabase did not return the saved provider record.');
      }

      savedProvider = normalizeProvider(data[0]);
      source = 'supabase';
    } catch (error) {
      console.error('Supabase provider registration failed:', error.message);
      if (createdAuthUserId) await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId).catch(() => {});
      return res.status(500).json({
        error: 'Provider registration could not be saved to Supabase.',
        details: error.message,
      });
    }
  }

  if (!supabaseAdmin) {
    providers.push(newProvider);
    persistAppData();
  }

  try {
    await sendProviderRegistrationEmail(savedProvider);
  } catch (error) {
    console.error('Provider registration email failed:', error.message);
  }

  return res.status(201).json({
    message: `Provider registered successfully in ${source}. ${source === 'supabase' ? 'The provider is available in the admin dashboard.' : 'The provider is available in the local fallback store.'}`,
    provider: buildProviderSnapshot(savedProvider),
  });
});

app.put('/api/providers/:id/profile', async (req, res) => {
  const providerId = String(req.params.id);
  if (!isProviderSessionFor(getSession(req), providerId)) return res.status(401).json({ error: 'Unauthorized. Provider session required.' });
  const profileData = req.body?.profileData;
  if (!profileData || typeof profileData !== 'object' || !profileData.coverage || !Array.isArray(profileData.coverage.locations)) {
    return res.status(400).json({ error: 'A structured provider profile and service-area list are required.' });
  }
  const providerList = await getProvidersFromDataSource();
  const current = providerList.find((item) => String(item.id) === providerId);
  if (!current) return res.status(404).json({ error: 'Provider not found.' });
  const basePostcode = normalizePostcode(profileData.coverage.basePostcode || current.profileData?.coverage?.basePostcode);
  const radiusMiles = Number(profileData.coverage.radiusMiles || 0);
  if (!basePostcode || !Number.isFinite(radiusMiles) || radiusMiles < 0 || radiusMiles > 250) return res.status(400).json({ error: 'Check the main office postcode and enter a travel radius from 0 to 250 miles.' });
  const selectedLocations = [...(profileData.coverage.locations || []), ...(profileData.coverage.exclusions || [])];
  if (selectedLocations.some((item) => !item || typeof item.id !== 'string' || typeof item.name !== 'string')) return res.status(400).json({ error: 'Service-area entries must be selected UK locations.' });
  const lookedUpBase = await lookupPostcodeCoordinates(basePostcode);
  const sameBase = basePostcode === current.profileData?.coverage?.basePostcode;
  const nextProfile = {
    ...(current.profileData || {}),
    business: {
      ...(current.profileData?.business || {}),
      legalName: String(profileData.business?.legalName || ''),
      type: ['limited_company', 'sole_trader', 'partnership', 'charity', 'other'].includes(profileData.business?.type) ? profileData.business.type : current.profileData?.business?.type || '',
      companiesHouseNumber: String(profileData.business?.companiesHouseNumber || ''),
      website: String(profileData.business?.website || ''),
      address: String(profileData.business?.address || ''),
      contactName: String(profileData.business?.contactName || current.name),
      providerName: String(profileData.business?.providerName || current.businessName),
      phone: String(profileData.business?.phone || current.phone || ''),
    },
    registration: {
      nation: ['England', 'Wales', 'Scotland', 'Northern Ireland'].includes(profileData.registration?.nation)
        ? profileData.registration.nation : current.profileData?.registration?.nation || 'England',
      regulator: ({ England: 'CQC', Wales: 'Care Inspectorate Wales', Scotland: 'Care Inspectorate Scotland', 'Northern Ireland': 'RQIA' })[profileData.registration?.nation] || current.profileData?.registration?.regulator || 'CQC',
      isRegistered: profileData.registration?.isRegistered === true,
      cqcRegistered: (profileData.registration?.nation || current.profileData?.registration?.nation || 'England') === 'England' && profileData.registration?.isRegistered === true,
      registrationDetails: String(profileData.registration?.registrationDetails || ''),
      cqcRegistration: (profileData.registration?.nation || current.profileData?.registration?.nation || 'England') === 'England' ? String(profileData.registration?.registrationDetails || '') : '',
      otherRegistration: (profileData.registration?.nation || current.profileData?.registration?.nation || 'England') === 'England' ? '' : String(profileData.registration?.registrationDetails || ''),
      locationIds: Array.isArray(profileData.registration?.locationIds) ? [...new Set(profileData.registration.locationIds.map(String).map((item) => item.trim()).filter(Boolean))] : [],
      cqcLocationIds: (profileData.registration?.nation || current.profileData?.registration?.nation || 'England') === 'England' && Array.isArray(profileData.registration?.locationIds) ? [...new Set(profileData.registration.locationIds.map(String).map((item) => item.trim()).filter(Boolean))] : [],
      registeredManager: String(profileData.registration?.registeredManager || ''),
      regulatedActivities: Array.isArray(profileData.registration?.regulatedActivities) ? [...new Set(profileData.registration.regulatedActivities.map(String).map((item) => item.trim()).filter(Boolean))] : [],
      verificationSource: 'Self-declared; pending manual verification',
    },
    coverage: {
      ...(current.profileData?.coverage || {}),
      ...profileData.coverage,
      basePostcode,
      radiusMiles,
      baseCoordinates: lookedUpBase ? { latitude: lookedUpBase.latitude, longitude: lookedUpBase.longitude } : (sameBase ? current.profileData?.coverage?.baseCoordinates || null : null),
      baseArea: lookedUpBase?.areaName || (sameBase ? current.profileData?.coverage?.baseArea || '' : ''),
      locations: [...new Map((profileData.coverage.locations || []).map((item) => [item.id, item])).values()],
      exclusions: [...new Map((profileData.coverage.exclusions || []).map((item) => [item.id, item])).values()],
    },
    services: Array.isArray(profileData.services) ? normalizeSelections(profileData.services, providerServiceOptions) : current.profileData?.services || [],
    careNeeds: Array.isArray(profileData.careNeeds) ? normalizeSelections(profileData.careNeeds, providerCareNeedOptions) : current.profileData?.careNeeds || [],
    serviceDescription: String(profileData.serviceDescription || ''),
    specialisms: Array.isArray(profileData.specialisms) ? profileData.specialisms : [],
    minimumPackage: String(profileData.minimumPackage || ''),
    minimumVisit: String(profileData.minimumVisit || ''),
    indicativePrice: String(profileData.indicativePrice || ''),
    availability: profileData.availability && typeof profileData.availability === 'object' ? profileData.availability : current.profileData?.availability || {},
    compliance: {
      ...(current.profileData?.compliance || {}),
      insurance: profileData.compliance?.insurance && typeof profileData.compliance.insurance === 'object'
        ? { publicLiabilityExpiry: String(profileData.compliance.insurance.publicLiabilityExpiry || ''), employersLiabilityExpiry: String(profileData.compliance.insurance.employersLiabilityExpiry || ''), indemnityExpiry: String(profileData.compliance.insurance.indemnityExpiry || '') }
        : current.profileData?.compliance?.insurance || {},
      policies: profileData.compliance?.policies && typeof profileData.compliance.policies === 'object'
        ? Object.fromEntries(['safeguarding', 'complaints', 'medication', 'infectionControl'].map((key) => [key, profileData.compliance.policies[key] === true]))
        : current.profileData?.compliance?.policies || {},
    },
  };
  const identityChanged = ['contactName', 'providerName', 'legalName', 'type', 'companiesHouseNumber'].some((key) => String(nextProfile.business?.[key] || '') !== String(current.profileData?.business?.[key] || ''));
  const registrationSummary = (value = {}) => ({
    nation: value.nation || 'England',
    isRegistered: value.isRegistered === true || value.cqcRegistered === true,
    registrationDetails: String(value.registrationDetails || (value.nation === 'England' ? value.cqcRegistration : value.otherRegistration) || ''),
    locationIds: [...(value.locationIds || value.cqcLocationIds || value.otherLocationIds || [])].map(String),
    registeredManager: String(value.registeredManager || ''),
    regulatedActivities: [...(value.regulatedActivities || [])].map(String),
  });
  const registrationChanged = JSON.stringify(registrationSummary(nextProfile.registration)) !== JSON.stringify(registrationSummary(current.profileData?.registration));
  const nextVerificationStatus = identityChanged || registrationChanged ? 'pending_review' : current.verificationStatus;
  const referralEligibility = calculateReferralEligibility(current.status, nextVerificationStatus, nextProfile);
  if (supabase) {
    const { data, error } = await supabase.from('providers').update({ profile_data: nextProfile, name: nextProfile.business.contactName, business_name: nextProfile.business.providerName, phone: nextProfile.business.phone, verification_status: nextVerificationStatus, referral_eligibility: referralEligibility }).eq('id', providerId).select();
    if (error) return res.status(500).json({ error: 'Unable to save provider profile.', details: error.message });
    if (!data?.[0]) return res.status(404).json({ error: 'Provider not found.' });
    const saved = normalizeProvider(data[0]);
    return res.json({ provider: buildProviderSnapshot(saved) });
  }
  const target = providers.find((item) => String(item.id) === providerId);
  if (!target) return res.status(404).json({ error: 'Provider not found.' });
  target.name = nextProfile.business.contactName;
  target.businessName = nextProfile.business.providerName;
  target.phone = nextProfile.business.phone;
  target.profileData = nextProfile;
  target.verificationStatus = nextVerificationStatus;
  target.referralEligibility = referralEligibility;
  persistAppData();
  return res.json({ provider: buildProviderSnapshot(target) });
});

app.post('/api/providers/:id/documents', upload.single('document'), async (req, res) => {
  const providerId = String(req.params.id);
  if (!isProviderSessionFor(getSession(req), providerId)) return res.status(401).json({ error: 'Unauthorized. Provider session required.' });
  if (!req.file) return res.status(400).json({ error: 'Select a PDF, DOC, or DOCX document under 5 MB.' });
  const buffer = req.file.buffer;
  const extension = path.extname(req.file.originalname).toLowerCase();
  const validSignature = extension === '.pdf' ? buffer.subarray(0, 5).toString() === '%PDF-'
    : extension === '.doc' ? buffer.subarray(0, 8).equals(Buffer.from('D0CF11E0A1B11AE1', 'hex'))
      : extension === '.docx' && buffer.subarray(0, 2).toString() === 'PK';
  if (!validSignature) return res.status(400).json({ error: 'The file contents do not match the selected document type.' });
  const providerList = await getProvidersFromDataSource();
  const provider = providerList.find((item) => String(item.id) === providerId);
  if (!provider) return res.status(404).json({ error: 'Provider not found.' });
  const allowedDocumentTypes = ['public_liability', 'employers_liability', 'professional_indemnity', 'safeguarding', 'complaints', 'medication', 'infection_control', 'registration', 'other'];
  const documentType = allowedDocumentTypes.includes(String(req.body?.documentType)) ? String(req.body.documentType) : 'other';
  let storagePath;
  if (supabase) {
    const bucket = process.env.PROVIDER_DOCUMENTS_BUCKET || 'provider-documents';
    storagePath = `${providerId}/${randomUUID()}-${path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    let { error: storageError } = await supabase.storage.from(bucket).upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (storageError && /bucket.*not found|not found.*bucket/i.test(storageError.message || '')) {
      await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });
      ({ error: storageError } = await supabase.storage.from(bucket).upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false }));
    }
    if (storageError) {
      console.error(`Provider document storage failed for ${providerId}:`, storageError.message);
      return res.status(500).json({ error: 'Unable to securely store this document.', details: storageError.message });
    }
  } else {
    fs.mkdirSync(PROVIDER_DOCUMENTS_DIR, { recursive: true });
    const localName = `${randomUUID()}${extension}`;
    storagePath = `local:${localName}`;
    fs.writeFileSync(path.join(PROVIDER_DOCUMENTS_DIR, localName), req.file.buffer, { flag: 'wx' });
  }
  const document = { id: randomUUID(), type: documentType, name: path.basename(req.file.originalname), mimeType: req.file.mimetype, size: req.file.size, storagePath, uploadedAt: new Date().toISOString(), reviewStatus: 'pending' };
  const profileData = { ...(provider.profileData || {}), compliance: { ...(provider.profileData?.compliance || {}), documents: [...(provider.profileData?.compliance?.documents || []), document] } };
  const referralEligibility = calculateReferralEligibility(provider.status, provider.verificationStatus, profileData);
  if (supabase) {
    const { data, error } = await supabase.from('providers').update({ profile_data: profileData, referral_eligibility: referralEligibility }).eq('id', providerId).select();
    if (error || !data?.[0]) {
      if (!storagePath.startsWith('local:')) await supabase.storage.from(process.env.PROVIDER_DOCUMENTS_BUCKET || 'provider-documents').remove([storagePath]);
      return res.status(500).json({ error: 'Document was uploaded but could not be attached to the provider profile.', details: error?.message });
    }
    return res.status(201).json({ document, provider: buildProviderSnapshot(normalizeProvider(data[0])) });
  }
  const localProvider = providers.find((item) => String(item.id) === providerId);
  if (!localProvider) return res.status(404).json({ error: 'Provider not found.' });
  localProvider.profileData = profileData;
  localProvider.referralEligibility = referralEligibility;
  persistAppData();
  return res.status(201).json({ document, provider: buildProviderSnapshot(localProvider) });
});

app.get('/api/admin/providers/:providerId/documents/:documentId/url', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  const provider = (await getProvidersFromDataSource()).find((item) => String(item.id) === String(req.params.providerId));
  const document = provider?.profileData?.compliance?.documents?.find((item) => item.id === req.params.documentId);
  if (!document) return res.status(404).json({ error: 'Document not found.' });
  const { data, error } = await supabase.storage.from(process.env.PROVIDER_DOCUMENTS_BUCKET || 'provider-documents').createSignedUrl(document.storagePath, 60);
  if (error) return res.status(500).json({ error: 'Unable to access provider document.' });
  return res.json({ url: data.signedUrl });
});

app.get('/api/admin/providers/:providerId/documents/:documentId/file', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  const provider = (await getProvidersFromDataSource()).find((item) => String(item.id) === String(req.params.providerId));
  const document = provider?.profileData?.compliance?.documents?.find((item) => item.id === req.params.documentId);
  if (!document) return res.status(404).json({ error: 'Document not found.' });
  if (document.storagePath?.startsWith('local:')) {
    const localName = path.basename(document.storagePath.slice('local:'.length));
    if (!/^[0-9a-f-]+\.(pdf|doc|docx)$/i.test(localName)) return res.status(400).json({ error: 'Invalid document path.' });
    const fullPath = path.join(PROVIDER_DOCUMENTS_DIR, localName);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Stored document file not found.' });
    return res.type(document.mimeType || 'application/octet-stream').download(fullPath, document.name);
  }
  if (!supabase) return res.status(503).json({ error: 'Document storage is unavailable.' });
  const { data, error } = await supabase.storage.from(process.env.PROVIDER_DOCUMENTS_BUCKET || 'provider-documents').download(document.storagePath);
  if (error || !data) return res.status(500).json({ error: 'Unable to access provider document.' });
  res.type(document.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(document.name)}"`);
  return res.send(Buffer.from(await data.arrayBuffer()));
});

app.put('/api/admin/providers/:providerId/documents/:documentId', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  const reviewStatus = String(req.body?.reviewStatus || '').toLowerCase();
  if (!['reviewed', 'rejected'].includes(reviewStatus)) return res.status(400).json({ error: 'Document review status must be reviewed or rejected.' });
  const providerList = await getProvidersFromDataSource();
  const provider = providerList.find((item) => String(item.id) === String(req.params.providerId));
  if (!provider) return res.status(404).json({ error: 'Provider not found.' });
  const documents = provider.profileData?.compliance?.documents || [];
  const updatedDocuments = documents.map((item) => item.id === req.params.documentId ? { ...item, reviewStatus, reviewedAt: new Date().toISOString() } : item);
  if (!documents.some((item) => item.id === req.params.documentId)) return res.status(404).json({ error: 'Document not found.' });
  const profileData = { ...provider.profileData, compliance: { ...provider.profileData.compliance, documents: updatedDocuments } };
  const referralEligibility = calculateReferralEligibility(provider.status, provider.verificationStatus, profileData);
  if (supabase) {
    const { error } = await supabase.from('providers').update({ profile_data: profileData, referral_eligibility: referralEligibility }).eq('id', provider.id);
    if (error) return res.status(500).json({ error: 'Unable to save document review.' });
  } else {
    const localProvider = providers.find((item) => String(item.id) === String(provider.id));
    localProvider.profileData = profileData;
    localProvider.referralEligibility = referralEligibility;
    persistAppData();
  }
  return res.json({ message: 'Document review status saved.', profileData });
});

app.post('/api/providers/login', async (req, res) => {
  const body = req.body || {};
  const email = clean(body.email).toLowerCase();
  const password = clean(body.password);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (supabaseAuth) {
    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
      if (!error && data?.user && data.user.user_metadata?.role === 'provider') {
        const provider = (await getProvidersFromDataSource()).find((item) => item.email.toLowerCase() === email);
        if (!provider) return res.status(403).json({ error: 'Provider account has no registered profile. Contact support.' });
        return res.json({
          token: createSession('provider', provider.id, email),
          provider: buildProviderSnapshot(provider),
        });
      }
    } catch (error) {
      console.error('Supabase provider login attempt failed:', error.message);
    }
  }

  const provider = providers.find((item) => item.email.toLowerCase() === email && providerPasswordMatches(item.password, password));
  if (!provider) {
    return res.status(401).json({ error: 'Invalid provider login credentials.' });
  }

  return res.json({
    token: createSession('provider', provider.id, email),
    provider: buildProviderSnapshot(provider),
  });
});

app.get('/api/leads', async (req, res) => {
  const leadList = await getLeadsFromDataSource();
  res.json({
    leads: leadList,
    persistenceSource: supabase ? 'supabase' : 'local',
  });
});

app.get('/api/persistence-status', (req, res) => {
  res.json({
    persistenceSource: supabase ? 'supabase' : 'local',
    supabaseConfigured: Boolean(supabase),
    smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.CONTACT_FROM_EMAIL),
  });
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
    id: createSubmissionId(),
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
      persistAppData();
      return res.status(201).json({ message: 'Lead created successfully.', lead: createdLead });
    }
  }

  leads.unshift(newLead);
  persistAppData();
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

  if (supabaseAuth) {
    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
      if (!error && data?.user && data.user.user_metadata?.role === 'admin') {
        return res.json({
          token: createSession('admin', data.user.id, email),
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
      token: createSession('admin', configuredAdminEmail, configuredAdminEmail),
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
  persistAppData();

  return res.json({
    message: `Provider status updated to ${nextStatus}.`,
    provider: buildProviderSnapshot(providers[providerIndex]),
  });
});

app.put('/api/admin/providers/:id/review', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  const id = String(req.params.id);
  const accountStatus = String(req.body?.accountStatus || '').toLowerCase();
  const verificationStatus = String(req.body?.verificationStatus || '').toLowerCase();
  if (!['pending', 'active', 'suspended'].includes(accountStatus)) return res.status(400).json({ error: 'Invalid account status.' });
  if (!['incomplete', 'pending_review', 'verified', 'rejected', 'expired'].includes(verificationStatus)) return res.status(400).json({ error: 'Invalid verification status.' });
  const providerList = await getProvidersFromDataSource();
  const reviewedProvider = providerList.find((item) => String(item.id) === id);
  if (!reviewedProvider) return res.status(404).json({ error: 'Provider not found.' });
  const referralEligibility = calculateReferralEligibility(accountStatus, verificationStatus, reviewedProvider.profileData);
  if (supabase) {
    const { data, error } = await supabase.from('providers').update({ status: accountStatus, account_status: accountStatus, verification_status: verificationStatus, referral_eligibility: referralEligibility, verified: verificationStatus === 'verified' }).eq('id', id).select();
    if (error) return res.status(500).json({ error: 'Unable to save provider review.', details: error.message });
    if (!data?.[0]) return res.status(404).json({ error: 'Provider not found.' });
    const provider = normalizeProvider(data[0]);
    return res.json({ provider: buildProviderSnapshot(provider) });
  }
  const provider = providers.find((item) => String(item.id) === id);
  if (!provider) return res.status(404).json({ error: 'Provider not found.' });
  Object.assign(provider, { status: accountStatus, accountStatus, verificationStatus, referralEligibility, verified: verificationStatus === 'verified' });
  persistAppData();
  return res.json({ provider: buildProviderSnapshot(provider) });
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
    if (normalized === 'Booked') {
      const leadList = await getLeadsFromDataSource();
      const requestedLead = leadList.find((item) => String(item.id) === leadId);
      if (!requestedLead) return res.status(404).json({ error: 'Lead not found.' });
      if (!requestedLead.providerName || requestedLead.providerName === 'Unassigned') {
        return res.status(422).json({ error: 'Assign an eligible provider before marking this case booked.' });
      }
      const providerList = await getProvidersFromDataSource();
      const assignedProvider = providerList.find((provider) => provider.businessName === requestedLead.providerName || provider.name === requestedLead.providerName);
      if (!assignedProvider) return res.status(422).json({ error: 'The assigned provider no longer exists. Match an eligible provider before booking.' });
      const providerMatch = (await getMatchesForLead(requestedLead, [assignedProvider]))[0];
      if (!providerMatch.eligible) return res.status(422).json({ error: 'The assigned provider is no longer eligible for this referral.', reasons: providerMatch.reasons });
    }
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
  const requestedProviderId = clean(req.body?.providerId || '');
  const requestedProviderName = clean(req.body?.providerName || '');
  const matchStatus = clean(req.body?.matchStatus || 'Matched');

  const leadList = await getLeadsFromDataSource();
  const requestedLead = leadList.find((item) => String(item.id) === leadId);
  if (!requestedLead) return res.status(404).json({ error: 'Lead not found.' });
  let providerName = 'Unassigned';
  if (requestedProviderId || (requestedProviderName && requestedProviderName !== 'Unassigned')) {
    const providerList = await getProvidersFromDataSource();
    const candidate = providerList.find((item) => requestedProviderId
      ? String(item.id) === requestedProviderId
      : item.businessName === requestedProviderName || item.name === requestedProviderName);
    if (!candidate) return res.status(404).json({ error: 'Provider not found.' });
    const candidateMatch = (await getMatchesForLead(requestedLead, [candidate]))[0];
    if (!candidateMatch.eligible) return res.status(422).json({ error: 'This provider is not eligible for this referral.', reasons: candidateMatch.reasons });
    providerName = candidate.businessName || candidate.name;
  }

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

  const sortByNewest = (records) => records
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const enquiryRecords = sortByNewest(leadList.filter((lead) => isEnquiryRecord(lead)));
  const leadRecords = sortByNewest(leadList.filter((lead) => !isEnquiryRecord(lead)));

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
      leads: leadRecords,
      enquiries: enquiryRecords,
      providers: providerList,
      overview: [
        ['New enquiries', String(newLeads)],
        ['Matched cases', String(matchedLeads)],
        ['Follow-up active', String(followUpActive)],
        ['Booked', String(bookedLeads)],
      ],
    },
  });
});

app.get('/api/admin/leads/:id/matches', async (req, res) => {
  if (!isConfiguredAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  const leadList = await getLeadsFromDataSource();
  const lead = leadList.find((item) => String(item.id) === String(req.params.id));
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  const providerList = await getProvidersFromDataSource();
  return res.json({ matches: await getMatchesForLead(lead, providerList) });
});

app.get('/api/provider/dashboard/:providerId', async (req, res) => {
  const providerId = String(req.params.providerId);
  const session = getSession(req);
  if (!isProviderSessionFor(session, providerId)) {
    return res.status(401).json({ error: 'Unauthorized. Provider session required.' });
  }

  const providerList = await getProvidersFromDataSource();
  const provider = providerList.find((item) => String(item.id) === providerId);
  if (!provider) {
    return res.status(404).json({ error: 'Provider dashboard not found.' });
  }

  const leadList = await getLeadsFromDataSource();
  const matches = await Promise.all(leadList.map(async (lead) => {
    const providerMatch = (await getMatchesForLead(lead, [provider]))[0];
    if (!providerMatch.eligible) return null;
    const safeLead = { ...lead };
    delete safeLead.contactEmail;
    delete safeLead.phone;
    delete safeLead.message;
    delete safeLead.family;
    const outcode = providerMatch.outcode || String(lead.area || '').match(/[A-Z]{1,2}\d[A-Z\d]?/i)?.[0] || '';
    return { ...safeLead, area: providerMatch.areaName || (outcode ? `${outcode} area` : 'Area shared after referral review'), family: 'Private care opportunity', matchStatus: lead.matchStatus || 'Awaiting triage', followUpStage: lead.followUpStage || 'Pending', matchReasons: providerMatch.reasons };
  }));
  const assignedLeads = matches.filter(Boolean).slice(0, 20);

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
    const recordType = normalizeSubmissionRecordType(body);

    if (!name || !message || (!email && !phone)) {
      return res.status(400).json({ error: "Name, message, and at least one contact method are required." });
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
      replyTo: email || undefined,
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

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Files must be 5 MB or smaller.' : 'The uploaded file could not be accepted.';
    return res.status(400).json({ error: message });
  }
  if (error) {
    console.error('Request failed:', error.message);
    return res.status(400).json({ error: 'The request could not be processed.' });
  }
  return next();
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

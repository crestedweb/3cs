import { randomUUID } from 'node:crypto';

export function normalizeRecordType(value, fallback = 'enquiry') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'lead') return 'lead';
  if (normalized === 'enquiry') return 'enquiry';
  return fallback;
}

export function getDestinationTable(value) {
  return normalizeRecordType(value) === 'lead' ? 'leads' : 'enquiries';
}

export function createSubmissionId() {
  return `L-${randomUUID()}`;
}

export function createProviderId() {
  return `P-${randomUUID()}`;
}

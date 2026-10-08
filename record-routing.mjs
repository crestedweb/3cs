import { randomUUID } from 'node:crypto';

export function normalizeRecordType(value) {
  return String(value || '').trim().toLowerCase() === 'lead' ? 'lead' : 'enquiry';
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

import { randomUUID } from 'node:crypto';

export function normalizeRecordType(value, fallback = 'enquiry') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'lead') return 'lead';
  if (normalized === 'enquiry') return 'enquiry';
  return fallback;
}

export function getDestinationTable(value) {
  // The deployed leads table is the schema-backed operational store for both
  // guided care submissions and Contact Us enquiries. The record_type field
  // preserves the distinction for admin routing without sending unsupported
  // columns to a separate enquiries table.
  return 'leads';
}

export function normalizeSubmissionRecordType(submission = {}) {
  const source = String(submission.source || submission.submissionSource || '').trim().toLowerCase();
  if (['contact-us', 'contact_us', 'contact'].includes(source)) return 'enquiry';
  if (['find-care', 'find_care', 'care-finder'].includes(source)) return 'lead';
  return normalizeRecordType(submission.recordType);
}

export function isEnquiryRecord(record) {
  const message = String(record?.message || '').trim();
  const sourceType = message.match(/^\[(lead|enquiry)\]\s*/i)?.[1]?.toLowerCase();
  if (sourceType) return sourceType === 'enquiry';
  const explicitType = String(record?.recordType || record?.record_type || '').trim().toLowerCase();
  if (explicitType === 'enquiry') return true;
  if (explicitType === 'lead') return false;
  return message.toLowerCase().startsWith('[enquiry]')
    || /^care enquiry for\b/i.test(message)
    || /\benquiry\b/i.test(message);
}

export function createSubmissionId() {
  return `L-${randomUUID()}`;
}

export function createProviderId() {
  return `P-${randomUUID()}`;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSubmissionId,
  getDestinationTable,
  isEnquiryRecord,
  normalizeRecordType,
  normalizeSubmissionRecordType,
} from '../record-routing.mjs';

test('routes guided care submissions to the leads table', () => {
  assert.equal(normalizeRecordType('lead'), 'lead');
  assert.equal(getDestinationTable('lead'), 'leads');
});

test('preserves explicit lead classification even when message text mentions an enquiry', () => {
  assert.equal(isEnquiryRecord({ recordType: 'lead', message: 'Care enquiry for a family' }), false);
  assert.equal(isEnquiryRecord({ recordType: 'enquiry', message: 'A care request' }), true);
});

test('the stored source marker corrects a stale contradictory record type', () => {
  assert.equal(isEnquiryRecord({ record_type: 'lead', message: '[enquiry] Contact Us message' }), true);
  assert.equal(isEnquiryRecord({ record_type: 'enquiry', message: '[lead] Find Care request' }), false);
});

test('Contact Us source always routes submissions into enquiries', () => {
  assert.equal(normalizeSubmissionRecordType({ recordType: 'lead', source: 'contact-us' }), 'enquiry');
  assert.equal(normalizeSubmissionRecordType({ source: 'find-care' }), 'lead');
});

test('routes contact submissions to the schema-backed leads table', () => {
  assert.equal(normalizeRecordType('enquiry'), 'enquiry');
  assert.equal(getDestinationTable('enquiry'), 'leads');
});

test('keeps all submitted records on the operational leads table', () => {
  assert.equal(normalizeRecordType(''), 'enquiry');
  assert.equal(getDestinationTable(''), 'leads');
});

test('uses the supplied fallback for legacy records without a record type', () => {
  assert.equal(normalizeRecordType('', 'lead'), 'lead');
  assert.equal(getDestinationTable(normalizeRecordType('', 'lead')), 'leads');
});

test('creates unique identifiers for submissions created in the same millisecond', () => {
  const first = createSubmissionId();
  const second = createSubmissionId();
  assert.notEqual(first, second);
  assert.match(first, /^L-/);
  assert.match(second, /^L-/);
});

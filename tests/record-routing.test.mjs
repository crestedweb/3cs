import test from 'node:test';
import assert from 'node:assert/strict';
import { getDestinationTable, normalizeRecordType } from '../record-routing.mjs';

test('routes guided care submissions to the leads table', () => {
  assert.equal(normalizeRecordType('lead'), 'lead');
  assert.equal(getDestinationTable('lead'), 'leads');
});

test('routes contact submissions to the enquiries table', () => {
  assert.equal(normalizeRecordType('enquiry'), 'enquiry');
  assert.equal(getDestinationTable('enquiry'), 'enquiries');
});

test('treats unrecognized values as enquiries for backward compatibility', () => {
  assert.equal(normalizeRecordType(''), 'enquiry');
  assert.equal(getDestinationTable(''), 'enquiries');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { extractBearerToken, unauthenticatedAiAllowed } from '../lib/ai/auth.mjs';

test('extracts a bearer token case-insensitively', () => {
  assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(extractBearerToken('bearer token123'), 'token123');
});

test('rejects missing or malformed authorization values', () => {
  assert.equal(extractBearerToken(''), null);
  assert.equal(extractBearerToken('Basic abc'), null);
  assert.equal(extractBearerToken('Bearer'), null);
});

test('unauthenticated AI is opt-in only', () => {
  assert.equal(unauthenticatedAiAllowed(undefined), false);
  assert.equal(unauthenticatedAiAllowed('false'), false);
  assert.equal(unauthenticatedAiAllowed('true'), true);
});

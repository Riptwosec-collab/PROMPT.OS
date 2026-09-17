import test from 'node:test';
import assert from 'node:assert/strict';
import { V5_PROMPT_SCHEMA_VERSION, normalizePromptRecord, validatePromptRecord } from '../lib/prompts/state-schema.mjs';

test('normalizes legacy prompt records without dropping mutable state', () => {
  const legacy = {
    id: 'p1', name: 'TEST', prompt: 'Hello {{name}}', favorite: true,
    pinned: true, rating: 5, variables: { name: 'Mek' }, versions: [{ id: 'v1' }],
    results: [{ id: 'r1' }], runs: 7, copyCount: 3, createdAt: '2026-01-01T00:00:00.000Z'
  };
  const value = normalizePromptRecord(legacy);
  assert.equal(value.schemaVersion, V5_PROMPT_SCHEMA_VERSION);
  assert.equal(value.favorite, true);
  assert.equal(value.pinned, true);
  assert.equal(value.rating, 5);
  assert.deepEqual(value.variables, { name: 'Mek' });
  assert.equal(value.versions.length, 1);
  assert.equal(value.results.length, 1);
  assert.equal(validatePromptRecord(value).ok, true);
});

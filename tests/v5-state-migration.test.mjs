import test from 'node:test';
import assert from 'node:assert/strict';
import { V5_PROMPT_SCHEMA_VERSION, normalizePromptRecord, validatePromptRecord } from '../lib/prompts/state-schema.mjs';
import { migratePromptState } from '../lib/prompts/state-migration.mjs';

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

test('prompt-state migration is idempotent', () => {
  const source = [{ id: 'p1', name: 'TEST', prompt: 'Hello', favorite: true }];
  const first = migratePromptState(source);
  const second = migratePromptState(first.prompts);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.deepEqual(second.prompts, first.prompts);
});

test('failed migration leaves the source array and records unchanged', () => {
  const source = [{ id: 'bad', name: '', prompt: 'Hello', favorite: true }];
  const snapshot = structuredClone(source);
  const result = migratePromptState(source);
  assert.equal(result.ok, false);
  assert.equal(result.changed, false);
  assert.deepEqual(source, snapshot);
  assert.strictEqual(result.prompts, source);
  assert.ok(result.errors.length > 0);
});

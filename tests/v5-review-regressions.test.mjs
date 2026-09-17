import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mapV4PayloadToV5 } from '../lib/sync/migrate-v4.mjs';
import { trimSnapshots } from '../lib/sync/snapshots.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');

test('migration recovery snapshot has a UUID id', () => {
  const mapped = mapV4PayloadToV5({ schemaVersion: 4, prompts: [] }, '00000000-0000-0000-0000-000000000001');
  assert.match(mapped.snapshot.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('snapshot trimming accepts persisted created_at timestamps', () => {
  const result = trimSnapshots([
    { id: 'old', created_at: '2026-09-14T00:00:00.000Z' },
    { id: 'new', created_at: '2026-09-16T00:00:00.000Z' },
    { id: 'mid', created_at: '2026-09-15T00:00:00.000Z' },
  ], 2);
  assert.deepEqual(result.map((item) => item.id), ['new', 'mid']);
});

test('composite ownership foreign keys only null the nullable id column', () => {
  const sql = read('supabase/v5-schema.sql');
  assert.match(sql, /on delete set null\s*\(folder_id\)/i);
  assert.match(sql, /on delete set null\s*\(prompt_id\)/i);
  assert.match(sql, /on delete set null\s*\(prompt_version_id\)/i);
  assert.match(sql, /on delete set null\s*\(evaluation_run_id\)/i);
});

test('V5 shell respects feature flags and mobile add is not a dead control', () => {
  const page = read('app/page.jsx');
  const dock = read('components/shell/MobileDock.jsx');
  assert.match(page, /V5_FEATURE_FLAGS/);
  assert.match(page, /Object\.values\(V5_FEATURE_FLAGS\)\.some\(Boolean\)/);
  assert.match(page, /if \(!v5ShellEnabled\)/);
  assert.match(dock, /disabled=\{isNew && !onNewPrompt\}/);
});

test('Legacy PromptOS wires V5 migration and shared selectors without removing fallback', () => {
  const page = read('app/page.jsx');
  const promptOS = read('components/PromptOS.jsx');
  assert.match(page, /if \(!v5ShellEnabled\)/);
  assert.match(page, /<PromptOS \/>/);
  assert.match(promptOS, /migratePromptState/);
  assert.match(promptOS, /selectVisiblePrompts/);
  assert.match(promptOS, /selectPromptById/);
});

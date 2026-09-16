import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const sql = fs.readFileSync('supabase/v5-schema.sql', 'utf8');
const tables = [
  'prompt_os_user_settings',
  'prompt_os_workspaces',
  'prompt_os_folders',
  'prompt_os_prompts',
  'prompt_os_prompt_versions',
  'prompt_os_evaluation_suites',
  'prompt_os_evaluation_cases',
  'prompt_os_evaluation_runs',
  'prompt_os_evaluation_results',
  'prompt_os_usage_events',
  'prompt_os_snapshots',
  'prompt_os_sync_meta',
];

test('V5 schema defines every approved user-owned table', () => {
  for (const table of tables) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
  }
});

test('every V5 table enables RLS and authenticated ownership policies use auth.uid', () => {
  for (const table of tables) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`create policy "${table}_select_own"[\\s\\S]*?to authenticated[\\s\\S]*?using \\(\\(select auth\\.uid\\(\\)\\) = user_id\\)`, 'i'));
    assert.match(sql, new RegExp(`create policy "${table}_update_own"[\\s\\S]*?to authenticated[\\s\\S]*?using \\(\\(select auth\\.uid\\(\\)\\) = user_id\\)[\\s\\S]*?with check \\(\\(select auth\\.uid\\(\\)\\) = user_id\\)`, 'i'));
  }
});

test('V5 schema grants explicitly to authenticated and never grants V5 tables to anon', () => {
  for (const table of tables) {
    assert.match(sql, new RegExp(`grant [^;]+ on table public\\.${table} to authenticated`, 'i'));
  }
  assert.equal(/grant\s+[^;]+\s+on\s+table\s+public\.prompt_os_[a-z_]+\s+to\s+anon/i.test(sql), false);
});

test('sync, soft-delete, migration trace and recovery fields are present', () => {
  assert.match(sql, /create table if not exists public\.prompt_os_sync_meta[\s\S]*?revision bigint not null default 0/i);
  assert.match(sql, /schema_version integer not null default 5/i);
  assert.match(sql, /migration_version text/i);
  assert.match(sql, /last_synced_at timestamptz/i);
  assert.match(sql, /create table if not exists public\.prompt_os_prompts[\s\S]*?legacy_id text/i);
  assert.match(sql, /deleted_at timestamptz/i);
  assert.match(sql, /create table if not exists public\.prompt_os_snapshots[\s\S]*?payload jsonb not null/i);
});

test('V5 schema preserves the legacy prompt_os_state fallback', () => {
  assert.equal(/drop\s+table(?:\s+if\s+exists)?\s+public\.prompt_os_state/i.test(sql), false);
});

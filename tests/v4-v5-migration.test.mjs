import test from 'node:test';
import assert from 'node:assert/strict';
import { mapV4PayloadToV5, verifyV5Migration } from '../lib/sync/migrate-v4.mjs';

const USER_ID = '00000000-0000-0000-0000-000000000001';

test('V4 payload maps prompts and versions while preserving key metadata', () => {
  const source = {
    schemaVersion: 4,
    prompts: [{
      id: 'p1',
      title: 'A',
      prompt: 'Hello',
      versions: [{ version: '1.0', prompt: 'Hello' }],
      favorite: true,
      pinned: true,
    }],
  };

  const mapped = mapV4PayloadToV5(source, USER_ID);
  assert.equal(mapped.promptRows.length, 1);
  assert.equal(mapped.versionRows.length, 1);
  assert.equal(mapped.promptRows[0].favorite, true);
  assert.equal(mapped.promptRows[0].pinned, true);
  assert.equal(mapped.workspaceRows[0].id, mapped.promptRows[0].workspace_id);
  assert.equal(mapped.snapshot.reason, 'v4_migration');
  assert.equal(verifyV5Migration(source, mapped).valid, true);
});

test('mapping is deterministic for the same user and source identifiers', () => {
  const source = { prompts: [{ id: 42, title: 'Legacy', prompt: 'Hi' }] };
  const first = mapV4PayloadToV5(source, USER_ID);
  const second = mapV4PayloadToV5(source, USER_ID);
  assert.equal(first.promptRows[0].id, second.promptRows[0].id);
  assert.equal(first.versionRows[0].id, second.versionRows[0].id);
});

test('verification reports count and relationship mismatches', () => {
  const source = { prompts: [{ id: 'a', title: 'A', prompt: 'A' }] };
  const mapped = mapV4PayloadToV5(source, USER_ID);
  mapped.promptRows[0].current_version_id = '00000000-0000-0000-0000-000000000099';
  const result = verifyV5Migration(source, mapped);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('current version')));
});

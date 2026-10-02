import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, planRestore, validateBackup } from '../lib/control/backup.mjs';

const snapshot = {
  prompts: [
    { id: 'builtin:1', builtIn: true, prompt: 'SYSTEM BUILT IN DEFINITION' },
    { id: 'user:1', builtIn: false, title: 'My Prompt', prompt: 'User prompt' },
  ],
  drafts: [{ draftId: 'd1', promptId: 'user:1', derivedFromPromptId: 'builtin:1', sourceBuiltInSnapshot: { id: 'builtin:1', prompt: 'SHOULD NOT EXPORT' }, rawPrompt: 'draft' }],
  versions: [{ versionId: 'v1', promptId: 'user:1', versionNumber: 1, promptSnapshot: 'v1', metadataSnapshot: { derivedFromPromptId: 'builtin:1', sourceBuiltInSnapshot: { prompt: 'NO' } } }],
  runs: [{ id: 'r1', promptId: 'builtin:1', status: 'success', output: 'ok' }],
  results: [{ resultId: 'x1', sourceRunId: 'r1', outputSnapshot: 'ok' }],
  packs: [{ id: 'pack:1', name: 'Pack', promptIds: ['builtin:1', 'user:1'] }],
  favorites: ['builtin:1', 'user:1'],
  settings: { language: 'th', theme: 'dark', apiKey: 'SECRET', token: 'SECRET' },
};

test('backup round-trip contains supported user data with schema version and export-safe settings', () => {
  const backup = createBackup(snapshot, { now: () => 1234 });
  const validation = validateBackup(backup);
  assert.equal(validation.ok, true);
  assert.equal(backup.schema, 'prompt-os-backup');
  assert.equal(backup.version, 1);
  assert.equal(backup.createdAt, 1234);
  assert.equal(backup.data.customPrompts.length, 1);
  assert.equal(backup.data.drafts.length, 1);
  assert.equal(backup.data.versions.length, 1);
  assert.equal(backup.data.runs.length, 1);
  assert.equal(backup.data.results.length, 1);
  assert.deepEqual(backup.data.settings, { language: 'th', theme: 'dark' });
  assert.equal(JSON.stringify(backup).includes('SECRET'), false);
});

test('built-in definitions and embedded built-in source snapshots are not duplicated in backup', () => {
  const backup = createBackup(snapshot);
  const serialized = JSON.stringify(backup);
  assert.equal(serialized.includes('SYSTEM BUILT IN DEFINITION'), false);
  assert.equal(serialized.includes('SHOULD NOT EXPORT'), false);
  assert.equal(serialized.includes('"derivedFromPromptId":"builtin:1"'), true);
  assert.deepEqual(backup.data.packs[0].promptIds, ['builtin:1', 'user:1']);
});

test('malformed backup fails validation without mutating caller input', () => {
  const malformed = { schema: 'wrong', version: 99, data: { drafts: 'not-an-array' } };
  const before = structuredClone(malformed);
  const result = validateBackup(malformed);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
  assert.deepEqual(malformed, before);
});

test('restore plan preserves both for mutable collisions by default and requires explicit destructive replacement', () => {
  const backup = createBackup(snapshot, { now: () => 1234 });
  const localState = {
    customPrompts: [{ id: 'user:1', title: 'Local changed prompt' }],
    drafts: [{ draftId: 'd1', promptId: 'user:1', rawPrompt: 'local draft' }],
    versions: [], runs: [], results: [], packs: [], favorites: [], settings: {},
  };
  const plan = planRestore(backup, localState);
  assert.equal(plan.ok, true);
  assert.ok(plan.conflicts.some((item) => item.collection === 'customPrompts' && item.strategy === 'preserve_both'));
  assert.ok(plan.conflicts.some((item) => item.collection === 'drafts' && item.strategy === 'preserve_both'));
  assert.equal(plan.requiresDestructiveConfirmation, false);

  const destructive = planRestore(backup, localState, { replaceMutable: true });
  assert.equal(destructive.requiresDestructiveConfirmation, true);
});

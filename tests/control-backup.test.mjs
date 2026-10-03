import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { openRuntimeDb } from '../lib/run/indexeddb.mjs';
import { createRunRepository } from '../lib/run/run-repository.mjs';
import { createResultRepository } from '../lib/run/result-repository.mjs';
import { createDraftRepository } from '../lib/studio/draft-repository.mjs';
import { createVersionRepository } from '../lib/studio/version-repository.mjs';
import { applyBackupRestore, createBackup, readPromptBackupData, planRestore, validateBackup } from '../lib/control/backup.mjs';

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

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

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

test('prompt backup source reads real custom prompts, packs, favorites and export-safe settings', () => {
  const builtIn = AI_PROMPT_LIBRARY[0];
  const storage = memoryStorage({
    promptVaultData: JSON.stringify({
      prompts: [builtIn, { id: 'user:backup', name: 'User backup', prompt: 'Hello', owner: 'user', favorite: true }],
      promptPacks: [{ id: 'pack:user', name: 'User pack', promptIds: [String(builtIn.id), 'user:backup'] }],
      settings: { language: 'th', theme: 'dark', apiKey: 'DO_NOT_EXPORT' },
    }),
  });
  const data = readPromptBackupData(storage);
  assert.deepEqual(data.customPrompts.map((item) => item.id), ['user:backup']);
  assert.deepEqual(data.packs.map((item) => item.id), ['pack:user']);
  assert.ok(data.favorites.includes('user:backup'));
  assert.equal(data.settings.language, 'th');
  assert.equal(JSON.stringify(data).includes('DO_NOT_EXPORT'), false);
});

test('restore applies validated data, preserves local collisions, and never overwrites built-in prompt IDs', async () => {
  const indexedDBImpl = new IDBFactory();
  const db = await openRuntimeDb({ indexedDBImpl });
  const runRepository = createRunRepository({ db });
  const resultRepository = createResultRepository({ db, idFactory: () => 'existing-result' });
  const draftRepository = createDraftRepository({ db, now: () => 10 });
  const versionRepository = createVersionRepository({ db, idFactory: () => 'existing-version', now: () => 20 });
  const builtIn = AI_PROMPT_LIBRARY[0];
  const storage = memoryStorage({ promptVaultData: JSON.stringify({ prompts: [builtIn], promptPacks: [], settings: {} }) });

  await runRepository.create({ id: 'local-run', promptId: builtIn.id, status: 'success', output: 'local', createdAt: 1 });
  await draftRepository.upsert({ draftId: 'local-draft', promptId: 'user:local', title: 'Local draft', rawPrompt: 'local' });

  const incoming = createBackup({
    customPrompts: [
      { id: String(builtIn.id), builtIn: false, owner: 'user', name: 'Collision with built-in', prompt: 'must not overwrite' },
      { id: 'user:imported', builtIn: false, owner: 'user', name: 'Imported', prompt: 'imported prompt' },
    ],
    drafts: [{ draftId: 'import-draft', promptId: 'user:imported', title: 'Imported draft', rawPrompt: 'draft' }],
    versions: [{ versionId: 'import-version', promptId: 'user:imported', versionNumber: 1, promptSnapshot: 'version', variableConfigSnapshot: {}, metadataSnapshot: {}, status: 'stable', createdAt: 4 }],
    runs: [{ id: 'import-run', promptId: 'user:imported', status: 'success', output: 'restored', createdAt: 5 }],
    results: [{ resultId: 'import-result', sourceRunId: 'import-run', name: 'Restored result', promptSnapshot: 'p', variablesSnapshot: {}, outputSnapshot: 'restored', metadataSnapshot: {}, createdAt: 6 }],
    packs: [{ id: 'pack:imported', name: 'Imported pack', promptIds: ['user:imported'] }],
    favorites: ['user:imported'],
    settings: { language: 'th', theme: 'dark' },
  }, { now: () => 99 });

  let suffix = 0;
  const applied = await applyBackupRestore(incoming, { db, storage, idFactory: () => `copy-${++suffix}` });
  assert.equal(applied.ok, true);
  assert.equal((await runRepository.get('import-run')).output, 'restored');
  assert.equal((await draftRepository.get('import-draft')).rawPrompt, 'draft');
  assert.equal((await versionRepository.get('import-version')).promptSnapshot, 'version');
  assert.equal((await resultRepository.get('import-result')).outputSnapshot, 'restored');

  const promptData = readPromptBackupData(storage);
  assert.ok(promptData.customPrompts.some((item) => item.id === 'user:imported'));
  assert.equal(promptData.customPrompts.some((item) => String(item.id) === String(builtIn.id)), false);
  assert.ok(promptData.packs.some((item) => item.id === 'pack:imported'));
  assert.ok(promptData.favorites.includes('user:imported'));
  assert.equal(promptData.settings.language, 'th');
  assert.equal(AI_PROMPT_LIBRARY.find((item) => String(item.id) === String(builtIn.id)).prompt, builtIn.prompt);
  db.close();
});

test('invalid restore is atomic and leaves runtime/storage data untouched', async () => {
  const db = await openRuntimeDb({ indexedDBImpl: new IDBFactory() });
  const runRepository = createRunRepository({ db });
  await runRepository.create({ id: 'before', promptId: 'p', status: 'success', output: 'safe', createdAt: 1 });
  const storage = memoryStorage({ promptVaultData: JSON.stringify({ prompts: [], settings: { language: 'th' } }) });
  const beforeStorage = storage.getItem('promptVaultData');
  const result = await applyBackupRestore('{not json', { db, storage });
  assert.equal(result.ok, false);
  assert.equal((await runRepository.list()).length, 1);
  assert.equal(storage.getItem('promptVaultData'), beforeStorage);
  db.close();
});

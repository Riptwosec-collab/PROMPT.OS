import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { openRuntimeDb, RUNTIME_DB_NAME, RUNTIME_DB_VERSION, withStore } from '../lib/run/indexeddb.mjs';
import { createDraft, restoreVersionToDraft } from '../lib/studio/draft-model.mjs';
import { createDraftRepository } from '../lib/studio/draft-repository.mjs';
import { createVersionSnapshot } from '../lib/studio/version-model.mjs';
import { createVersionRepository } from '../lib/studio/version-repository.mjs';

function deleteDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(RUNTIME_DB_NAME);
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
}

test('runtime DB adds draft/version stores additively without removing run/result data', async () => {
  await deleteDb().catch(() => {});
  let db;
  try {
    db = await openRuntimeDb();
    assert.ok(RUNTIME_DB_VERSION >= 3);
    assert.ok(db.objectStoreNames.contains('promptDrafts'));
    assert.ok(db.objectStoreNames.contains('promptVersions'));
    await withStore(db, 'runs', 'readwrite', (store) => store.put({ id: 'keep-run', createdAt: 1, status: 'success' }));
    await withStore(db, 'savedResults', 'readwrite', (store) => store.put({ resultId: 'keep-result', createdAt: 2, sourceRunId: 'keep-run' }));
    assert.equal((await withStore(db, 'runs', 'readonly', (store) => store.get('keep-run'))).id, 'keep-run');
    assert.equal((await withStore(db, 'savedResults', 'readonly', (store) => store.get('keep-result'))).resultId, 'keep-result');
  } finally { db?.close(); await deleteDb().catch(() => {}); }
});

test('Draft repository upserts mutable revisioned working state without creating versions', async () => {
  await deleteDb().catch(() => {});
  let db;
  try {
    db = await openRuntimeDb();
    const repo = createDraftRepository({ db, now: () => 100 });
    const draft = createDraft({ draftId: 'd1', promptId: 'user-p1', title: 'My Prompt', rawPrompt: 'Hello {{name}}' });
    const first = await repo.upsert(draft);
    const second = await repo.upsert({ ...first, title: 'Updated' });
    assert.equal(first.revision, 0);
    assert.equal(second.revision, 1);
    assert.equal((await repo.get('d1')).title, 'Updated');
    assert.equal((await repo.list()).length, 1);
    assert.equal((await withStore(db, 'promptVersions', 'readonly', (store) => store.count())), 0);
  } finally { db?.close(); await deleteDb().catch(() => {}); }
});

test('Version snapshots are detached immutable records and numbering is monotonic after archive', async () => {
  await deleteDb().catch(() => {});
  let db;
  try {
    db = await openRuntimeDb();
    const repo = createVersionRepository({ db, now: () => 200, idFactory: (() => { let i = 0; return () => `v${++i}`; })() });
    const draft = createDraft({ draftId: 'd1', promptId: 'user-p1', title: 'P', rawPrompt: 'Version one', variableConfig: { x: { required: true } } });
    const one = createVersionSnapshot({ draft, versionId: 'v1', versionNumber: 1, status: 'Stable', createdAt: 200 });
    await repo.create(one);
    draft.rawPrompt = 'mutated later';
    assert.equal((await repo.get('v1')).promptSnapshot, 'Version one');
    assert.equal(await repo.nextVersionNumber('user-p1'), 2);
    await repo.archive('v1');
    assert.equal(await repo.nextVersionNumber('user-p1'), 2);
    const restored = restoreVersionToDraft(await repo.get('v1'), { draftId: 'restored-draft' });
    restored.rawPrompt = 'working change';
    assert.equal((await repo.get('v1')).promptSnapshot, 'Version one');
  } finally { db?.close(); await deleteDb().catch(() => {}); }
});

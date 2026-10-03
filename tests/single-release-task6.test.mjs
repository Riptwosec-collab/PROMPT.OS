import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';

import { openRuntimeDb, RUNTIME_DB_NAME, RUNTIME_DB_VERSION } from '../lib/run/indexeddb.mjs';
import { createDraft } from '../lib/studio/draft-model.mjs';
import { createDraftRepository } from '../lib/studio/draft-repository.mjs';
import { createVersionSnapshot } from '../lib/studio/version-model.mjs';
import { createVersionRepository } from '../lib/studio/version-repository.mjs';

const done = (request) => new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
const txDone = (tx) => new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
async function reset() { await done(indexedDB.deleteDatabase(RUNTIME_DB_NAME)); }

async function seedV2() {
  await reset();
  const request = indexedDB.open(RUNTIME_DB_NAME, 2);
  request.onupgradeneeded = () => {
    const db = request.result;
    const runs = db.createObjectStore('runs', { keyPath: 'id' });
    for (const [name, key] of [['by-created-at','createdAt'],['by-prompt-id','promptId'],['by-status','status'],['by-provider','provider'],['by-model','model']]) runs.createIndex(name, key);
    const results = db.createObjectStore('savedResults', { keyPath: 'resultId' });
    for (const [name, key] of [['by-created-at','createdAt'],['by-source-run-id','sourceRunId'],['by-pinned','pinned'],['by-name','name']]) results.createIndex(name, key);
    const queue = db.createObjectStore('syncQueue', { keyPath: 'id' }); queue.createIndex('by-created-at','createdAt'); queue.createIndex('by-state','state');
    db.createObjectStore('runtimeMeta', { keyPath: 'key' });
  };
  const db = await done(request);
  const tx = db.transaction(['runs','savedResults'], 'readwrite');
  tx.objectStore('runs').put({ id: 'keep-run', createdAt: 1, status: 'success', output: 'keep' });
  tx.objectStore('savedResults').put({ resultId: 'keep-result', sourceRunId: 'keep-run', createdAt: 1, outputSnapshot: 'keep' });
  await txDone(tx); db.close();
}

test('runtime DB v3 adds draft/version stores without losing v2 records', async () => {
  await seedV2();
  assert.ok(RUNTIME_DB_VERSION >= 3);
  const db = await openRuntimeDb();
  assert.ok(db.objectStoreNames.contains('promptDrafts'));
  assert.ok(db.objectStoreNames.contains('promptVersions'));
  assert.equal((await done(db.transaction('runs').objectStore('runs').get('keep-run'))).output, 'keep');
  assert.equal((await done(db.transaction('savedResults').objectStore('savedResults').get('keep-result'))).outputSnapshot, 'keep');
  db.close();
});

test('Draft repository is mutable, revisioned, detached and listable', async () => {
  await reset(); const db = await openRuntimeDb(); let now = 100;
  const repo = createDraftRepository({ db, now: () => ++now });
  const draft = createDraft({ draftId: 'd1', promptId: 'user-p1', title: 'Draft', rawPrompt: 'Role: helper', variableConfig: { x: { type: 'text' } } }, { now: () => 10 });
  const saved = await repo.upsert(draft);
  assert.equal(saved.revision, 0);
  const changed = await repo.upsert({ ...saved, title: 'Changed' });
  assert.equal(changed.revision, 1);
  const fetched = await repo.get('d1'); fetched.title = 'MUTATED';
  assert.equal((await repo.get('d1')).title, 'Changed');
  assert.deepEqual((await repo.list()).map((item) => item.draftId), ['d1']);
  assert.equal(await repo.delete('d1'), true);
  db.close();
});

test('Version snapshots are deeply detached, immutable by repository API, monotonic and archivable', async () => {
  await reset(); const db = await openRuntimeDb(); let seq = 0;
  const repo = createVersionRepository({ db, idFactory: () => `v-${++seq}`, now: () => 100 + seq });
  const draft = createDraft({ draftId: 'd1', promptId: 'p1', title: 'One', rawPrompt: 'Prompt {{x}}', variableConfig: { x: { type: 'text' } } });
  const n1 = await repo.nextVersionNumber('p1'); assert.equal(n1, 1);
  const v1 = createVersionSnapshot({ draft, versionId: 'v-manual', versionNumber: n1, label: 'Initial', status: 'Stable' });
  draft.rawPrompt = 'MUTATED'; draft.variableConfig.x.type = 'number';
  assert.equal(v1.promptSnapshot, 'Prompt {{x}}');
  assert.equal(v1.variableConfigSnapshot.x.type, 'text');
  await repo.create(v1);
  assert.equal(await repo.nextVersionNumber('p1'), 2);
  const archived = await repo.archive(v1.versionId);
  assert.equal(archived.status, 'Archived');
  assert.equal(archived.promptSnapshot, 'Prompt {{x}}');
  const restoredDraftData = repo.restoreAsDraft(archived);
  assert.equal(restoredDraftData.rawPrompt, 'Prompt {{x}}');
  restoredDraftData.rawPrompt = 'changed';
  assert.equal((await repo.get(v1.versionId)).promptSnapshot, 'Prompt {{x}}');
  db.close();
});

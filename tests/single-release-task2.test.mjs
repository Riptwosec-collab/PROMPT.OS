import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';

import { RUNTIME_DB_NAME, RUNTIME_DB_VERSION, openRuntimeDb } from '../lib/run/indexeddb.mjs';
import { createRunRepository } from '../lib/run/run-repository.mjs';
import { createResultRepository } from '../lib/run/result-repository.mjs';
import { normalizeHistoryQuery } from '../lib/run/history-query.mjs';
import { normalizeResultQuery } from '../lib/run/result-query.mjs';

function requestDone(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteRuntimeDb() {
  await requestDone(indexedDB.deleteDatabase(RUNTIME_DB_NAME));
}

async function seedV1() {
  await deleteRuntimeDb();
  const request = indexedDB.open(RUNTIME_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    const runs = db.createObjectStore('runs', { keyPath: 'id' });
    runs.createIndex('by-created-at', 'createdAt');
    runs.createIndex('by-prompt-id', 'promptId');
    runs.createIndex('by-status', 'status');
    const results = db.createObjectStore('savedResults', { keyPath: 'resultId' });
    results.createIndex('by-created-at', 'createdAt');
    results.createIndex('by-source-run-id', 'sourceRunId');
    const queue = db.createObjectStore('syncQueue', { keyPath: 'id' });
    queue.createIndex('by-created-at', 'createdAt');
    queue.createIndex('by-state', 'state');
    db.createObjectStore('runtimeMeta', { keyPath: 'key' });
  };
  const db = await requestDone(request);
  const tx = db.transaction(['runs', 'savedResults'], 'readwrite');
  tx.objectStore('runs').put({ id: 'legacy-run', promptId: 'p-old', status: 'success', createdAt: 1, output: 'legacy output' });
  tx.objectStore('savedResults').put({ resultId: 'legacy-result', sourceRunId: 'legacy-run', name: 'Legacy', createdAt: 1, promptSnapshot: 'old', variablesSnapshot: {}, outputSnapshot: 'legacy output', metadataSnapshot: {} });
  await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
  db.close();
}

function run(id, createdAt, overrides = {}) {
  return {
    id,
    promptId: 'prompt-a',
    status: 'success',
    provider: 'openai',
    model: 'gpt-test',
    createdAt,
    startedAt: createdAt,
    completedAt: createdAt + 1,
    renderedPrompt: `Rendered ${id}`,
    output: `Output ${id}`,
    ...overrides,
  };
}

test('runtime DB upgrades v1 additively and preserves existing run/result records', async () => {
  await seedV1();
  assert.ok(RUNTIME_DB_VERSION >= 2);
  const db = await openRuntimeDb();
  assert.equal(db.version, RUNTIME_DB_VERSION);
  const runs = db.transaction('runs').objectStore('runs');
  assert.ok(runs.indexNames.contains('by-provider'));
  assert.ok(runs.indexNames.contains('by-model'));
  const results = db.transaction('savedResults').objectStore('savedResults');
  assert.ok(results.indexNames.contains('by-pinned'));
  assert.equal((await requestDone(runs.get('legacy-run'))).output, 'legacy output');
  assert.equal((await requestDone(results.get('legacy-result'))).name, 'Legacy');
  db.close();
});

test('history query normalizes bounded paging/filter/search fields', () => {
  assert.deepEqual(normalizeHistoryQuery({ search: '  ERROR ', statuses: ['failed', 'success'], limit: 999, from: '10', to: 20 }), {
    search: 'error', statuses: ['failed', 'success'], promptId: null, provider: null, model: null,
    from: 10, to: 20, saved: null, limit: 100, cursor: null,
  });
});

test('run repository listPage is newest-first, filtered, searchable, and cursor-paged', async () => {
  await deleteRuntimeDb();
  const db = await openRuntimeDb();
  const repo = createRunRepository({ db });
  await repo.create(run('r1', 10, { output: 'alpha' }));
  await repo.create(run('r2', 20, { status: 'failed', output: 'needle error' }));
  await repo.create(run('r3', 30, { model: 'other', output: 'needle newest' }));
  await repo.create(run('r4', 40, { output: 'needle latest' }));

  const first = await repo.listPage({ search: 'needle', limit: 2 });
  assert.deepEqual(first.items.map((item) => item.id), ['r4', 'r3']);
  assert.ok(first.nextCursor);
  const second = await repo.listPage({ search: 'needle', limit: 2, cursor: first.nextCursor });
  assert.deepEqual(second.items.map((item) => item.id), ['r2']);
  assert.equal(second.nextCursor, null);

  const failed = await repo.listPage({ statuses: ['failed'], provider: 'openai', model: 'gpt-test', from: 15, to: 25 });
  assert.deepEqual(failed.items.map((item) => item.id), ['r2']);
  db.close();
});

test('result repository metadata updates are whitelisted, duplicate is detached, and deletes never cascade', async () => {
  await deleteRuntimeDb();
  const db = await openRuntimeDb();
  let seq = 0;
  const runs = createRunRepository({ db });
  const results = createResultRepository({ db, idFactory: () => `result-${++seq}`, now: () => 100 + seq });
  await runs.create(run('source-run', 10));
  const sourceRun = await runs.get('source-run');
  const saved = await results.saveFromRun(sourceRun, { name: 'Original' });

  const updated = await results.updateMetadata(saved.resultId, { name: 'Renamed', pinned: true, tags: ['network'], notes: 'keep', outputSnapshot: 'MUTATE' });
  assert.equal(updated.name, 'Renamed');
  assert.equal(updated.pinned, true);
  assert.deepEqual(updated.tags, ['network']);
  assert.equal(updated.notes, 'keep');
  assert.equal(updated.outputSnapshot, sourceRun.output);

  const copy = await results.duplicate(saved.resultId, { name: 'Copy' });
  assert.notEqual(copy.resultId, saved.resultId);
  assert.equal(copy.outputSnapshot, saved.outputSnapshot);
  const changedCopy = await results.updateMetadata(copy.resultId, { notes: 'copy only' });
  assert.equal((await results.get(saved.resultId)).notes, 'keep');
  assert.equal(changedCopy.notes, 'copy only');

  assert.equal(await runs.delete('source-run'), true);
  assert.ok(await results.get(saved.resultId));
  assert.equal(await results.delete(saved.resultId), true);
  assert.equal(await results.get(saved.resultId), null);
  db.close();
});

test('result query normalizes search/pin pagination input', () => {
  assert.deepEqual(normalizeResultQuery({ search: ' Test ', pinned: true, limit: 0 }), {
    search: 'test', pinned: true, promptId: null, from: null, to: null, limit: 1, cursor: null,
  });
});

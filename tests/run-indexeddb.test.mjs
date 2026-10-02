import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { openRuntimeDb, withStore, RUNTIME_DB_NAME, RUNTIME_DB_VERSION } from '../lib/run/indexeddb.mjs';

function deleteDb(name = RUNTIME_DB_NAME) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('delete blocked'));
  });
}

function openLegacyV1() {
  return new Promise((resolve, reject) => {
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
      const sync = db.createObjectStore('syncQueue', { keyPath: 'id' });
      sync.createIndex('by-created-at', 'createdAt');
      sync.createIndex('by-state', 'state');
      db.createObjectStore('runtimeMeta', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

test('runtime DB creates additive Daily Use indexes without changing store ownership', async () => {
  await deleteDb().catch(() => {});
  const db = await openRuntimeDb();
  assert.equal(RUNTIME_DB_VERSION, 2);
  assert.deepEqual([...db.objectStoreNames], ['runs', 'runtimeMeta', 'savedResults', 'syncQueue']);

  const runs = db.transaction('runs', 'readonly').objectStore('runs');
  assert.deepEqual([...runs.indexNames], ['by-created-at', 'by-created-at-id', 'by-prompt-id', 'by-status']);

  const results = db.transaction('savedResults', 'readonly').objectStore('savedResults');
  assert.deepEqual([...results.indexNames], ['by-created-at', 'by-created-at-id', 'by-source-run-id']);

  const queue = db.transaction('syncQueue', 'readonly').objectStore('syncQueue');
  assert.deepEqual([...queue.indexNames], ['by-created-at', 'by-state']);
  db.close();
  await deleteDb();
});

test('opening legacy v1 upgrades in place and preserves existing run/result records', async () => {
  await deleteDb().catch(() => {});
  const legacy = await openLegacyV1();
  await new Promise((resolve, reject) => {
    const tx = legacy.transaction(['runs', 'savedResults'], 'readwrite');
    tx.objectStore('runs').put({ id: 'legacy-run', promptId: 'p1', status: 'success', createdAt: 1000, output: 'legacy output' });
    tx.objectStore('savedResults').put({ resultId: 'legacy-result', sourceRunId: 'legacy-run', createdAt: 1100, outputSnapshot: 'legacy output' });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  legacy.close();

  const upgraded = await openRuntimeDb();
  assert.equal(upgraded.version, 2);
  const run = await withStore(upgraded, 'runs', 'readonly', (store) => store.get('legacy-run'));
  const result = await withStore(upgraded, 'savedResults', 'readonly', (store) => store.get('legacy-result'));
  assert.equal(run.output, 'legacy output');
  assert.equal(result.outputSnapshot, 'legacy output');
  assert.ok(upgraded.transaction('runs', 'readonly').objectStore('runs').indexNames.contains('by-created-at-id'));
  assert.ok(upgraded.transaction('savedResults', 'readonly').objectStore('savedResults').indexNames.contains('by-created-at-id'));
  upgraded.close();
  await deleteDb();
});

test('opening failure is surfaced and never replaced by a silent reset', async () => {
  const indexedDBImpl = {
    open() {
      throw new Error('IndexedDB unavailable');
    },
    deleteDatabase() {
      throw new Error('must not delete');
    },
  };
  await assert.rejects(() => openRuntimeDb({ indexedDBImpl }), /IndexedDB unavailable/);
});

test('withStore resolves request results after the transaction completes', async () => {
  await deleteDb().catch(() => {});
  const db = await openRuntimeDb();
  const written = await withStore(db, 'runtimeMeta', 'readwrite', (store) => store.put({ key: 'schema', value: RUNTIME_DB_VERSION }));
  assert.equal(written, 'schema');
  const record = await withStore(db, 'runtimeMeta', 'readonly', (store) => store.get('schema'));
  assert.deepEqual(record, { key: 'schema', value: RUNTIME_DB_VERSION });
  db.close();
  await deleteDb();
});

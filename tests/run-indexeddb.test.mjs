import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { openRuntimeDb, withStore } from '../lib/run/indexeddb.mjs';

test('runtime DB creates only Phase 4 stores and required indexes', async () => {
  const db = await openRuntimeDb();
  assert.deepEqual([...db.objectStoreNames], ['runs', 'runtimeMeta', 'savedResults', 'syncQueue']);

  const runs = db.transaction('runs', 'readonly').objectStore('runs');
  assert.deepEqual([...runs.indexNames], ['by-created-at', 'by-prompt-id', 'by-status']);

  const results = db.transaction('savedResults', 'readonly').objectStore('savedResults');
  assert.deepEqual([...results.indexNames], ['by-created-at', 'by-source-run-id']);

  const queue = db.transaction('syncQueue', 'readonly').objectStore('syncQueue');
  assert.deepEqual([...queue.indexNames], ['by-created-at', 'by-state']);
  db.close();
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
  const db = await openRuntimeDb();
  const written = await withStore(db, 'runtimeMeta', 'readwrite', (store) => store.put({ key: 'schema', value: 1 }));
  assert.equal(written, 'schema');
  const record = await withStore(db, 'runtimeMeta', 'readonly', (store) => store.get('schema'));
  assert.deepEqual(record, { key: 'schema', value: 1 });
  db.close();
});

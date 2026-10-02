import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IDBFactory } from 'fake-indexeddb';
import { measureStorage, summarizeSync } from '../lib/control/storage.mjs';
import { openRuntimeDb } from '../lib/run/indexeddb.mjs';
import { createSyncRepository } from '../lib/run/sync-repository.mjs';

test('storage measurement exposes real browser estimate and explicit unavailable state', async () => {
  assert.deepEqual(await measureStorage({ estimate: async () => ({ usage: 1250, quota: 10000 }) }), { available: true, usage: 1250, quota: 10000 });
  assert.deepEqual(await measureStorage(null), { available: false, usage: null, quota: null });
  assert.deepEqual(await measureStorage({ estimate: async () => { throw new Error('denied'); } }), { available: false, usage: null, quota: null });
});

test('sync summary counts only concrete persisted states', () => {
  const items = ['local', 'pending', 'syncing', 'synced', 'conflict', 'sync_error', 'pending'].map((state, index) => ({ id: String(index), state }));
  assert.deepEqual(summarizeSync(items), { local: 1, pending: 2, syncing: 1, synced: 1, conflict: 1, sync_error: 1, total: 7 });
});

test('sync repository can list and summarize actual queue records without a cloud adapter', async () => {
  const db = await openRuntimeDb({ indexedDBImpl: new IDBFactory() });
  const repository = createSyncRepository({ db });
  await repository.enqueue({ id: 'a', createdAt: 1 });
  await repository.enqueue({ id: 'b', createdAt: 2 });
  await repository.enqueue({ id: 'c', createdAt: 3 });
  await repository.markSyncing('b');
  await repository.markError('c', 'offline');
  const items = await repository.listAll();
  assert.equal(items.length, 3);
  assert.deepEqual(await repository.summary(), { local: 0, pending: 1, syncing: 1, synced: 0, conflict: 0, sync_error: 1, total: 3 });
  db.close();
});

test('Storage & Sync UI is truthful: unavailable quota, explicit cleanup, Sync Now disabled without real adapter', () => {
  const source = fs.readFileSync(new URL('../components/control/StorageSyncCenter.jsx', import.meta.url), 'utf8');
  for (const token of ['Storage & Sync', 'Unavailable', 'Sync Now', 'Pending', 'Conflicts', 'Delete selected Runs', 'Delete selected Saved Results']) assert.ok(source.includes(token), `missing ${token}`);
  assert.match(source, /!cloudAdapter/);
  assert.match(source, /window\.confirm/);
  assert.doesNotMatch(source, /auto.?prune|setInterval.*delete|Math\.random/i);
});

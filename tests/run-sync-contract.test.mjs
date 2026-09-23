import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { openRuntimeDb } from '../lib/run/indexeddb.mjs';
import { createSyncRepository } from '../lib/run/sync-repository.mjs';
import { createConflictCopy } from '../lib/run/conflicts.mjs';

test('enqueue deduplicates by mutation id and keeps the latest mutation payload', async () => {
  const db = await openRuntimeDb();
  const repo = createSyncRepository({ db });
  await repo.enqueue({ id: 'm1', operation: 'upsert', entityType: 'run', entityId: 'r1', createdAt: 1000, payload: { output: 'old' } });
  await repo.enqueue({ id: 'm1', operation: 'upsert', entityType: 'run', entityId: 'r1', createdAt: 2000, payload: { output: 'new' } });
  const pending = await repo.listPending();
  assert.equal(pending.length, 1);
  assert.equal(pending[0].payload.output, 'new');
  assert.equal(pending[0].state, 'pending');
  db.close();
});

test('sync error and conflict states are persisted explicitly', async () => {
  const db = await openRuntimeDb();
  const repo = createSyncRepository({ db });
  await repo.enqueue({ id: 'm1', operation: 'upsert', entityType: 'run', entityId: 'r1', createdAt: 1000 });
  await repo.markError('m1', 'offline');
  let record = await repo.get('m1');
  assert.equal(record.state, 'sync_error');
  assert.equal(record.error, 'offline');
  await repo.markConflict('m1', { cloudRevision: 4 });
  record = await repo.get('m1');
  assert.equal(record.state, 'conflict');
  assert.deepEqual(record.conflict, { cloudRevision: 4 });
  db.close();
});

test('markApplied removes an applied mutation from the pending queue', async () => {
  const db = await openRuntimeDb();
  const repo = createSyncRepository({ db });
  await repo.enqueue({ id: 'm1', operation: 'upsert', entityType: 'run', entityId: 'r1', createdAt: 1000 });
  await repo.markApplied('m1');
  assert.equal(await repo.get('m1'), null);
  assert.deepEqual(await repo.listPending(), []);
  db.close();
});

test('conflict copy preserves local data and never mutates either input', () => {
  const localRecord = { id: 'r1', revision: 3, output: 'local', syncState: 'pending' };
  const cloudRecord = { id: 'r1', revision: 4, output: 'cloud', syncState: 'synced' };
  const copy = createConflictCopy({
    localRecord,
    cloudRecord,
    now: () => Date.parse('2026-09-23T00:00:00.000Z'),
    idFactory: () => 'r-conflict',
    keyField: 'id',
  });
  assert.equal(copy.id, 'r-conflict');
  assert.equal(copy.output, 'local');
  assert.equal(copy.syncState, 'conflict');
  assert.equal(copy.conflictOf, 'r1');
  assert.equal(copy.sourceRevision, 3);
  assert.equal(copy.conflictDetectedAt, '2026-09-23T00:00:00.000Z');
  assert.equal(localRecord.syncState, 'pending');
  assert.equal(cloudRecord.output, 'cloud');
});

test('saved result conflict copy uses explicit resultId key field', () => {
  const copy = createConflictCopy({
    localRecord: { resultId: 'res-1', revision: 1, outputSnapshot: 'local' },
    cloudRecord: { resultId: 'res-1', revision: 2, outputSnapshot: 'cloud' },
    now: () => 0,
    idFactory: () => 'res-conflict',
    keyField: 'resultId',
  });
  assert.equal(copy.resultId, 'res-conflict');
  assert.equal(copy.conflictOf, 'res-1');
});

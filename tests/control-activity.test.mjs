import test from 'node:test';
import assert from 'node:assert/strict';
import { buildActivity, buildFailures } from '../lib/control/activity.mjs';

const snapshot = {
  runs: [
    { id: 'r1', promptId: 'p1', status: 'success', completedAt: 1000 },
    { id: 'r2', promptId: 'p2', status: 'failed', completedAt: 5000, error: { code: 'provider_error', message: 'Provider failed' } },
    { id: 'r3', promptId: 'p3', status: 'interrupted', updatedAt: 4000 },
  ],
  results: [{ resultId: 'x1', sourceRunId: 'r1', createdAt: 3000, name: 'Saved answer' }],
  versions: [{ versionId: 'v1', promptId: 'u1', versionNumber: 2, createdAt: 2000 }],
  syncItems: [
    { id: 's1', state: 'synced', updatedAt: 3500 },
    { id: 's2', state: 'sync_error', updatedAt: 4500, error: 'offline' },
  ],
  storageErrors: [{ id: 'storage-1', occurredAt: 4200, message: 'Quota exceeded' }],
};

test('activity is built only from real domain records and sorted newest first', () => {
  const activity = buildActivity(snapshot, { limit: 20 });
  assert.deepEqual(activity.map((item) => item.occurredAt), [5000, 4500, 4200, 4000, 3500, 3000, 2000, 1000]);
  assert.ok(activity.some((item) => item.type === 'run:failed' && item.sourceId === 'r2'));
  assert.ok(activity.some((item) => item.type === 'result:saved' && item.sourceId === 'x1'));
  assert.ok(activity.some((item) => item.type === 'version:created' && item.sourceId === 'v1'));
  assert.equal(activity.some((item) => item.synthetic === true), false);
});

test('failure groups include failed/interrupted runs, sync errors/conflicts, and storage errors only', () => {
  const failures = buildFailures(snapshot);
  assert.deepEqual(failures.runs.map((item) => item.id), ['r2', 'r3']);
  assert.deepEqual(failures.sync.map((item) => item.id), ['s2']);
  assert.deepEqual(failures.storage.map((item) => item.id), ['storage-1']);
});

test('empty persisted state yields empty activity/failures instead of generated placeholders', () => {
  assert.deepEqual(buildActivity({}), []);
  assert.deepEqual(buildFailures({}), { runs: [], sync: [], storage: [] });
});

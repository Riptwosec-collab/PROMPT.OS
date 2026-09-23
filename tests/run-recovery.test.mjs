import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUN_LEASE_HEARTBEAT_MS,
  RUN_LEASE_STALE_MS,
  isLeaseStale,
  recoverInterruptedRuns,
} from '../lib/run/recovery.mjs';

function fakeRepository(records) {
  const finalized = [];
  return {
    finalized,
    async recoverableActive() { return records.map((item) => ({ ...item })); },
    async finalize(id, patch) {
      finalized.push({ id, ...patch });
      return { ...records.find((item) => item.id === id), ...patch };
    },
  };
}

test('lease timing constants are bounded and stale threshold exceeds heartbeat interval', () => {
  assert.equal(RUN_LEASE_HEARTBEAT_MS, 5000);
  assert.equal(RUN_LEASE_STALE_MS, 20000);
  assert.ok(RUN_LEASE_STALE_MS > RUN_LEASE_HEARTBEAT_MS);
});

test('fresh lease owned by another tab is not interrupted', async () => {
  const repo = fakeRepository([{ id: 'r1', status: 'running', ownerSessionId: 'other-tab', heartbeatAt: 95_000 }]);
  const recovered = await recoverInterruptedRuns({ repository: repo, now: () => 100_000 });
  assert.equal(repo.finalized.length, 0);
  assert.deepEqual(recovered, []);
});

test('stale active lease is finalized as interrupted with partial output', async () => {
  const repo = fakeRepository([{ id: 'r1', status: 'running', output: 'partial', heartbeatAt: 70_000 }]);
  const recovered = await recoverInterruptedRuns({ repository: repo, now: () => 100_000 });
  assert.equal(repo.finalized.length, 1);
  assert.equal(repo.finalized[0].status, 'interrupted');
  assert.equal(repo.finalized[0].output, 'partial');
  assert.equal(recovered[0].status, 'interrupted');
});

test('missing or invalid heartbeat is stale while future/fresh heartbeat is active', () => {
  assert.equal(isLeaseStale({ heartbeatAt: null, now: 100_000 }), true);
  assert.equal(isLeaseStale({ heartbeatAt: NaN, now: 100_000 }), true);
  assert.equal(isLeaseStale({ heartbeatAt: 90_000, now: 100_000 }), false);
  assert.equal(isLeaseStale({ heartbeatAt: 101_000, now: 100_000 }), false);
});

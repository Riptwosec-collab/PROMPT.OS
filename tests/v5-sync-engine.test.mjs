import test from 'node:test';
import assert from 'node:assert/strict';
import { decideSync } from '../lib/sync/revision.mjs';
import { enqueueMutation, markMutationApplied } from '../lib/sync/offline-queue.mjs';
import { trimSnapshots } from '../lib/sync/snapshots.mjs';

test('stale pending local state must recover before cloud pull', () => {
  assert.equal(decideSync({ localBaseRevision: 4, cloudRevision: 5, hasPendingLocal: true }), 'recover_then_pull');
});

test('matching revision with pending data can push', () => {
  assert.equal(decideSync({ localBaseRevision: 5, cloudRevision: 5, hasPendingLocal: true }), 'push');
});

test('newer cloud state pulls when there is no pending local work', () => {
  assert.equal(decideSync({ localBaseRevision: 4, cloudRevision: 5, hasPendingLocal: false }), 'pull');
  assert.equal(decideSync({ localBaseRevision: 5, cloudRevision: 5, hasPendingLocal: false }), 'noop');
});

test('offline queue is immutable and only clears explicitly applied mutations', () => {
  const original = [];
  const mutation = {
    id: 'm1', operation: 'update_prompt', entityType: 'prompt', entityId: 'p1', baseRevision: 5,
    payload: { title: 'Updated' }, createdAt: '2026-09-16T08:00:00.000Z',
  };
  const queued = enqueueMutation(original, mutation);
  assert.equal(original.length, 0);
  assert.equal(queued.length, 1);
  assert.notStrictEqual(queued, original);
  assert.equal(markMutationApplied(queued, 'unknown').length, 1);
  assert.equal(markMutationApplied(queued, 'm1').length, 0);
});

test('snapshot retention keeps the newest entries up to the configured max', () => {
  const snapshots = Array.from({ length: 25 }, (_, index) => ({
    id: `s${index}`,
    createdAt: new Date(Date.UTC(2026, 8, 1, 0, index)).toISOString(),
  }));
  const trimmed = trimSnapshots(snapshots, 20);
  assert.equal(trimmed.length, 20);
  assert.equal(trimmed[0].id, 's24');
  assert.equal(trimmed.at(-1).id, 's5');
});

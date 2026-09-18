import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueToast } from '../lib/ui/toast-queue.mjs';

test('toast queue keeps at most three newest unique items', () => {
  let queue = [];
  for (const id of ['a', 'b', 'c', 'd']) queue = enqueueToast(queue, { id, message: id });
  assert.deepEqual(queue.map((item) => item.id), ['b', 'c', 'd']);
  queue = enqueueToast(queue, { id: 'd', message: 'updated' });
  assert.deepEqual(queue.map((item) => item.id), ['b', 'c', 'd']);
  assert.equal(queue.at(-1).message, 'updated');
});

test('updating an older toast moves the refreshed item to newest position without mutation', () => {
  const original = [
    { id: 'a', message: 'A' },
    { id: 'b', message: 'B' },
    { id: 'c', message: 'C' },
  ];
  const next = enqueueToast(original, { id: 'a', message: 'A2' });
  assert.deepEqual(next.map((item) => item.id), ['b', 'c', 'a']);
  assert.equal(next.at(-1).message, 'A2');
  assert.deepEqual(original.map((item) => item.message), ['A', 'B', 'C']);
});

test('queue accepts an explicit smaller positive display limit', () => {
  let queue = [];
  queue = enqueueToast(queue, { id: 'a', message: 'A' }, 2);
  queue = enqueueToast(queue, { id: 'b', message: 'B' }, 2);
  queue = enqueueToast(queue, { id: 'c', message: 'C' }, 2);
  assert.deepEqual(queue.map((item) => item.id), ['b', 'c']);
});

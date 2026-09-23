import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHECKPOINT_INTERVAL_MS,
  CHECKPOINT_CHAR_THRESHOLD,
  shouldCheckpoint,
} from '../lib/run/checkpoint.mjs';

test('checkpoint constants match the approved bounded policy', () => {
  assert.equal(CHECKPOINT_INTERVAL_MS, 750);
  assert.equal(CHECKPOINT_CHAR_THRESHOLD, 4096);
});

test('rapid small stream deltas do not checkpoint on every update', () => {
  let checkpoints = 0;
  for (let i = 1; i <= 100; i += 1) {
    if (shouldCheckpoint({
      lastCheckpointAt: 1000,
      now: 1000 + i,
      persistedLength: 0,
      outputLength: i * 20,
    })) checkpoints += 1;
  }
  assert.equal(checkpoints, 0);
});

test('elapsed interval triggers checkpoint', () => {
  assert.equal(shouldCheckpoint({
    lastCheckpointAt: 1000,
    now: 1750,
    persistedLength: 100,
    outputLength: 101,
  }), true);
});

test('character threshold triggers checkpoint', () => {
  assert.equal(shouldCheckpoint({
    lastCheckpointAt: 1000,
    now: 1100,
    persistedLength: 100,
    outputLength: 100 + CHECKPOINT_CHAR_THRESHOLD,
  }), true);
});

test('non-finite inputs do not accidentally force a checkpoint', () => {
  assert.equal(shouldCheckpoint({
    lastCheckpointAt: NaN,
    now: 1000,
    persistedLength: 0,
    outputLength: 10,
  }), false);
});

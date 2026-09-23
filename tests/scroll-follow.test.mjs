import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldFollowLatest } from '../lib/ai/scroll-follow.mjs';

test('follows when output is at the bottom', () => {
  assert.equal(shouldFollowLatest({ scrollTop: 700, clientHeight: 300, scrollHeight: 1000 }), true);
});

test('follows when output is within the default 96px threshold', () => {
  assert.equal(shouldFollowLatest({ scrollTop: 610, clientHeight: 300, scrollHeight: 1000 }), true);
  assert.equal(shouldFollowLatest({ scrollTop: 603, clientHeight: 300, scrollHeight: 1000 }), false);
});

test('supports an explicit threshold and guards invalid measurements', () => {
  assert.equal(shouldFollowLatest({ scrollTop: 650, clientHeight: 300, scrollHeight: 1000, threshold: 50 }), true);
  assert.equal(shouldFollowLatest({ scrollTop: Number.NaN, clientHeight: 300, scrollHeight: 1000 }), false);
  assert.equal(shouldFollowLatest({ scrollTop: 0, clientHeight: 0, scrollHeight: 0 }), true);
});

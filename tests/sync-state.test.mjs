import test from 'node:test';
import assert from 'node:assert/strict';
import { decideSyncAction } from '../lib/cloud/sync-state.mjs';

test('pushes local data when the cloud is empty', () => {
  assert.equal(decideSyncAction({ localUpdatedAt: '2026-09-16T01:00:00Z', cloudUpdatedAt: null }), 'push');
});

test('pulls cloud data when it is newer', () => {
  assert.equal(decideSyncAction({
    localUpdatedAt: '2026-09-16T01:00:00Z',
    cloudUpdatedAt: '2026-09-16T02:00:00Z',
  }), 'pull');
});

test('pushes local data when it is newer', () => {
  assert.equal(decideSyncAction({
    localUpdatedAt: '2026-09-16T03:00:00Z',
    cloudUpdatedAt: '2026-09-16T02:00:00Z',
  }), 'push');
});

test('reports equal when timestamps match', () => {
  assert.equal(decideSyncAction({
    localUpdatedAt: '2026-09-16T02:00:00Z',
    cloudUpdatedAt: '2026-09-16T02:00:00Z',
  }), 'equal');
});

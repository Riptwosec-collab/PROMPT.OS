import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSmartCollections } from '../lib/prompts/smart-collections.mjs';

const NOW = new Date('2026-09-17T08:00:00.000Z');

const prompts = [
  { id: 'a', favorite: true, pinned: false, runs: 10, copyCount: 5, lastUsedAt: '2026-09-17T07:30:00.000Z', createdAt: '2026-09-16T00:00:00.000Z', variableConfig: { topic: { type: 'text' } }, difficulty: 'advanced', prompt: 'A'.repeat(100) },
  { id: 'b', favorite: false, pinned: true, runs: 2, copyCount: 1, lastUsedAt: '2026-09-10T07:30:00.000Z', createdAt: '2026-09-17T06:00:00.000Z', variableConfig: {}, difficulty: 'beginner', prompt: 'Short' },
  { id: 'c', favorite: false, pinned: false, runs: 20, copyCount: 10, lastUsedAt: null, createdAt: '2026-08-01T00:00:00.000Z', variableConfig: { input: { type: 'textarea' } }, difficulty: 'advanced', prompt: 'C'.repeat(600) },
  { id: 'deleted', favorite: true, pinned: true, runs: 99, copyCount: 99, deletedAt: '2026-09-17T00:00:00.000Z', prompt: 'Deleted' },
];

test('buildSmartCollections returns deterministic non-mutating smart views', () => {
  const snapshot = structuredClone(prompts);
  const views = buildSmartCollections(prompts, NOW);

  assert.deepEqual(views.favorites.map((item) => item.id), ['a']);
  assert.deepEqual(views.pinned.map((item) => item.id), ['b']);
  assert.deepEqual(views.recentlyUsed.map((item) => item.id), ['a', 'b']);
  assert.deepEqual(views.mostUsed.map((item) => item.id), ['c', 'a', 'b']);
  assert.deepEqual(views.recentlyAdded.map((item) => item.id), ['b', 'a']);
  assert.deepEqual(views.advanced.map((item) => item.id), ['a', 'c']);
  assert.deepEqual(views.hasVariables.map((item) => item.id), ['a', 'c']);
  assert.ok(views.quickPrompts.some((item) => item.id === 'b'));
  assert.deepEqual(prompts, snapshot);
});

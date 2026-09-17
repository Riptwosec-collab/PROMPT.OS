import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectVisiblePrompts,
  selectPromptById,
  selectFavoritePrompts,
  selectPinnedPrompts,
} from '../lib/prompts/state-selectors.mjs';

const prompts = [
  { id: 'a', name: 'A', prompt: 'A', favorite: true, pinned: false, deletedAt: null },
  { id: 'b', name: 'B', prompt: 'B', favorite: false, pinned: true, deletedAt: null },
  { id: 'c', name: 'C', prompt: 'C', favorite: true, pinned: true, deletedAt: '2026-09-17T00:00:00.000Z' },
];

test('visible selectors exclude soft-deleted prompts without mutating source', () => {
  const snapshot = structuredClone(prompts);
  assert.deepEqual(selectVisiblePrompts(prompts).map((prompt) => prompt.id), ['a', 'b']);
  assert.deepEqual(selectFavoritePrompts(prompts).map((prompt) => prompt.id), ['a']);
  assert.deepEqual(selectPinnedPrompts(prompts).map((prompt) => prompt.id), ['b']);
  assert.deepEqual(prompts, snapshot);
});

test('prompt lookup excludes deleted records by default and can include them explicitly', () => {
  assert.equal(selectPromptById(prompts, 'c'), null);
  assert.equal(selectPromptById(prompts, 'c', { includeDeleted: true })?.id, 'c');
  assert.equal(selectPromptById(prompts, 'missing'), null);
});

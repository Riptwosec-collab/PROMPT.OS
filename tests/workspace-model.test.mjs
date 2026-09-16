import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWorkspaceState, movePrompt, reorderByIds } from '../lib/workspace/model.mjs';
import { applySmartView } from '../lib/workspace/smart-views.mjs';

test('legacy data gets a default personal workspace', () => {
  const state = normalizeWorkspaceState({});
  assert.equal(state.workspaces[0].id, 'personal');
  assert.deepEqual(state.folders, []);
});

test('movePrompt changes metadata without duplicating prompt', () => {
  const result = movePrompt([{ id: 'p1', title: 'A' }], 'p1', 'work', 'network');
  assert.equal(result.length, 1);
  assert.equal(result[0].workspaceId, 'work');
  assert.equal(result[0].folderId, 'network');
});

test('reorderByIds preserves unmentioned items after explicit order', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(reorderByIds(items, ['c', 'a']).map((item) => item.id), ['c', 'a', 'b']);
});

test('smart views filter data without duplicating prompt records', () => {
  const now = new Date('2026-09-16T12:00:00.000Z');
  const prompts = [
    { id: 'a', updatedAt: '2026-09-15T12:00:00.000Z', healthScore: 3, cost: 2 },
    { id: 'b', updatedAt: '2026-08-01T12:00:00.000Z', healthScore: 6, cost: 0.2 },
  ];

  assert.deepEqual(applySmartView(prompts, { type: 'modified-this-week' }, now).map((item) => item.id), ['a']);
  assert.deepEqual(applySmartView(prompts, { type: 'health-below', value: 4 }, now).map((item) => item.id), ['a']);
  assert.deepEqual(applySmartView(prompts, { type: 'cost-above', value: 1 }, now).map((item) => item.id), ['a']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeWorkspaceState,
  movePrompt,
  reorderByIds,
  createWorkspace,
  createFolder,
  movePromptToFolder,
  removePromptFromFolder,
} from '../lib/workspace/model.mjs';
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

test('workspace and folder factories create reference-only organization records', () => {
  const workspace = createWorkspace({ id: 'work', name: 'Work' });
  const folder = createFolder({ id: 'network', workspaceId: workspace.id, name: 'Network' });
  assert.deepEqual(workspace, { id: 'work', name: 'Work', order: 0, archivedAt: null });
  assert.deepEqual(folder, { id: 'network', workspaceId: 'work', name: 'Network', order: 0, archivedAt: null });
  assert.equal(folder.prompts, undefined);
});

test('moving and removing folder membership never duplicates or deletes prompt records', () => {
  const source = [{ id: 'p1', title: 'A', workspaceId: 'personal', folderId: null }];
  const moved = movePromptToFolder(source, 'p1', { workspaceId: 'work', folderId: 'network' });
  assert.equal(moved.length, 1);
  assert.equal(moved[0].folderId, 'network');
  assert.deepEqual(source, [{ id: 'p1', title: 'A', workspaceId: 'personal', folderId: null }]);

  const removed = removePromptFromFolder(moved, 'p1');
  assert.equal(removed.length, 1);
  assert.equal(removed[0].folderId, null);
  assert.equal(removed[0].id, 'p1');
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

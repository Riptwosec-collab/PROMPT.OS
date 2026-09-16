import test from 'node:test';
import assert from 'node:assert/strict';
import { upgradeLocalDatabaseV5 } from '../lib/prompts/local-db-v5.mjs';

test('legacy V4 prompt state upgrades without losing prompt data', () => {
  const legacy = {
    schemaVersion: 4,
    collections: ['General'],
    prompts: [{
      id: 1,
      title: 'Legacy',
      prompt: 'Hi {{name}}',
      variables: { name: 'Mek' },
      favorite: true,
    }],
  };

  const next = upgradeLocalDatabaseV5(legacy);

  assert.equal(next.schemaVersion, 5);
  assert.equal(next.prompts.length, 1);
  assert.equal(next.prompts[0].title, 'Legacy');
  assert.equal(next.prompts[0].workspaceId, 'personal');
  assert.equal(next.prompts[0].folderId, null);
  assert.equal(next.prompts[0].variableSchema.name.type, 'text');
  assert.deepEqual(next.prompts[0].variables, { name: 'Mek' });
  assert.deepEqual(next.collections, ['General']);
  assert.equal(next.prompts[0].favorite, true);
});

test('existing V5 workspace and variable metadata is preserved', () => {
  const current = {
    schemaVersion: 5,
    workspaces: [{ id: 'work', name: 'WORK', order: 0, archivedAt: null }],
    folders: [{ id: 'network', workspaceId: 'work', name: 'NETWORK', order: 0, archivedAt: null }],
    savedViews: [{ id: 'recent', type: 'modified-this-week' }],
    prompts: [{
      id: 'p1',
      prompt: '{{language}}',
      workspaceId: 'work',
      folderId: 'network',
      variableSchema: { language: { type: 'select', options: ['Thai', 'English'], default: 'Thai' } },
    }],
  };

  const next = upgradeLocalDatabaseV5(current);
  assert.equal(next.prompts[0].workspaceId, 'work');
  assert.equal(next.prompts[0].folderId, 'network');
  assert.equal(next.prompts[0].variableSchema.language.type, 'select');
  assert.equal(next.savedViews.length, 1);
});

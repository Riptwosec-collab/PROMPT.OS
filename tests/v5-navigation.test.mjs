import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeV5Page, V5_NAV_ITEMS } from '../lib/ui/v5-navigation.mjs';

test('V5 navigation contains approved pages and defaults to home', () => {
  assert.deepEqual(V5_NAV_ITEMS.map((item) => item.id), [
    'home', 'library', 'workspaces', 'evaluation', 'improve', 'analytics', 'cloud', 'trash', 'settings',
  ]);
  assert.equal(normalizeV5Page('unknown'), 'home');
  assert.equal(normalizeV5Page('library'), 'library');
});

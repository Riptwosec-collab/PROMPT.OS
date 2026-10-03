import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeV5Page, V5_NAV_ITEMS, visibleV5NavItems } from '../lib/ui/v5-navigation.mjs';

test('V5 navigation contains approved pages and defaults to home', () => {
  assert.deepEqual(V5_NAV_ITEMS.map((item) => item.id), [
    'home', 'library', 'history', 'results', 'workspaces', 'evaluation', 'improve', 'analytics', 'cloud', 'trash', 'settings',
  ]);
  assert.equal(normalizeV5Page('unknown'), 'home');
  assert.equal(normalizeV5Page('library'), 'library');
});

test('release navigation hides incomplete destinations until their release gate is enabled', () => {
  const base = visibleV5NavItems({}).map((item) => item.id);
  assert.equal(base.includes('history'), false);
  assert.equal(base.includes('results'), false);
  assert.equal(base.includes('workspaces'), false);
  assert.equal(base.includes('analytics'), false);
  assert.equal(base.includes('cloud'), false);

  const daily = visibleV5NavItems({ dailyUse: true }).map((item) => item.id);
  assert.ok(daily.includes('history'));
  assert.ok(daily.includes('results'));
});

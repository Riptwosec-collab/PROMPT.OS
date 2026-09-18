import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCommandItems, shouldHandleShortcut } from '../lib/ui/command-palette.mjs';
import { buildCommandItems } from '../lib/ui/command-items.mjs';

test('non-modifier shortcuts are ignored for editable targets', () => {
  assert.equal(shouldHandleShortcut({ key: 'n', target: { tagName: 'INPUT' } }), false);
  assert.equal(shouldHandleShortcut({ key: 'n', target: { tagName: 'TEXTAREA' } }), false);
  assert.equal(shouldHandleShortcut({ key: 'n', target: { tagName: 'SELECT' } }), false);
  assert.equal(shouldHandleShortcut({ key: 'n', target: { isContentEditable: true } }), false);
  assert.equal(shouldHandleShortcut({ key: 'n', target: { tagName: 'DIV' } }), true);
});

test('Ctrl or Cmd shortcuts remain available while editing', () => {
  assert.equal(shouldHandleShortcut({ key: 'k', ctrlKey: true, target: { tagName: 'INPUT' } }), true);
  assert.equal(shouldHandleShortcut({ key: 'k', metaKey: true, target: { tagName: 'TEXTAREA' } }), true);
});

test('command ranking is case-insensitive and commands win score ties', () => {
  const items = [
    { id: 'prompt-1', title: 'Open Cloud Prompt', keywords: ['cloud'], kind: 'prompt' },
    { id: 'cmd-cloud', title: 'Open Cloud', keywords: ['cloud'], kind: 'command' },
    { id: 'cmd-settings', title: 'Open Settings', keywords: ['preferences'], kind: 'command' },
  ];

  const ranked = rankCommandItems('CLOUD', items);
  assert.deepEqual(ranked.map((item) => item.id), ['cmd-cloud', 'prompt-1']);
});

test('command items map navigation, prompts and explicit actions into one stable shape', () => {
  const items = buildCommandItems({
    navItems: [{ id: 'library', label: 'LIBRARY' }, { id: 'settings', label: 'SETTINGS' }],
    prompts: [{ id: 42, displayTitle: 'Network Audit', name: 'NETWORK_AUDIT', category: 'Network', tags: ['cisco'] }],
    actions: [{ id: 'new-prompt', title: 'New Prompt', keywords: ['create'], action: { type: 'action', name: 'new-prompt' } }],
  });

  assert.deepEqual(items.map((item) => item.kind), ['navigation', 'navigation', 'prompt', 'command']);
  assert.deepEqual(items[0].action, { type: 'navigate', page: 'library' });
  assert.deepEqual(items[2].action, { type: 'prompt', promptId: 42 });
  assert.deepEqual(items[3].action, { type: 'action', name: 'new-prompt' });
  assert.ok(items[2].keywords.includes('Network'));
});

test('constructed command items retain stable ranking order for equal prompt matches', () => {
  const items = buildCommandItems({
    navItems: [],
    prompts: [
      { id: 'a', displayTitle: 'Cloud Review', tags: ['cloud'] },
      { id: 'b', displayTitle: 'Cloud Research', tags: ['cloud'] },
    ],
  });
  assert.deepEqual(rankCommandItems('cloud', items).map((item) => item.id), ['prompt:a', 'prompt:b']);
});

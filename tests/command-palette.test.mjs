import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCommandItems, shouldHandleShortcut } from '../lib/ui/command-palette.mjs';

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

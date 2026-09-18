import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('command palette exposes keyboard-first accessible dialog behavior', () => {
  const source = read('components/command/CommandPaletteV5.jsx');
  assert.match(source, /AnimatePresence/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /role="combobox"/);
  assert.match(source, /role="listbox"/);
  for (const key of ['ArrowDown', 'ArrowUp', 'Enter', 'Escape']) assert.match(source, new RegExp(key));
  assert.match(source, /previousFocusRef/);
  assert.match(source, /\.focus\(\)/);
  assert.match(source, /useReducedMotion/);
});

test('page opens command palette from fresh prompt state and reuses library request routing', () => {
  const page = read('app/page.jsx');
  assert.match(page, /openCommandPalette/);
  assert.match(page, /loadPromptCatalogState/);
  assert.match(page, /AI_PROMPT_LIBRARY/);
  assert.match(page, /V5_COMMAND_PALETTE/);
  assert.match(page, /shouldHandleShortcut/);
  assert.match(page, /ctrlKey|metaKey/);
  assert.match(page, /type:\s*['"]prompt['"]/);
  assert.match(page, /type:\s*['"]navigate['"]/);
});

test('neo command palette uses a focused spotlight surface without magnetic row movement', () => {
  const source = read('components/command/CommandPaletteV5.jsx');
  assert.match(source, /v5-command-spotlight/);
  assert.match(source, /v5-command-selected/);
  assert.equal(/MagneticAction/.test(source), false);
  assert.equal(/mode="wait"/.test(source), false);
});

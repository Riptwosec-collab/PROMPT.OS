import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('V5 library integrates smart collections, prompt packs and workspace sidebar', () => {
  const library = read('components/prompt/PromptLibraryV5.jsx');
  assert.match(library, /buildSmartCollections/);
  assert.match(library, /PromptPacks/);
  assert.match(library, /WorkspaceSidebar/);
  assert.match(library, /recentlyUsed/);
  assert.match(library, /mostUsed/);
});

test('Prompt packs render reference-only promptIds without embedding cloned prompt records', () => {
  const source = read('components/prompt/PromptPacks.jsx');
  assert.match(source, /promptIds/);
  assert.match(source, /Add all to Workspace/);
  assert.doesNotMatch(source, /prompts\s*:\s*\[/);
});

test('Workspace sidebar exposes folder and smart collection navigation', () => {
  const source = read('components/workspace/WorkspaceSidebar.jsx');
  for (const label of ['Favorites', 'Pinned', 'Recently Used', 'Most Used', 'Recently Added', 'Has Variables']) {
    assert.match(source, new RegExp(label.replace(' ', '\\s*'), 'i'));
  }
  assert.match(source, /folders/);
  assert.match(source, /workspace/);
});

test('Legacy PromptOS fallback remains visible while discovery surfaces stay feature-gated', () => {
  const page = read('app/page.jsx');
  assert.match(page, /<PromptOS \/>/);
  assert.match(page, /V5_WORKSPACE/);
  assert.match(page, /V5_SMART_COLLECTIONS/);
});

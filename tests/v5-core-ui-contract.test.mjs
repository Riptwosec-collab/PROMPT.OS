import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('app gates V5 core library behind V5_SEARCH and keeps PromptOS as legacy fallback', () => {
  const source = fs.readFileSync('app/page.jsx', 'utf8');
  assert.match(source, /V5_SEARCH/);
  assert.match(source, /<PromptLibraryV5/);
  assert.match(source, /<PromptOS \/>/);
});

test('PromptSearch exposes quick filters and advanced filter controls', () => {
  const source = fs.readFileSync('components/prompt/PromptSearch.jsx', 'utf8');
  for (const label of ['Favorites', 'Recent', 'Category', 'Difficulty', 'Source', 'Has Variables']) {
    assert.match(source, new RegExp(label.replace(' ', '\\s*'), 'i'));
  }
  assert.match(source, /aria-label="Search prompts"/);
});

test('V5 library delegates ranking to Search V2 and preserves the shared promptVaultData storage key', () => {
  const source = fs.readFileSync('components/prompt/PromptLibraryV5.jsx', 'utf8');
  assert.match(source, /searchPrompts/);
  assert.match(source, /promptVaultData/);
  assert.match(source, /mergePromptCatalog/);
});

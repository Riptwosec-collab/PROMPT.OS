import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('PromptOS gates Search V2 behind V5_SEARCH and keeps legacy search fallback', () => {
  const source = fs.readFileSync('components/PromptOS.jsx', 'utf8');
  assert.match(source, /useV5FeatureFlags/);
  assert.match(source, /V5_SEARCH/);
  assert.match(source, /<PromptSearch/);
  assert.match(source, /SEARCH_PROMPTS_RESULTS_NOTES/);
});

test('PromptSearch exposes quick filters and advanced filter controls', () => {
  const source = fs.readFileSync('components/prompt/PromptSearch.jsx', 'utf8');
  for (const label of ['Favorites', 'Recent', 'Category', 'Difficulty', 'Source', 'Has Variables']) {
    assert.match(source, new RegExp(label.replace(' ', '\\s*'), 'i'));
  }
  assert.match(source, /aria-label="Search prompts"/);
});

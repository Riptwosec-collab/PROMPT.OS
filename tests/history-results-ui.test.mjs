import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { V5_NAV_ITEMS, buildDailyUseNavItems, normalizeV5Page } from '../lib/ui/v5-navigation.mjs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('daily navigation adds separate History and Saved Results destinations without changing flag-off base navigation', () => {
  const baseIds = V5_NAV_ITEMS.map((item) => item.id);
  assert.equal(baseIds.includes('history'), false);
  assert.equal(baseIds.includes('results'), false);
  assert.deepEqual(buildDailyUseNavItems(false), V5_NAV_ITEMS);
  const daily = buildDailyUseNavItems(true);
  assert.ok(daily.some((item) => item.id === 'history'));
  assert.ok(daily.some((item) => item.id === 'results'));
  assert.equal(normalizeV5Page('history'), 'history');
  assert.equal(normalizeV5Page('results'), 'results');
});

test('History workspace exposes all approved filters pagination selection export delete and Studio-gated Compare', () => {
  const source = read('components/history/RunHistory.jsx');
  for (const token of ['Run History', 'Search history', 'Status', 'Prompt ID', 'Provider', 'Model', 'From date', 'To date', 'Saved state', 'Load more', 'Export', 'Delete selected']) assert.ok(source.includes(token), `missing ${token}`);
  assert.match(source, /promptId/);
  assert.match(source, /provider/);
  assert.match(source, /model/);
  assert.match(source, /saved/);
  assert.match(source, /runRepository\.listPage/);
  assert.match(source, /window\.confirm/);
  assert.match(source, /V5_PROMPT_STUDIO/);
  assert.match(source, /prompt-os:compare/);
  assert.doesNotMatch(source, /openRuntimeDb|indexedDB/);
});

test('Saved Results workspace exposes immutable artifacts, complete metadata actions and source Run access', () => {
  const source = read('components/results/SavedResults.jsx');
  for (const token of ['Saved Results', 'Search results', 'Rename', 'Pin', 'Tags', 'Notes', 'Open source Run', 'Open source Prompt', 'Duplicate', 'Export', 'Delete']) assert.ok(source.includes(token), `missing ${token}`);
  assert.match(source, /resultRepository\.listPage/);
  assert.match(source, /resultRepository\.getSourceRun/);
  assert.match(source, /updateMetadata/);
  assert.match(source, /duplicate/);
  assert.match(source, /V5_PROMPT_STUDIO/);
  assert.match(source, /prompt-os:compare/);
  assert.doesNotMatch(source, /openRuntimeDb|indexedDB/);
});

test('PromptLibrary remains the runtime repository owner and routes daily destinations without creating a second DB owner', () => {
  const library = read('components/prompt/PromptLibraryV5.jsx');
  const page = read('app/page.jsx');
  assert.match(library, /RunHistory/);
  assert.match(library, /SavedResults/);
  assert.match(library, /runRuntime\.runRepository/);
  assert.match(library, /runRuntime\.resultRepository/);
  assert.match(page, /V5_DAILY_USE_COMPLETE/);
  assert.doesNotMatch(page, /openRuntimeDb|createRunRepository|createResultRepository/);
});

test('shell navigation components accept gated navigation item sets instead of globally exposing unfinished destinations', () => {
  const shell = read('components/shell/AppShell.jsx');
  const sidebar = read('components/shell/Sidebar.jsx');
  assert.match(shell, /navigationItems/);
  assert.match(sidebar, /items\s*=\s*V5_NAV_ITEMS/);
});

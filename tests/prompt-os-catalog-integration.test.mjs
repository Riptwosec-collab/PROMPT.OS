import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AI_PROMPT_LIBRARY, mergePromptCatalog } from '../lib/prompts/ai-prompt-library.mjs';
import { loadPromptCatalogState, PROMPT_STORAGE_KEY } from '../lib/prompts/client-store.mjs';
import { BASELINE_80_IDS } from './fixtures/prompt-catalog-baseline-80.mjs';

const source = fs.readFileSync(new URL('../components/PromptOS.jsx', import.meta.url), 'utf8');

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

test('Prompt.OS migrates the centralized prompt catalog without overwriting existing data', () => {
  assert.match(source, /AI_PROMPT_LIBRARY/);
  assert.match(source, /PROMPT_CATALOG_VERSION/);
  assert.match(source, /mergePromptCatalog/);
  assert.match(source, /catalogVersion/);
});

test('80-to-100 merge preserves managed user state and appends each addition once', () => {
  const original = AI_PROMPT_LIBRARY.find((prompt) => BASELINE_80_IDS.includes(prompt.id));
  const legacy = {
    ...original,
    favorite: true,
    pinned: true,
    rating: 4,
    copyCount: 9,
    runs: 7,
    results: [{ id: 'result-1', content: 'kept' }],
    collections: ['My Ops Pack'],
    createdAt: '2025-01-02T03:04:05.000Z',
    variables: { ...(original.variables || {}), topic: 'Zero Trust', language: '' },
  };

  const once = mergePromptCatalog([legacy], AI_PROMPT_LIBRARY);
  const twice = mergePromptCatalog(once, AI_PROMPT_LIBRARY);
  const upgraded = twice.find((prompt) => prompt.id === original.id);

  assert.equal(once.length, 100);
  assert.equal(twice.length, 100);
  assert.deepEqual(twice.map((prompt) => prompt.id), once.map((prompt) => prompt.id));
  assert.equal(upgraded.favorite, true);
  assert.equal(upgraded.pinned, true);
  assert.equal(upgraded.rating, 4);
  assert.equal(upgraded.copyCount, 9);
  assert.equal(upgraded.runs, 7);
  assert.deepEqual(upgraded.results, [{ id: 'result-1', content: 'kept' }]);
  assert.ok(upgraded.collections.includes('My Ops Pack'));
  assert.equal(upgraded.createdAt, '2025-01-02T03:04:05.000Z');
  assert.equal(upgraded.variables.topic, 'Zero Trust');
  assert.equal(upgraded.variables.language, 'Thai');
});

test('client-store hydration is idempotent and preserves user-created prompts beside 100 built-ins', () => {
  const userPrompt = {
    id: 'user-custom-1',
    name: 'MY_CUSTOM_PROMPT',
    displayTitle: 'My Custom Prompt',
    prompt: 'Summarize {{content}}',
    variables: { content: 'keep me' },
    variableConfig: { content: { type: 'textarea', required: true } },
    favorite: true,
  };
  const storedManaged = { ...AI_PROMPT_LIBRARY[0], favorite: true, runs: 3 };
  const storage = memoryStorage({
    [PROMPT_STORAGE_KEY]: JSON.stringify({ schemaVersion: 5, prompts: [storedManaged, userPrompt] }),
  });

  const first = loadPromptCatalogState(storage, AI_PROMPT_LIBRARY);
  storage.setItem(PROMPT_STORAGE_KEY, JSON.stringify({ schemaVersion: 5, prompts: first.prompts }));
  const second = loadPromptCatalogState(storage, AI_PROMPT_LIBRARY);

  assert.equal(first.prompts.filter((prompt) => prompt.catalogManaged || String(prompt.id).startsWith('ai-lib-')).length, 100);
  assert.equal(second.prompts.filter((prompt) => prompt.catalogManaged || String(prompt.id).startsWith('ai-lib-')).length, 100);
  assert.equal(new Set(second.prompts.map((prompt) => prompt.id)).size, second.prompts.length);
  assert.equal(second.prompts.find((prompt) => prompt.id === storedManaged.id).favorite, true);
  assert.equal(second.prompts.find((prompt) => prompt.id === storedManaged.id).runs, 3);
  assert.equal(second.prompts.find((prompt) => prompt.id === 'user-custom-1').variables.content, 'keep me');
  assert.equal(second.prompts.find((prompt) => prompt.id === 'user-custom-1').favorite, true);
});

test('search includes catalog name and display title metadata', () => {
  assert.match(source, /prompt\.name/);
  assert.match(source, /prompt\.displayTitle/);
});

test('delete actions use the two-step destructive confirmation helper', () => {
  assert.match(source, /confirmDestructiveAction\(/);
  assert.match(source, /Confirm again: move/);
  assert.match(source, /FINAL CONFIRMATION: permanently delete/);
});

test('prompt detail exposes catalog metadata, copy, edit, favorite, and smart variable fields', () => {
  assert.match(source, /PROMPT_METADATA/);
  assert.match(source, /compatibleModels/);
  assert.match(source, /COPY PROMPT/);
  assert.match(source, /onEdit/);
  assert.match(source, /getVariableInputKind/);
  assert.match(source, /VariableInput/);
});

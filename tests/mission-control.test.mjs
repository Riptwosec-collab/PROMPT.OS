import test from 'node:test';
import assert from 'node:assert/strict';

import { AI_PROMPT_LIBRARY, PROMPT_CATALOG_VERSION } from '../lib/prompts/ai-prompt-library.mjs';
import {
  readStoredPromptDatabase,
  loadPromptCatalogState,
  persistPromptCatalogState,
} from '../lib/prompts/client-store.mjs';
import { buildDefaultPacks } from '../lib/prompts/default-packs.mjs';
import { buildMissionControlModel } from '../lib/home/mission-control.mjs';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    dump(key) { return data.get(key); },
  };
}

test('stored prompt database parser falls back safely for corrupted JSON', () => {
  const storage = memoryStorage({ promptVaultData: '{broken json' });
  assert.equal(readStoredPromptDatabase(storage), null);
});

test('shared client store merges catalog state and preserves local prompt metadata', () => {
  const source = AI_PROMPT_LIBRARY[0];
  const storage = memoryStorage({
    promptVaultData: JSON.stringify({
      customField: 'keep-me',
      prompts: [{ ...source, favorite: true, copyCount: 7 }],
    }),
  });

  const { prompts, database } = loadPromptCatalogState(storage, AI_PROMPT_LIBRARY);
  const merged = prompts.find((prompt) => String(prompt.id) === String(source.id));

  assert.equal(prompts.length, AI_PROMPT_LIBRARY.length);
  assert.equal(merged.favorite, true);
  assert.equal(merged.copyCount, 7);
  assert.equal(database.customField, 'keep-me');
});

test('shared client store persists prompts without dropping unrelated database fields', () => {
  const storage = memoryStorage();
  const prompts = AI_PROMPT_LIBRARY.slice(0, 2);
  persistPromptCatalogState(storage, prompts, { customField: 'keep-me', schemaVersion: 2 });

  const stored = JSON.parse(storage.dump('promptVaultData'));
  assert.equal(stored.customField, 'keep-me');
  assert.equal(stored.catalogVersion, PROMPT_CATALOG_VERSION);
  assert.equal(stored.schemaVersion, 5);
  assert.equal(stored.prompts.length, 2);
  assert.ok(Date.parse(stored.updatedAt));
});

test('default packs retain prompt references rather than cloning prompt records', () => {
  const packs = buildDefaultPacks(AI_PROMPT_LIBRARY);
  assert.deepEqual(packs.map((pack) => pack.id), ['network-engineer', 'research', 'developer']);
  assert.ok(packs.every((pack) => Array.isArray(pack.promptIds)));
  assert.ok(packs.every((pack) => pack.promptIds.every((id) => ['string', 'number'].includes(typeof id))));
  assert.equal(packs.some((pack) => Object.hasOwn(pack, 'prompts')), false);
});

test('mission control orders real recent work and activity by last-use time', () => {
  const prompts = [
    { ...AI_PROMPT_LIBRARY[0], id: 'old', lastUsedAt: '2026-09-16T10:00:00.000Z' },
    { ...AI_PROMPT_LIBRARY[1], id: 'new', lastUsedAt: '2026-09-18T09:00:00.000Z' },
    { ...AI_PROMPT_LIBRARY[2], id: 'middle', lastUsedAt: '2026-09-17T12:00:00.000Z' },
  ];
  const model = buildMissionControlModel(prompts, {
    now: new Date('2026-09-18T10:00:00.000Z'),
    packs: [],
  });

  assert.deepEqual(model.continueWorking.map((prompt) => prompt.id), ['new', 'middle']);
  assert.deepEqual(model.activity.map((item) => item.promptId), ['new', 'middle', 'old']);
});

test('mission control hides recent/activity data when records have no real use timestamp', () => {
  const model = buildMissionControlModel(AI_PROMPT_LIBRARY.slice(0, 3), {
    now: new Date('2026-09-18T10:00:00.000Z'),
    packs: [],
  });
  assert.deepEqual(model.continueWorking, []);
  assert.deepEqual(model.activity, []);
});

test('mission control health summary is deterministic over actual prompts', () => {
  const prompts = AI_PROMPT_LIBRARY.slice(0, 2);
  const first = buildMissionControlModel(prompts, { now: new Date('2026-09-18T00:00:00Z'), packs: [] });
  const second = buildMissionControlModel(prompts, { now: new Date('2026-09-18T00:00:00Z'), packs: [] });
  assert.deepEqual(first.healthSummary, second.healthSummary);
  assert.equal(first.healthSummary.analyzedCount, 2);
  assert.ok(first.healthSummary.average >= 0 && first.healthSummary.average <= 100);
});

test('mission control never invents execution telemetry', () => {
  const model = buildMissionControlModel([
    { ...AI_PROMPT_LIBRARY[0], id: 'usage-a', runs: 2, copyCount: 3 },
  ], {
    now: new Date('2026-09-18T00:00:00Z'),
    packs: [],
  });
  assert.equal(model.usage.runs, 2);
  assert.equal(model.usage.copies, 3);
  assert.equal('tokens' in model.usage, false);
  assert.equal('cost' in model.usage, false);
  assert.equal('latency' in model.usage, false);
  assert.equal('successRate' in model.usage, false);
  assert.equal(model.healthSummary.analyzedCount, 1);
});

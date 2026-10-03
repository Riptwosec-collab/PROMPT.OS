import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { serializeArtifact } from '../lib/export/artifact-export.mjs';
import { V5_NAV_ITEMS } from '../lib/ui/v5-navigation.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('artifact export supports markdown txt json without fabricating absent telemetry', () => {
  const record = {
    id: 'run-1', promptId: 'p1', promptSnapshot: 'Prompt {{x}}', variablesSnapshot: { x: 'A' },
    renderedPrompt: 'Prompt A', output: 'Result', status: 'success', createdAt: 10, completedAt: 20,
  };
  const markdown = serializeArtifact({ kind: 'run', record, format: 'markdown' });
  assert.match(markdown, /Prompt A/);
  assert.match(markdown, /Result/);
  assert.match(markdown, /"x": "A"/);
  assert.doesNotMatch(markdown, /Tokens|Latency/);
  const txt = serializeArtifact({ kind: 'run', record, format: 'txt' });
  assert.match(txt, /Prompt A/);
  assert.match(txt, /Result/);
  const parsed = JSON.parse(serializeArtifact({ kind: 'run', record, format: 'json' }));
  assert.equal(parsed.schema, 'prompt-os-artifact-v1');
  assert.equal(parsed.kind, 'run');
  assert.equal(parsed.record.id, 'run-1');
});

test('daily-use navigation includes distinct history and saved results destinations', () => {
  assert.ok(V5_NAV_ITEMS.some((item) => item.id === 'history'));
  assert.ok(V5_NAV_ITEMS.some((item) => item.id === 'results'));
  assert.notEqual(V5_NAV_ITEMS.find((item) => item.id === 'history')?.label, V5_NAV_ITEMS.find((item) => item.id === 'results')?.label);
});

test('history and saved result surfaces consume repositories and do not open IndexedDB directly', () => {
  const history = read('components/history/RunHistory.jsx');
  const results = read('components/results/SavedResults.jsx');
  for (const source of [history, results]) {
    assert.doesNotMatch(source, /indexedDB|openRuntimeDb/);
    assert.match(source, /listPage/);
  }
  assert.match(history, /Run History/);
  assert.match(results, /Saved Results/);
  assert.doesNotMatch(history + results, />Compare</);
});

test('page gates daily-use destinations and shares one runtime repository owner', () => {
  const page = read('app/page.jsx');
  assert.match(page, /V5_DAILY_USE_COMPLETE/);
  assert.match(page, /RunHistory/);
  assert.match(page, /SavedResults/);
  assert.match(page, /runtime\.runRepository/);
  assert.match(page, /runtime\.resultRepository/);
});

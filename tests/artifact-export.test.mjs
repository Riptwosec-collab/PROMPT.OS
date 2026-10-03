import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeArtifact, serializeArtifacts } from '../lib/export/artifact-export.mjs';

const run = {
  id: 'run-1', promptId: 'p1', promptTitle: 'Network Check', status: 'success',
  promptSnapshot: 'Analyze {{incident}}', renderedPrompt: 'Analyze VLAN outage',
  variablesSnapshot: { incident: 'VLAN outage' }, output: 'Root cause evidence',
  provider: 'openai', model: 'gpt-test', startedAt: 1000, completedAt: 1500,
};

const result = {
  resultId: 'res-1', sourceRunId: 'run-1', name: 'Kept result',
  promptSnapshot: 'Analyze {{incident}}', variablesSnapshot: { incident: 'VLAN outage' },
  outputSnapshot: 'Root cause evidence', createdAt: 2000,
  metadataSnapshot: { promptId: 'p1', renderedPrompt: 'Analyze VLAN outage', provider: 'openai', model: 'gpt-test' },
};

test('markdown export contains readable snapshot, variables, output and only real metadata', () => {
  const text = serializeArtifact({ kind: 'run', record: run, format: 'markdown' });
  assert.match(text, /Network Check/);
  assert.match(text, /VLAN outage/);
  assert.match(text, /Root cause evidence/);
  assert.match(text, /openai/);
  assert.doesNotMatch(text, /Input Tokens|Output Tokens|Latency/);
});

test('txt export remains plain readable text and json preserves stable schema identifiers', () => {
  const txt = serializeArtifact({ kind: 'result', record: result, format: 'txt' });
  assert.match(txt, /Kept result/);
  assert.match(txt, /Root cause evidence/);
  const json = JSON.parse(serializeArtifact({ kind: 'result', record: result, format: 'json' }));
  assert.equal(json.schema, 'prompt-os-artifact');
  assert.equal(json.schemaVersion, 1);
  assert.equal(json.kind, 'result');
  assert.equal(json.record.resultId, 'res-1');
  assert.equal(json.record.sourceRunId, 'run-1');
});

test('bulk JSON export preserves each artifact without inventing telemetry', () => {
  const data = JSON.parse(serializeArtifacts([
    { kind: 'run', record: run },
    { kind: 'result', record: result },
  ], 'json'));
  assert.equal(data.schema, 'prompt-os-artifact-bundle');
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.items.length, 2);
  assert.equal(data.items[0].record.inputTokens, undefined);
  assert.equal(data.items[1].record.metadataSnapshot.inputTokens, undefined);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compareArtifacts } from '../lib/studio/diff.mjs';

function artifact(kind, record) { return { kind, record }; }

const runA = artifact('run', {
  id: 'run-a', promptSnapshot: 'Analyze {{input}}', variablesSnapshot: { input: 'A' },
  output: 'Alpha', provider: 'openai', model: 'gpt-test', status: 'success',
});
const runB = artifact('run', {
  id: 'run-b', promptSnapshot: 'Analyze {{input}} carefully', variablesSnapshot: { input: 'B' },
  output: 'Beta', provider: 'openai', model: 'gpt-test', status: 'success',
});
const resultA = artifact('result', {
  resultId: 'result-a', promptSnapshot: 'Analyze {{input}}', variablesSnapshot: { input: 'A' }, outputSnapshot: 'Alpha',
});
const versionA = artifact('version', {
  versionId: 'v1', promptSnapshot: 'Role: Analyst', variableConfigSnapshot: { input: { required: true } }, metadataSnapshot: { label: 'Stable' },
});
const versionB = artifact('version', {
  versionId: 'v2', promptSnapshot: 'Role: Senior Analyst', variableConfigSnapshot: { input: { required: true } }, metadataSnapshot: { label: 'Experimental' },
});
const draftA = artifact('draft', {
  draftId: 'd1', rawPrompt: 'Role: Analyst', variableConfig: { input: { required: true } }, title: 'Working draft',
});

test('compareArtifacts supports all approved artifact pairings deterministically', () => {
  for (const [left, right] of [
    [runA, runB], [resultA, resultA], [runA, resultA], [versionA, versionB], [draftA, versionA],
  ]) {
    const first = compareArtifacts(left, right);
    const second = compareArtifacts(left, right);
    assert.deepEqual(first, second);
    assert.equal(first.left.kind, left.kind);
    assert.equal(first.right.kind, right.kind);
    assert.ok(Array.isArray(first.sections));
  }
});

test('identical normalized artifacts report no differences', () => {
  const diff = compareArtifacts(resultA, structuredClone(resultA));
  assert.equal(diff.hasChanges, false);
  assert.equal(diff.sections.every((section) => section.changed === false), true);
});

test('diff includes prompt, variables, metadata and output when present without AI/network state', () => {
  const diff = compareArtifacts(runA, runB);
  assert.deepEqual(diff.sections.map((section) => section.key), ['prompt', 'variables', 'metadata', 'output']);
  assert.equal(diff.sections.find((section) => section.key === 'prompt').changed, true);
  assert.equal(diff.sections.find((section) => section.key === 'output').changed, true);
  assert.equal('score' in diff, false);
  assert.equal('aiEvaluation' in diff, false);
});

test('Compare Workspace exposes desktop side-by-side and mobile A/B/Diff modes behind Studio capability', () => {
  const compareSource = fs.readFileSync(new URL('../components/studio/CompareWorkspace.jsx', import.meta.url), 'utf8');
  const historySource = fs.readFileSync(new URL('../components/history/RunHistory.jsx', import.meta.url), 'utf8');
  const resultsSource = fs.readFileSync(new URL('../components/results/SavedResults.jsx', import.meta.url), 'utf8');
  const studioSource = fs.readFileSync(new URL('../components/studio/PromptStudio.jsx', import.meta.url), 'utf8');
  const pageSource = fs.readFileSync(new URL('../app/page.jsx', import.meta.url), 'utf8');

  assert.match(compareSource, /Side by side/i);
  assert.match(compareSource, />A</);
  assert.match(compareSource, />B</);
  assert.match(compareSource, />Diff</);
  assert.match(compareSource, /md:grid-cols-2|lg:grid-cols-2/);
  assert.match(historySource, /prompt-os:compare/);
  assert.match(resultsSource, /prompt-os:compare/);
  assert.match(studioSource, /prompt-os:compare/);
  assert.match(pageSource, /V5_PROMPT_STUDIO/);
  assert.match(pageSource, /CompareWorkspace/);
  assert.match(pageSource, /prompt-os:compare/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('Run Workspace is full-screen with mobile-safe Variables Prompt Result order', () => {
  const source = read('components/prompt/RunWorkspace.jsx');
  assert.match(source, /data-run-workspace/);
  assert.match(source, /fixed\s+inset-0/);
  assert.match(source, /data-region=["']variables["']/);
  assert.match(source, /data-region=["']prompt["']/);
  assert.match(source, /data-region=["']result["']/);
  assert.ok(source.indexOf('data-region="variables"') < source.indexOf('data-region="prompt"'));
  assert.ok(source.indexOf('data-region="prompt"') < source.indexOf('data-region="result"'));
  assert.match(source, /lg:grid-cols/);
});

test('Run Workspace exposes the approved execution actions and result modes', () => {
  const source = read('components/prompt/RunWorkspace.jsx');
  for (const label of ['Run', 'Stop', 'Retry', 'Regenerate', 'Copy', 'Save Result', 'Markdown', 'Raw']) {
    assert.ok(source.includes(label), `missing ${label}`);
  }
  assert.match(source, /useImmersiveRun/);
  assert.doesNotMatch(source, /fetch\s*\(\s*['"]\/api\/ai\/run/);
});

test('Ctrl or Meta plus Enter triggers run without replacing editable-field ownership', () => {
  const source = read('components/prompt/RunWorkspace.jsx');
  assert.match(source, /event\.ctrlKey\s*\|\|\s*event\.metaKey/);
  assert.match(source, /String\(event\.key/);
  assert.match(source, /enter/i);
  assert.match(source, /preventDefault\(\)/);
});

test('status is polite but streaming result is not a token-by-token live region', () => {
  const status = read('components/prompt/RunStatus.jsx');
  const result = read('components/prompt/RunResult.jsx');
  assert.match(status, /aria-live=["']polite["']/);
  assert.doesNotMatch(result, /aria-live/);
});

test('mobile actions are sticky safe-area aware and reduced-motion safe', () => {
  const workspace = read('components/prompt/RunWorkspace.jsx');
  const css = read('app/globals.css');
  assert.match(workspace, /sticky/);
  assert.match(workspace, /useReducedMotion/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /prefers-reduced-motion/);
});

test('RunStatus renders textual persistence and sync state rather than fabricated metrics', () => {
  const source = read('components/prompt/RunStatus.jsx');
  assert.match(source, /persistence/);
  assert.match(source, /syncState/);
  assert.match(source, /Saved locally/);
  assert.match(source, /Waiting to sync/);
  assert.doesNotMatch(source, /fake|mock|estimated cost/i);
});

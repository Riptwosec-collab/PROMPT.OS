import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hookPath = new URL('../components/prompt/usePromptRun.js', import.meta.url);
const pulsePath = new URL('../components/prompt/ExecutionPulse.jsx', import.meta.url);
const telemetryPath = new URL('../components/prompt/RunTelemetry.jsx', import.meta.url);

test('immersive run hook reuses streamAiRun and one AbortController transport path', () => {
  const source = fs.readFileSync(hookPath, 'utf8');
  assert.match(source, /streamAiRun/);
  assert.match(source, /AbortController/);
  assert.match(source, /useReducer/);
  assert.match(source, /reduceRunState/);
  assert.equal(/fetch\s*\(\s*['"`]\/api\/ai\/run/.test(source), false);
});

test('immersive run hook stops aborts without converting AbortError into failure', () => {
  const source = fs.readFileSync(hookPath, 'utf8');
  assert.match(source, /\.abort\(\)/);
  assert.match(source, /AbortError/);
  assert.match(source, /type:\s*['"]stop['"]/);
  assert.match(source, /type:\s*['"]fail['"]/);
});

test('execution pulse exposes every approved semantic state and reduced-motion handling', () => {
  const source = fs.readFileSync(pulsePath, 'utf8');
  for (const label of ['Preparing', 'Running', 'Streaming', 'Completed', 'Failed', 'Stopped']) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /reducedMotion/);
  assert.match(source, /v5-execution-pulse/);
});

test('run telemetry renders only supplied real meta and never invents cost', () => {
  const source = fs.readFileSync(telemetryPath, 'utf8');
  for (const key of ['provider', 'model', 'latencyMs', 'inputTokens', 'outputTokens', 'responseId']) {
    assert.match(source, new RegExp(key));
  }
  assert.match(source, /Number\.isFinite/);
  assert.match(source, /inputTokens[^\n]*outputTokens|outputTokens[^\n]*inputTokens/s);
  assert.equal(/Estimated Cost|\$\{|cost\s*[:=]/i.test(source), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hookPath = new URL('../components/prompt/usePromptRun.js', import.meta.url);
const pulsePath = new URL('../components/prompt/ExecutionPulse.jsx', import.meta.url);
const telemetryPath = new URL('../components/prompt/RunTelemetry.jsx', import.meta.url);
const panelPath = new URL('../components/prompt/ImmersiveRunPanel.jsx', import.meta.url);

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
  assert.equal(/\bcost\b|Estimated Cost/i.test(source), false);
});

test('immersive run panel exposes safe follow and semantic action states', () => {
  const source = fs.readFileSync(panelPath, 'utf8');
  assert.match(source, /shouldFollowLatest/);
  assert.match(source, /scrollTo\s*\(/);
  assert.match(source, /Jump to latest/);
  assert.match(source, /aria-live=["']polite["']/);
  for (const action of ['Stop', 'Retry', 'Run Again', 'Edit Prompt', 'Copy', 'Copied']) {
    assert.match(source, new RegExp(action));
  }
});

test('immersive output stays selectable and failed or stopped states do not clear streamed output', () => {
  const source = fs.readFileSync(panelPath, 'utf8');
  assert.match(source, /state\.output/);
  assert.match(source, /whitespace-pre-wrap/);
  assert.equal(/split\(['"]{0,1}['"]{0,1}\)|Array\.from\(state\.output/.test(source), false);
  assert.equal(/setOutput\s*\(\s*['"]['"]\s*\)/.test(source), false);
});

test('optional post-run actions are capability-aware instead of fake enabled controls', () => {
  const source = fs.readFileSync(panelPath, 'utf8');
  for (const callback of ['onSaveResult', 'onImprove', 'onCompare', 'onAddToWorkflow']) {
    assert.match(source, new RegExp(`${callback}\\?`));
  }
});

test('immersive run is gated by execution authority and its own feature flag through the detail path', () => {
  const page = fs.readFileSync(new URL('../app/page.jsx', import.meta.url), 'utf8');
  const library = fs.readFileSync(new URL('../components/prompt/PromptLibraryV5.jsx', import.meta.url), 'utf8');
  const detail = fs.readFileSync(new URL('../components/prompt/PromptDetailV2.jsx', import.meta.url), 'utf8');

  assert.match(page, /V5_EXECUTION_ENGINE/);
  assert.match(page, /V5_IMMERSIVE_RUN/);
  assert.match(page, /executionEnabled/);
  assert.match(page, /immersiveRunEnabled/);
  assert.match(library, /executionEnabled/);
  assert.match(library, /immersiveRunEnabled/);
  assert.match(detail, /executionEnabled\s*&&\s*immersiveRunEnabled/);
  assert.match(detail, /usePromptRun/);
  assert.match(detail, /ImmersiveRunPanel/);
  assert.match(detail, /rendered\.text/);
  assert.match(detail, /provider:\s*['"]openai['"]/);
});

test('legacy delegated run behavior remains present when immersive mode is disabled', () => {
  const detail = fs.readFileSync(new URL('../components/prompt/PromptDetailV2.jsx', import.meta.url), 'utf8');
  assert.match(detail, /onRun/);
  assert.match(detail, /Execution is not enabled/);
  assert.match(detail, /setRunError/);
});

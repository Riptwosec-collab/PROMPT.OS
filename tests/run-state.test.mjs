import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RUN_STATUS,
  createRunState,
  normalizeRunMeta,
  reduceRunState,
} from '../lib/ai/run-state.mjs';

test('run state covers the complete immersive lifecycle', () => {
  let state = createRunState();
  assert.equal(state.status, RUN_STATUS.IDLE);
  assert.equal(state.output, '');
  assert.deepEqual(state.meta, {});

  state = reduceRunState(state, { type: 'prepare', startedAt: 123 });
  assert.equal(state.status, RUN_STATUS.PREPARING);
  assert.equal(state.startedAt, 123);

  state = reduceRunState(state, { type: 'start' });
  assert.equal(state.status, RUN_STATUS.RUNNING);

  state = reduceRunState(state, { type: 'delta', delta: 'hello' });
  assert.equal(state.status, RUN_STATUS.STREAMING);
  assert.equal(state.output, 'hello');

  state = reduceRunState(state, { type: 'delta', delta: ' world' });
  assert.equal(state.output, 'hello world');

  state = reduceRunState(state, { type: 'meta', meta: { provider: 'openai', model: 'gpt-5.6', latencyMs: 20 } });
  assert.equal(state.meta.provider, 'openai');
  assert.equal(state.meta.latencyMs, 20);

  state = reduceRunState(state, { type: 'complete' });
  assert.equal(state.status, RUN_STATUS.COMPLETED);
});

test('stop and failure preserve streamed output and real telemetry', () => {
  let state = createRunState();
  state = reduceRunState(state, { type: 'prepare', startedAt: 1 });
  state = reduceRunState(state, { type: 'start' });
  state = reduceRunState(state, { type: 'delta', delta: 'hello' });
  state = reduceRunState(state, { type: 'meta', meta: { provider: 'OpenAI', inputTokens: 4 } });

  const stopped = reduceRunState(state, { type: 'stop' });
  assert.equal(stopped.status, RUN_STATUS.STOPPED);
  assert.equal(stopped.output, 'hello');
  assert.equal(stopped.meta.inputTokens, 4);
  assert.equal('cost' in stopped.meta, false);

  const failed = reduceRunState(state, { type: 'fail', error: 'network failed' });
  assert.equal(failed.status, RUN_STATUS.FAILED);
  assert.equal(failed.output, 'hello');
  assert.equal(failed.meta.inputTokens, 4);
  assert.equal(failed.error, 'network failed');
});

test('reset returns a fresh idle state and retry can start from stopped state', () => {
  let state = createRunState();
  state = reduceRunState(state, { type: 'prepare', startedAt: 9 });
  state = reduceRunState(state, { type: 'start' });
  state = reduceRunState(state, { type: 'delta', delta: 'partial' });
  state = reduceRunState(state, { type: 'stop' });
  state = reduceRunState(state, { type: 'prepare', startedAt: 10 });
  assert.equal(state.status, RUN_STATUS.PREPARING);
  assert.equal(state.output, '');
  assert.equal(state.startedAt, 10);

  const reset = reduceRunState(state, { type: 'reset' });
  assert.deepEqual(reset, createRunState());
});

test('normalizeRunMeta keeps only supplied known telemetry and never invents cost', () => {
  const meta = normalizeRunMeta({
    provider: 'openai',
    model: 'gpt-5.6',
    latencyMs: 35,
    inputTokens: 11,
    outputTokens: 22,
    responseId: 'resp_123',
    cost: 999,
    unknown: 'drop-me',
  });

  assert.deepEqual(meta, {
    provider: 'openai',
    model: 'gpt-5.6',
    latencyMs: 35,
    inputTokens: 11,
    outputTokens: 22,
    responseId: 'resp_123',
  });
  assert.equal('cost' in meta, false);
});

test('empty deltas are ignored and invalid numeric telemetry is omitted', () => {
  let state = createRunState();
  state = reduceRunState(state, { type: 'prepare', startedAt: 1 });
  state = reduceRunState(state, { type: 'start' });
  state = reduceRunState(state, { type: 'delta', delta: '' });
  assert.equal(state.status, RUN_STATUS.RUNNING);
  assert.equal(state.output, '');

  const meta = normalizeRunMeta({ latencyMs: Number.NaN, inputTokens: Infinity, outputTokens: 0 });
  assert.deepEqual(meta, { outputTokens: 0 });
});

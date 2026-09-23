import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUN_STATUS,
  SYNC_STATE,
  createRunRecord,
  applyRunEvent,
  isTerminalRun,
  normalizeRunMeta,
  buildRetryInput,
  buildRegenerateInput,
} from '../lib/run/model.mjs';

test('new run starts preparing with immutable input snapshots and local sync state', () => {
  const variables = { topic: 'VLAN' };
  const run = createRunRecord({
    id: 'r1',
    promptId: 'p1',
    promptSnapshot: 'Explain {{topic}}',
    variablesSnapshot: variables,
    renderedPrompt: 'Explain VLAN',
    ownerSessionId: 'tab-a',
    now: 1000,
  });

  variables.topic = 'OSPF';
  assert.equal(run.status, RUN_STATUS.PREPARING);
  assert.equal(run.syncState, SYNC_STATE.LOCAL);
  assert.equal(run.variablesSnapshot.topic, 'VLAN');
  assert.equal(run.output, '');
  assert.equal(run.startedAt, 1000);
});

test('terminal runs cannot be rewritten by late execution events', () => {
  let run = createRunRecord({
    id: 'r1', promptId: 'p1', promptSnapshot: 'hello', variablesSnapshot: {},
    renderedPrompt: 'hello', ownerSessionId: 'tab-a', now: 1000,
  });
  run = applyRunEvent(run, { type: 'start', at: 1001 });
  run = applyRunEvent(run, { type: 'delta', output: 'partial', at: 1002 });
  run = applyRunEvent(run, { type: 'success', output: 'done', meta: { inputTokens: 2 }, at: 1003 });
  const lateAbort = applyRunEvent(run, { type: 'stop', output: 'changed', at: 1004 });
  assert.equal(lateAbort.status, RUN_STATUS.SUCCESS);
  assert.equal(lateAbort.output, 'done');
  assert.equal(lateAbort.inputTokens, 2);
  assert.equal(isTerminalRun(lateAbort), true);
});

test('failed and stopped runs preserve partial output', () => {
  const base = applyRunEvent(createRunRecord({
    id: 'r2', promptId: 'p1', promptSnapshot: 'x', variablesSnapshot: {},
    renderedPrompt: 'x', ownerSessionId: 'tab-a', now: 1,
  }), { type: 'start', at: 2 });
  const withPartial = applyRunEvent(base, { type: 'delta', output: 'partial', at: 3 });

  const failed = applyRunEvent(withPartial, { type: 'failed', error: 'network', at: 4 });
  const stopped = applyRunEvent(withPartial, { type: 'stopped', at: 4 });
  assert.equal(failed.output, 'partial');
  assert.equal(failed.error, 'network');
  assert.equal(stopped.output, 'partial');
});

test('telemetry normalization accepts only real supported fields and never cost', () => {
  const meta = normalizeRunMeta({
    provider: 'OpenAI', model: 'gpt-test', latencyMs: 125,
    inputTokens: 4, outputTokens: 7, responseId: 'resp_1',
    cost: 999, latency: 'fake', inputTokensBad: 5,
  });
  assert.deepEqual(meta, {
    provider: 'OpenAI', model: 'gpt-test', latencyMs: 125,
    inputTokens: 4, outputTokens: 7, responseId: 'resp_1',
  });
  assert.equal('cost' in meta, false);
  assert.deepEqual(normalizeRunMeta({ latencyMs: NaN, inputTokens: Infinity }), {});
});

test('retry reuses exact source snapshots while regenerate uses current workspace inputs', () => {
  const source = {
    id: 'r1', promptId: 'p1', promptSnapshot: 'old', variablesSnapshot: { x: '1' },
    renderedPrompt: 'old 1', sourceType: 'prompt', sourceVersionId: null,
  };
  assert.deepEqual(buildRetryInput(source), {
    parentRunId: 'r1', trigger: 'retry', promptId: 'p1', promptSnapshot: 'old',
    variablesSnapshot: { x: '1' }, renderedPrompt: 'old 1',
    sourceType: 'prompt', sourceVersionId: null,
  });
  const regenerate = buildRegenerateInput({
    sourceRun: source,
    promptSnapshot: 'new', variablesSnapshot: { x: '2' }, renderedPrompt: 'new 2',
  });
  assert.equal(regenerate.parentRunId, 'r1');
  assert.equal(regenerate.trigger, 'regenerate');
  assert.equal(regenerate.renderedPrompt, 'new 2');
  assert.deepEqual(regenerate.variablesSnapshot, { x: '2' });
});

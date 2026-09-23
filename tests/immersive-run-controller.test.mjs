import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunSessionController } from '../lib/run/session-controller.mjs';

function createFakeRepositories({ createError = null, checkpointErrorAt = null } = {}) {
  const runs = new Map();
  const checkpoints = [];
  const finalizations = [];
  const mutations = [];
  let checkpointCalls = 0;

  const runRepository = {
    async create(run) {
      if (createError) throw createError;
      runs.set(run.id, structuredClone(run));
    },
    async get(id) {
      const value = runs.get(id);
      return value ? structuredClone(value) : null;
    },
    async checkpoint(id, patch) {
      checkpointCalls += 1;
      if (checkpointErrorAt === checkpointCalls) throw new Error('quota exceeded');
      const current = runs.get(id);
      const next = { ...current, ...structuredClone(patch) };
      runs.set(id, next);
      checkpoints.push({ id, ...structuredClone(patch) });
      return structuredClone(next);
    },
    async heartbeat(id, patch) {
      const current = runs.get(id);
      const next = { ...current, ...structuredClone(patch) };
      runs.set(id, next);
      return structuredClone(next);
    },
    async finalize(id, patch) {
      const current = runs.get(id);
      if (['success', 'failed', 'stopped', 'interrupted'].includes(current?.status)) return structuredClone(current);
      const next = { ...current, ...structuredClone(patch), ownerSessionId: null, heartbeatAt: null };
      runs.set(id, next);
      finalizations.push({ id, ...structuredClone(patch) });
      return structuredClone(next);
    },
  };

  const resultRepository = {
    async saveFromRun(run, metadata) {
      return { resultId: 'result-1', sourceRunId: run.id, ...metadata };
    },
  };
  const syncRepository = {
    async enqueue(mutation) { mutations.push(structuredClone(mutation)); return mutation; },
  };

  return { runRepository, resultRepository, syncRepository, runs, checkpoints, finalizations, mutations };
}

function input(overrides = {}) {
  return {
    promptId: 'p1',
    promptSnapshot: 'Explain {{topic}}',
    variablesSnapshot: { topic: 'VLAN' },
    renderedPrompt: 'Explain VLAN',
    provider: 'openai',
    model: 'gpt-test',
    ...overrides,
  };
}

test('local create failure prevents the network runner from starting', async () => {
  const repos = createFakeRepositories({ createError: new Error('storage unavailable') });
  let runnerCalls = 0;
  const controller = createRunSessionController({
    ...repos,
    runner: async () => { runnerCalls += 1; },
    idFactory: () => 'r1', sessionId: 'tab-a', now: () => 1000,
  });

  await assert.rejects(() => controller.start(input()), /storage unavailable/);
  assert.equal(runnerCalls, 0);
  assert.equal(controller.getSnapshot().persistence.state, 'error');
});

test('many small deltas update memory without writing every delta and success persists final output', async () => {
  const repos = createFakeRepositories();
  let clock = 1000;
  const controller = createRunSessionController({
    ...repos,
    runner: async ({ onDelta, onMeta }) => {
      for (let i = 0; i < 100; i += 1) {
        clock += 1;
        onDelta('x');
      }
      onMeta({ provider: 'OpenAI', model: 'gpt-test', inputTokens: 3, outputTokens: 5, cost: 999 });
    },
    idFactory: () => 'r1', sessionId: 'tab-a', now: () => clock,
  });

  const run = await controller.start(input());
  assert.equal(run.status, 'success');
  assert.equal(run.output, 'x'.repeat(100));
  assert.equal(repos.checkpoints.length, 1, 'start transition may persist once; deltas must stay bounded');
  assert.equal(repos.finalizations.length, 1);
  assert.equal(repos.finalizations[0].output, 'x'.repeat(100));
  assert.equal(repos.finalizations[0].meta.inputTokens, 3);
  assert.equal('cost' in repos.finalizations[0].meta, false);
});

test('stop aborts the active request and finalizes stopped with partial output', async () => {
  const repos = createFakeRepositories();
  let release;
  const runner = ({ signal, onDelta }) => new Promise((resolve, reject) => {
    onDelta('partial');
    release = () => resolve();
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  const controller = createRunSessionController({
    ...repos, runner, idFactory: () => 'r1', sessionId: 'tab-a', now: () => 1000,
  });

  const promise = controller.start(input());
  await new Promise((resolve) => setImmediate(resolve));
  await controller.stop();
  const run = await promise;
  release?.();
  assert.equal(run.status, 'stopped');
  assert.equal(run.output, 'partial');
  assert.equal(repos.finalizations.at(-1).status, 'stopped');
});

test('provider failure finalizes failed with partial output and real error', async () => {
  const repos = createFakeRepositories();
  const controller = createRunSessionController({
    ...repos,
    runner: async ({ onDelta }) => {
      onDelta('partial');
      throw new Error('provider unavailable');
    },
    idFactory: () => 'r1', sessionId: 'tab-a', now: () => 1000,
  });
  const run = await controller.start(input());
  assert.equal(run.status, 'failed');
  assert.equal(run.output, 'partial');
  assert.equal(run.error, 'provider unavailable');
});

test('successful terminal state is not rewritten by a late abort callback', async () => {
  const repos = createFakeRepositories();
  let capturedSignal;
  const controller = createRunSessionController({
    ...repos,
    runner: async ({ signal, onDelta }) => {
      capturedSignal = signal;
      onDelta('done');
    },
    idFactory: () => 'r1', sessionId: 'tab-a', now: () => 1000,
  });
  const success = await controller.start(input());
  assert.equal(success.status, 'success');
  capturedSignal.dispatchEvent(new Event('abort'));
  await controller.stop();
  assert.equal(controller.getSnapshot().session.status, 'success');
  assert.equal(repos.finalizations.length, 1);
});

test('retry uses exact source snapshots while regenerate uses current inputs and both get new ids', async () => {
  const repos = createFakeRepositories();
  const ids = ['r2', 'r3'];
  const prompts = [];
  const controller = createRunSessionController({
    ...repos,
    runner: async ({ prompt }) => { prompts.push(prompt); },
    idFactory: () => ids.shift(), sessionId: 'tab-a', now: () => 1000,
  });
  const source = {
    id: 'r1', promptId: 'p1', promptSnapshot: 'old {{x}}', variablesSnapshot: { x: '1' },
    renderedPrompt: 'old 1', output: 'prior', status: 'success', sourceType: 'prompt', sourceVersionId: null,
  };

  const retried = await controller.retry(source);
  const regenerated = await controller.regenerate({
    sourceRun: retried,
    promptSnapshot: 'new {{x}}', variablesSnapshot: { x: '2' }, renderedPrompt: 'new 2',
  });
  assert.equal(retried.id, 'r2');
  assert.equal(retried.parentRunId, 'r1');
  assert.equal(regenerated.id, 'r3');
  assert.equal(regenerated.parentRunId, 'r2');
  assert.deepEqual(prompts, ['old 1', 'new 2']);
});

test('checkpoint failure keeps streaming in memory and exposes a persistence warning', async () => {
  const repos = createFakeRepositories({ checkpointErrorAt: 1 });
  let clock = 1000;
  const controller = createRunSessionController({
    ...repos,
    runner: async ({ onDelta }) => {
      clock = 2000;
      onDelta('partial');
    },
    idFactory: () => 'r1', sessionId: 'tab-a', now: () => clock,
  });
  const run = await controller.start(input());
  assert.equal(run.output, 'partial');
  assert.equal(run.status, 'success');
  assert.equal(controller.getSnapshot().persistence.state, 'saved');
  assert.equal(repos.finalizations.at(-1).output, 'partial');
});

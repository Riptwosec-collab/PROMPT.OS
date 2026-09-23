import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { openRuntimeDb } from '../lib/run/indexeddb.mjs';
import { createResultRepository } from '../lib/run/result-repository.mjs';

test('saveFromRun stores an independent immutable snapshot', async () => {
  const db = await openRuntimeDb();
  const resultRepo = createResultRepository({ db, idFactory: () => 'res-1', now: () => 2000 });
  const sourceRun = {
    id: 'run-1', promptId: 'p1', promptSnapshot: 'Explain {{topic}}',
    variablesSnapshot: { topic: 'network' }, renderedPrompt: 'Explain network',
    output: 'original output', status: 'success', provider: 'OpenAI', model: 'gpt-test',
    inputTokens: 5, outputTokens: 8, completedAt: 1500,
  };

  const saved = await resultRepo.saveFromRun(sourceRun, { name: 'Keep me' });
  sourceRun.output = 'mutated later';
  sourceRun.variablesSnapshot.topic = 'changed';

  const stored = await resultRepo.get(saved.resultId);
  assert.equal(stored.resultId, 'res-1');
  assert.equal(stored.sourceRunId, 'run-1');
  assert.equal(stored.outputSnapshot, 'original output');
  assert.deepEqual(stored.variablesSnapshot, { topic: 'network' });
  assert.equal(stored.metadataSnapshot.provider, 'OpenAI');
  assert.equal(stored.metadataSnapshot.inputTokens, 5);
  db.close();
});

test('saved result list is newest first and returned records are detached copies', async () => {
  const db = await openRuntimeDb();
  let id = 0;
  let now = 1000;
  const repo = createResultRepository({ db, idFactory: () => `res-${++id}`, now: () => now });
  const run = { id: 'r1', promptSnapshot: 'p', variablesSnapshot: {}, output: 'o', status: 'success' };
  await repo.saveFromRun(run, { name: 'old' });
  now = 2000;
  await repo.saveFromRun(run, { name: 'new' });
  const list = await repo.list();
  assert.deepEqual(list.map((item) => item.name), ['new', 'old']);
  list[0].name = 'mutated';
  assert.equal((await repo.list())[0].name, 'new');
  db.close();
});

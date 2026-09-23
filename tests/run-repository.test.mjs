import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunRecord } from '../lib/run/model.mjs';
import { createRunRepository } from '../lib/run/run-repository.mjs';
import { freshRuntimeDb } from './runtime-db-test-helper.mjs';

function makeRun(id, { promptId = 'p1', now = 1000 } = {}) {
  return createRunRecord({
    id, promptId, promptSnapshot: `prompt-${id}`, variablesSnapshot: { topic: id },
    renderedPrompt: `rendered-${id}`, ownerSessionId: 'tab-a', now,
  });
}

test('finalize makes execution content immutable', async () => {
  const db = await freshRuntimeDb();
  const repo = createRunRepository({ db });
  await repo.create(makeRun('r1'));
  await repo.finalize('r1', { status: 'success', output: 'final', completedAt: 2000 });
  await assert.rejects(
    () => repo.checkpoint('r1', { output: 'rewritten', updatedAt: 3000 }),
    /terminal run/i,
  );
  assert.equal((await repo.get('r1')).output, 'final');
  db.close();
});

test('list is newest first and supports prompt/status filtering', async () => {
  const db = await freshRuntimeDb();
  const repo = createRunRepository({ db });
  await repo.create(makeRun('r1', { promptId: 'p1', now: 1000 }));
  await repo.create(makeRun('r2', { promptId: 'p2', now: 3000 }));
  await repo.create(makeRun('r3', { promptId: 'p1', now: 2000 }));
  await repo.finalize('r3', { status: 'failed', output: 'partial', completedAt: 2500, error: 'boom' });

  assert.deepEqual((await repo.list()).map((run) => run.id), ['r2', 'r3', 'r1']);
  assert.deepEqual((await repo.list({ promptId: 'p1' })).map((run) => run.id), ['r3', 'r1']);
  assert.deepEqual((await repo.list({ status: 'failed' })).map((run) => run.id), ['r3']);
  db.close();
});

test('heartbeat updates active runs but rejects terminal runs', async () => {
  const db = await freshRuntimeDb();
  const repo = createRunRepository({ db, now: () => 5000 });
  await repo.create(makeRun('r1'));
  await repo.heartbeat('r1', { ownerSessionId: 'tab-b', heartbeatAt: 4500 });
  assert.equal((await repo.get('r1')).ownerSessionId, 'tab-b');
  assert.equal((await repo.get('r1')).heartbeatAt, 4500);
  await repo.finalize('r1', { status: 'stopped', output: 'x', completedAt: 5000 });
  await assert.rejects(() => repo.heartbeat('r1', { heartbeatAt: 6000 }), /terminal run/i);
  db.close();
});

test('recoverableActive returns only preparing and running records', async () => {
  const db = await freshRuntimeDb();
  const repo = createRunRepository({ db });
  await repo.create(makeRun('preparing'));
  await repo.create(makeRun('running'));
  await repo.checkpoint('running', { status: 'running', output: 'partial', updatedAt: 1200 });
  await repo.create(makeRun('done'));
  await repo.finalize('done', { status: 'success', output: 'ok', completedAt: 1300 });
  assert.deepEqual((await repo.recoverableActive()).map((run) => run.id).sort(), ['preparing', 'running']);
  db.close();
});

test('storage transaction failures propagate to caller', async () => {
  const db = await freshRuntimeDb();
  const repo = createRunRepository({ db });
  db.close();
  await assert.rejects(() => repo.create(makeRun('r1')));
});

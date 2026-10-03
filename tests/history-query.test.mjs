import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHistoryQuery, matchesHistoryQuery } from '../lib/run/history-query.mjs';
import { normalizeResultQuery, matchesResultQuery } from '../lib/run/result-query.mjs';
import { createRunRepository } from '../lib/run/run-repository.mjs';
import { createResultRepository } from '../lib/run/result-repository.mjs';
import { createRunRecord } from '../lib/run/model.mjs';
import { freshRuntimeDb } from './runtime-db-test-helper.mjs';

function run(id, createdAt, patch = {}) {
  return createRunRecord({
    id,
    promptId: patch.promptId || 'p1',
    promptSnapshot: patch.promptSnapshot || `Prompt ${id}`,
    variablesSnapshot: {},
    renderedPrompt: patch.renderedPrompt || `Rendered ${id}`,
    provider: patch.provider || 'openai',
    model: patch.model || 'gpt-test',
    ownerSessionId: 'tab',
    now: createdAt,
  });
}

test('history query normalization clamps limits and normalizes searchable filters', () => {
  assert.deepEqual(normalizeHistoryQuery({ search: '  VLAN  ', statuses: ['failed', 'success'], limit: 999 }), {
    search: 'vlan', statuses: ['failed', 'success'], promptId: null, provider: null, model: null,
    from: null, to: null, saved: null, limit: 100, cursor: null,
  });
  assert.equal(matchesHistoryQuery({ renderedPrompt: 'Check VLAN 50', status: 'failed', createdAt: 20 }, normalizeHistoryQuery({ search: 'vlan', statuses: ['failed'] })), true);
  assert.equal(matchesHistoryQuery({ renderedPrompt: 'Check DNS', status: 'success', createdAt: 20 }, normalizeHistoryQuery({ search: 'vlan' })), false);
});

test('result query searches names, notes, tags and immutable snapshot text', () => {
  const query = normalizeResultQuery({ search: 'network' });
  assert.equal(matchesResultQuery({ name: 'Network case', notes: '', tags: [], outputSnapshot: '' }, query), true);
  assert.equal(matchesResultQuery({ name: 'Other', notes: 'network follow-up', tags: [], outputSnapshot: '' }, query), true);
  assert.equal(matchesResultQuery({ name: 'Other', notes: '', tags: ['network'], outputSnapshot: '' }, query), true);
  assert.equal(matchesResultQuery({ name: 'Other', notes: '', tags: [], outputSnapshot: 'network result' }, query), true);
});

test('RunRepository listPage is newest-first, cursor-paged, searchable and deletion does not cascade', async () => {
  const db = await freshRuntimeDb();
  const runRepo = createRunRepository({ db });
  const resultRepo = createResultRepository({ db, idFactory: () => 'saved-r2', now: () => 9000 });
  for (let i = 1; i <= 25; i += 1) await runRepo.create(run(`r${i}`, i * 100, { renderedPrompt: i === 12 ? 'Investigate VLAN outage' : `Routine ${i}` }));
  const source = await runRepo.get('r2');
  await resultRepo.saveFromRun({ ...source, status: 'success', output: 'kept snapshot' }, { name: 'Saved source' });

  const first = await runRepo.listPage({ limit: 10 });
  assert.equal(first.items.length, 10);
  assert.deepEqual(first.items.slice(0, 2).map((item) => item.id), ['r25', 'r24']);
  assert.ok(first.nextCursor);
  const second = await runRepo.listPage({ limit: 10, cursor: first.nextCursor });
  assert.equal(second.items[0].id, 'r15');
  assert.equal(new Set([...first.items, ...second.items].map((item) => item.id)).size, 20);

  const searched = await runRepo.listPage({ search: 'vlan', limit: 10 });
  assert.deepEqual(searched.items.map((item) => item.id), ['r12']);

  assert.equal(await runRepo.delete('r2'), true);
  assert.equal(await runRepo.get('r2'), null);
  assert.equal((await resultRepo.get('saved-r2')).outputSnapshot, 'kept snapshot');
  db.close();
});

test('ResultRepository metadata is whitelisted, duplicate detaches snapshot, pages and delete leave source run intact', async () => {
  const db = await freshRuntimeDb();
  const runRepo = createRunRepository({ db });
  await runRepo.create(run('source', 1000));
  const source = { ...(await runRepo.get('source')), status: 'success', output: 'original' };
  let seq = 0;
  let now = 2000;
  const resultRepo = createResultRepository({ db, idFactory: () => `res-${++seq}`, now: () => now++ });
  const saved = await resultRepo.saveFromRun(source, { name: 'Original' });
  const updated = await resultRepo.updateMetadata(saved.resultId, { name: 'Renamed', pinned: true, tags: ['network'], notes: 'keep', outputSnapshot: 'attack' });
  assert.equal(updated.name, 'Renamed');
  assert.equal(updated.pinned, true);
  assert.deepEqual(updated.tags, ['network']);
  assert.equal(updated.notes, 'keep');
  assert.equal(updated.outputSnapshot, 'original');

  const copy = await resultRepo.duplicate(saved.resultId, { name: 'Copy' });
  assert.notEqual(copy.resultId, saved.resultId);
  assert.equal(copy.outputSnapshot, 'original');
  copy.variablesSnapshot.changed = true;
  assert.equal((await resultRepo.get(saved.resultId)).variablesSnapshot.changed, undefined);

  const page = await resultRepo.listPage({ search: 'network', limit: 10 });
  assert.ok(page.items.some((item) => item.resultId === saved.resultId));
  assert.equal(await resultRepo.delete(saved.resultId), true);
  assert.ok(await runRepo.get('source'));
  db.close();
});

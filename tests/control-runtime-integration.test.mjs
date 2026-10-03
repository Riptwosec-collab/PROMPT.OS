import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IDBFactory } from 'fake-indexeddb';
import { openRuntimeDb } from '../lib/run/indexeddb.mjs';
import { createRunRepository } from '../lib/run/run-repository.mjs';
import { createResultRepository } from '../lib/run/result-repository.mjs';
import { createDraftRepository } from '../lib/studio/draft-repository.mjs';
import { createVersionRepository } from '../lib/studio/version-repository.mjs';
import { createSyncRepository } from '../lib/run/sync-repository.mjs';
import { loadControlSnapshot, buildControlModel } from '../lib/control/runtime.mjs';
import { buildReleaseNavItems } from '../lib/ui/v5-navigation.mjs';

function read(path) { return fs.readFileSync(path, 'utf8'); }

test('control runtime gathers real persisted repositories without React owning IndexedDB', async () => {
  const db = await openRuntimeDb({ indexedDBImpl: new IDBFactory() });
  const runRepository = createRunRepository({ db, now: () => 100 });
  const resultRepository = createResultRepository({ db, idFactory: () => 'result-1', now: () => 200 });
  const draftRepository = createDraftRepository({ db, now: () => 300 });
  const versionRepository = createVersionRepository({ db, idFactory: () => 'version-1', now: () => 400 });
  const syncRepository = createSyncRepository({ db });

  await runRepository.create({ id: 'run-1', promptId: 'p1', status: 'success', output: 'ok', createdAt: Date.parse('2026-10-03T00:00:00Z'), completedAt: Date.parse('2026-10-03T00:00:01Z'), latencyMs: 120, inputTokens: 5, outputTokens: 8 });
  await resultRepository.saveFromRun(await runRepository.get('run-1'), { name: 'Saved' });
  const draft = await draftRepository.upsert({ draftId: 'draft-1', promptId: 'user-1', title: 'User Prompt', rawPrompt: 'Hello' });
  await versionRepository.create({ draft, versionNumber: 1, label: 'v1' });
  await syncRepository.enqueue({ id: 'sync-1', createdAt: 1 });

  const snapshot = await loadControlSnapshot({ db, runRepository, resultRepository, draftRepository, versionRepository, syncRepository });
  assert.equal(snapshot.runs.length, 1);
  assert.equal(snapshot.results.length, 1);
  assert.equal(snapshot.drafts.length, 1);
  assert.equal(snapshot.versions.length, 1);
  assert.equal(snapshot.syncItems.length, 1);

  const model = buildControlModel({ ...snapshot, customPrompts: [{ id: 'user-1' }] }, { now: new Date('2026-10-03T00:00:00Z') });
  assert.equal(model.metrics.runsToday, 1);
  assert.equal(model.metrics.savedResults, 1);
  assert.equal(model.metrics.customPrompts, 1);
  assert.equal(model.metrics.drafts, 1);
  assert.equal(model.metrics.versions, 1);
  assert.equal(model.metrics.pendingSync, 1);
  assert.equal(model.metrics.syncErrors, 0);
  assert.equal(model.metrics.averageLatencyMs, 120);
  assert.equal(model.metrics.inputTokens, 5);
  assert.equal(model.metrics.outputTokens, 8);
  assert.deepEqual(model.analytics.statusBreakdown, { success: 1 });
  assert.deepEqual(model.analytics.mostUsedPrompts, [{ promptId: 'p1', count: 1 }]);
  assert.equal(model.analytics.savedResultRate.savedRuns, 1);
  assert.equal(model.analytics.failureBreakdown.failed, 0);
  assert.ok(Array.isArray(model.activity));
  db.close();
});

test('control navigation exposes Control Center and Storage & Sync only under release flag', () => {
  const off = buildReleaseNavItems({ controlCenterEnabled: false });
  assert.equal(off.some((item) => item.id === 'control'), false);
  assert.equal(off.some((item) => item.id === 'storage'), false);
  const on = buildReleaseNavItems({ controlCenterEnabled: true });
  assert.equal(on.some((item) => item.id === 'control'), true);
  assert.equal(on.some((item) => item.id === 'storage'), true);
});

test('top-level page delegates Control Center persistence and backup ownership to runtime component', () => {
  const page = read('app/page.jsx');
  const runtime = read('components/control/ControlCenterRuntime.jsx');
  assert.match(page, /V5_CONTROL_CENTER_V2/);
  assert.match(page, /ControlCenterRuntime/);
  assert.match(runtime, /StorageSyncCenter/);
  assert.match(runtime, /openControlRuntime/);
  assert.match(runtime, /createBackup/);
  assert.match(runtime, /validateBackup/);
  assert.match(runtime, /planRestore/);
  assert.match(runtime, /readPromptBackupData/);
  assert.match(runtime, /applyBackupRestore/);
  assert.doesNotMatch(page, /openRuntimeDb|indexedDB/);
  assert.doesNotMatch(runtime, /indexedDB\.open/);
});

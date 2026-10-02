import { openRuntimeDb } from '../run/indexeddb.mjs';
import { createRunRepository } from '../run/run-repository.mjs';
import { createResultRepository } from '../run/result-repository.mjs';
import { createSyncRepository } from '../run/sync-repository.mjs';
import { createDraftRepository } from '../studio/draft-repository.mjs';
import { createVersionRepository } from '../studio/version-repository.mjs';
import { averageLatency, tokenUsage } from './analytics-selectors.mjs';
import { buildActivity, buildFailures } from './activity.mjs';
import { measureStorage, summarizeSync } from './storage.mjs';

function withinDays(value, nowMs, days) {
  const time = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(time) && time >= nowMs - days * 86400000 && time <= nowMs;
}

function isSameUtcDate(value, now) {
  const time = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(time)) return false;
  const date = new Date(time);
  return date.getUTCFullYear() === now.getUTCFullYear()
    && date.getUTCMonth() === now.getUTCMonth()
    && date.getUTCDate() === now.getUTCDate();
}

export async function loadControlSnapshot({
  db,
  runRepository = createRunRepository({ db }),
  resultRepository = createResultRepository({ db }),
  draftRepository = createDraftRepository({ db }),
  versionRepository = createVersionRepository({ db }),
  syncRepository = createSyncRepository({ db }),
} = {}) {
  if (!db) throw new Error('Runtime database is required');
  const [runs, results, drafts, versions, syncItems] = await Promise.all([
    runRepository.list(),
    resultRepository.list(),
    draftRepository.list(),
    versionRepository.listAll(),
    syncRepository.listAll(),
  ]);
  return { runs, results, drafts, versions, syncItems, storageErrors: [] };
}

export function buildControlModel(snapshot = {}, { now = new Date() } = {}) {
  const runs = snapshot.runs || [];
  const results = snapshot.results || [];
  const syncItems = snapshot.syncItems || [];
  const nowDate = now instanceof Date ? now : new Date(now);
  const nowMs = nowDate.getTime();
  const latency = averageLatency(runs);
  const tokens = tokenUsage(runs);
  const sync = summarizeSync(syncItems);
  return {
    metrics: {
      runsToday: runs.filter((run) => isSameUtcDate(run.createdAt ?? run.startedAt, nowDate)).length,
      runs7d: runs.filter((run) => withinDays(run.createdAt ?? run.startedAt, nowMs, 7)).length,
      runs30d: runs.filter((run) => withinDays(run.createdAt ?? run.startedAt, nowMs, 30)).length,
      savedResults: results.length,
      drafts: (snapshot.drafts || []).length,
      versions: (snapshot.versions || []).length,
      pendingSync: sync.pending,
      conflicts: sync.conflict,
      syncErrors: sync.sync_error,
      averageLatencyMs: latency?.averageMs ?? null,
      inputTokens: tokens?.inputTokens ?? null,
      outputTokens: tokens?.outputTokens ?? null,
    },
    activity: buildActivity(snapshot, { limit: 20 }),
    failures: buildFailures(snapshot),
    sync,
  };
}

export async function openControlRuntime({ indexedDBImpl = globalThis.indexedDB, storageManager = globalThis.navigator?.storage ?? null } = {}) {
  const db = await openRuntimeDb({ indexedDBImpl });
  const repositories = {
    runRepository: createRunRepository({ db }),
    resultRepository: createResultRepository({ db }),
    draftRepository: createDraftRepository({ db }),
    versionRepository: createVersionRepository({ db }),
    syncRepository: createSyncRepository({ db }),
  };
  async function refresh(options = {}) {
    const snapshot = await loadControlSnapshot({ db, ...repositories });
    const [storage] = await Promise.all([measureStorage(storageManager)]);
    return { snapshot, storage, model: buildControlModel(snapshot, options) };
  }
  return { db, repositories, refresh, close: () => db.close() };
}

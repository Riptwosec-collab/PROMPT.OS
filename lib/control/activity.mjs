function timeOf(record = {}, ...keys) {
  for (const key of keys) {
    const raw = record?.[key];
    if (raw == null) continue;
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function buildActivity(snapshot = {}, { limit = 20 } = {}) {
  const items = [];
  for (const run of snapshot.runs || []) {
    const occurredAt = timeOf(run, 'completedAt', 'updatedAt', 'createdAt', 'startedAt');
    if (!occurredAt) continue;
    items.push({ id: `run:${run.id}`, type: `run:${run.status || 'unknown'}`, sourceId: run.id, promptId: run.promptId ?? null, occurredAt, label: `Run ${run.status || 'updated'}` });
  }
  for (const result of snapshot.results || []) {
    const occurredAt = timeOf(result, 'createdAt', 'updatedAt');
    if (!occurredAt) continue;
    items.push({ id: `result:${result.resultId || result.id}`, type: 'result:saved', sourceId: result.resultId || result.id, runId: result.sourceRunId ?? null, occurredAt, label: result.name || 'Result saved' });
  }
  for (const version of snapshot.versions || []) {
    const occurredAt = timeOf(version, 'createdAt');
    if (!occurredAt) continue;
    items.push({ id: `version:${version.versionId}`, type: 'version:created', sourceId: version.versionId, promptId: version.promptId ?? null, occurredAt, label: `Version ${version.versionNumber || ''}`.trim() });
  }
  for (const item of snapshot.syncItems || []) {
    const occurredAt = timeOf(item, 'updatedAt', 'createdAt');
    if (!occurredAt) continue;
    items.push({ id: `sync:${item.id}`, type: `sync:${item.state || 'local'}`, sourceId: item.id, occurredAt, label: `Sync ${item.state || 'local'}` });
  }
  for (const error of snapshot.storageErrors || []) {
    const occurredAt = timeOf(error, 'occurredAt', 'updatedAt', 'createdAt');
    if (!occurredAt) continue;
    items.push({ id: `storage:${error.id}`, type: 'storage:error', sourceId: error.id, occurredAt, label: error.message || 'Storage error' });
  }
  return items.sort((a, b) => b.occurredAt - a.occurredAt || String(a.id).localeCompare(String(b.id))).slice(0, Math.max(0, Number(limit) || 20));
}

export function buildFailures(snapshot = {}) {
  const runs = (snapshot.runs || []).filter((run) => ['failed', 'interrupted'].includes(String(run?.status || '')));
  const sync = (snapshot.syncItems || []).filter((item) => ['sync_error', 'conflict'].includes(String(item?.state || '')));
  const storage = [...(snapshot.storageErrors || [])];
  return { runs, sync, storage };
}

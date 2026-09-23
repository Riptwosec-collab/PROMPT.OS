import { SYNC_STATE, normalizeRunMeta } from './model.mjs';

function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function requestValue(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

export function createResultRepository({
  db,
  idFactory = () => crypto.randomUUID(),
  now = Date.now,
} = {}) {
  if (!db) throw new Error('Runtime database is required');

  async function saveFromRun(run, { name = 'Saved Result', pinned = false } = {}) {
    if (!run?.id) throw new Error('Source run is required');
    const at = now();
    const record = {
      resultId: idFactory(),
      sourceRunId: run.id,
      name: String(name || 'Saved Result'),
      promptSnapshot: clone(run.promptSnapshot ?? ''),
      variablesSnapshot: clone(run.variablesSnapshot ?? {}),
      outputSnapshot: String(run.output ?? ''),
      metadataSnapshot: clone({
        promptId: run.promptId ?? null,
        renderedPrompt: run.renderedPrompt ?? '',
        sourceType: run.sourceType || 'prompt',
        sourceVersionId: run.sourceVersionId ?? null,
        status: run.status ?? null,
        startedAt: run.startedAt ?? null,
        completedAt: run.completedAt ?? null,
        ...normalizeRunMeta(run),
      }),
      pinned: Boolean(pinned),
      createdAt: at,
      updatedAt: at,
      syncState: SYNC_STATE.LOCAL,
      revision: 0,
    };

    const tx = db.transaction('savedResults', 'readwrite');
    const request = tx.objectStore('savedResults').add(clone(record));
    await requestValue(request);
    await transactionDone(tx);
    return clone(record);
  }

  async function get(resultId) {
    const tx = db.transaction('savedResults', 'readonly');
    const value = await requestValue(tx.objectStore('savedResults').get(resultId));
    await transactionDone(tx);
    return value ? clone(value) : null;
  }

  async function list() {
    const tx = db.transaction('savedResults', 'readonly');
    const values = await requestValue(tx.objectStore('savedResults').getAll());
    await transactionDone(tx);
    values.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    return clone(values);
  }

  return { saveFromRun, get, list };
}

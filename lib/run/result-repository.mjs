import { SYNC_STATE, normalizeRunMeta } from './model.mjs';
import { decodeResultCursor, normalizeResultQuery, resultRecordMatches } from './result-query.mjs';

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

function normalizeMetadataPatch(patch = {}) {
  const next = {};
  if (Object.prototype.hasOwnProperty.call(patch, 'name')) next.name = String(patch.name || 'Saved Result');
  if (Object.prototype.hasOwnProperty.call(patch, 'pinned')) next.pinned = Boolean(patch.pinned);
  if (Object.prototype.hasOwnProperty.call(patch, 'tags')) {
    next.tags = [...new Set((Array.isArray(patch.tags) ? patch.tags : []).map((item) => String(item).trim()).filter(Boolean))];
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'notes')) next.notes = String(patch.notes || '');
  return next;
}

export function createResultRepository({
  db,
  idFactory = () => crypto.randomUUID(),
  now = Date.now,
} = {}) {
  if (!db) throw new Error('Runtime database is required');

  async function putRecord(record) {
    const tx = db.transaction('savedResults', 'readwrite');
    await requestValue(tx.objectStore('savedResults').put(clone(record)));
    await transactionDone(tx);
    return clone(record);
  }

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
      tags: [],
      notes: '',
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

  async function listPage(input = {}) {
    const query = normalizeResultQuery(input);
    const offset = decodeResultCursor(query.cursor);
    const values = await list();
    const matched = values.filter((record) => resultRecordMatches(record, query));
    const items = matched.slice(offset, offset + query.limit);
    const nextOffset = offset + items.length;
    return { items: clone(items), nextCursor: nextOffset < matched.length ? String(nextOffset) : null };
  }

  async function updateMetadata(resultId, patch = {}) {
    const current = await get(resultId);
    if (!current) throw new Error('Saved result not found');
    const next = {
      ...current,
      ...normalizeMetadataPatch(patch),
      updatedAt: now(),
      revision: Number(current.revision || 0) + 1,
      syncState: SYNC_STATE.LOCAL,
    };
    return putRecord(next);
  }

  async function duplicate(resultId, metadataPatch = {}) {
    const current = await get(resultId);
    if (!current) throw new Error('Saved result not found');
    const at = now();
    const next = {
      ...clone(current),
      ...normalizeMetadataPatch(metadataPatch),
      resultId: idFactory(),
      createdAt: at,
      updatedAt: at,
      revision: 0,
      syncState: SYNC_STATE.LOCAL,
    };
    return putRecord(next);
  }

  async function remove(resultId) {
    const current = await get(resultId);
    if (!current) return false;
    const tx = db.transaction('savedResults', 'readwrite');
    tx.objectStore('savedResults').delete(resultId);
    await transactionDone(tx);
    return true;
  }

  return { saveFromRun, get, list, listPage, updateMetadata, duplicate, delete: remove };
}

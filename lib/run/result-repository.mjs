import { SYNC_STATE, normalizeRunMeta } from './model.mjs';
import { matchesResultQuery, normalizeResultQuery } from './result-query.mjs';

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

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))].slice(0, 50);
}

function applyMetadataPatch(record, patch = {}, at) {
  const next = { ...record };
  if (Object.hasOwn(patch, 'name')) next.name = String(patch.name || 'Saved Result').trim() || 'Saved Result';
  if (Object.hasOwn(patch, 'pinned')) next.pinned = Boolean(patch.pinned);
  if (Object.hasOwn(patch, 'tags')) next.tags = normalizeTags(patch.tags);
  if (Object.hasOwn(patch, 'notes')) next.notes = String(patch.notes ?? '');
  next.updatedAt = at;
  next.revision = Number(record.revision || 0) + 1;
  return next;
}

export function createResultRepository({
  db,
  idFactory = () => crypto.randomUUID(),
  now = Date.now,
} = {}) {
  if (!db) throw new Error('Runtime database is required');

  async function saveFromRun(run, { name = 'Saved Result', pinned = false, tags = [], notes = '' } = {}) {
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
        promptTitle: run.promptTitle ?? null,
        renderedPrompt: run.renderedPrompt ?? '',
        sourceType: run.sourceType || 'prompt',
        sourceVersionId: run.sourceVersionId ?? null,
        status: run.status ?? null,
        startedAt: run.startedAt ?? null,
        completedAt: run.completedAt ?? null,
        ...normalizeRunMeta(run),
      }),
      pinned: Boolean(pinned),
      tags: normalizeTags(tags),
      notes: String(notes ?? ''),
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

  async function getSourceRun(resultId) {
    const result = await get(resultId);
    if (!result?.sourceRunId) return null;
    const tx = db.transaction('runs', 'readonly');
    const value = await requestValue(tx.objectStore('runs').get(result.sourceRunId));
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
    const tx = db.transaction('savedResults', 'readonly');
    const index = tx.objectStore('savedResults').index('by-created-at-id');
    const keyRange = query.cursor
      ? globalThis.IDBKeyRange.upperBound([query.cursor.createdAt, query.cursor.resultId], true)
      : null;
    const request = index.openCursor(keyRange, 'prev');
    const items = [];
    let nextCursor = null;
    let hasMore = false;

    await new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error || new Error('Unable to page saved results'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const value = cursor.value;
        if (matchesResultQuery(value, query)) {
          if (items.length < query.limit) {
            items.push(clone(value));
            nextCursor = { createdAt: Number(value.createdAt || 0), resultId: String(value.resultId) };
            cursor.continue();
            return;
          }
          hasMore = true;
          return;
        }
        cursor.continue();
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Saved results transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('Saved results transaction aborted'));
    });

    return { items, nextCursor: hasMore ? nextCursor : null };
  }

  async function updateMetadata(resultId, patch = {}) {
    const tx = db.transaction('savedResults', 'readwrite');
    const store = tx.objectStore('savedResults');
    const current = await requestValue(store.get(resultId));
    if (!current) {
      try { tx.abort(); } catch {}
      throw new Error('Saved Result not found');
    }
    const next = applyMetadataPatch(current, patch, now());
    store.put(clone(next));
    await transactionDone(tx);
    return clone(next);
  }

  async function duplicate(resultId, metadataPatch = {}) {
    const source = await get(resultId);
    if (!source) throw new Error('Saved Result not found');
    const at = now();
    const copy = applyMetadataPatch({
      ...clone(source),
      resultId: idFactory(),
      createdAt: at,
      updatedAt: at,
      revision: -1,
      syncState: SYNC_STATE.LOCAL,
    }, metadataPatch, at);
    copy.revision = 0;
    const tx = db.transaction('savedResults', 'readwrite');
    await requestValue(tx.objectStore('savedResults').add(clone(copy)));
    await transactionDone(tx);
    return clone(copy);
  }

  async function remove(resultId) {
    const tx = db.transaction('savedResults', 'readwrite');
    const store = tx.objectStore('savedResults');
    const current = await requestValue(store.get(resultId));
    if (current) store.delete(resultId);
    await transactionDone(tx);
    return Boolean(current);
  }

  return { saveFromRun, get, getSourceRun, list, listPage, updateMetadata, duplicate, delete: remove };
}

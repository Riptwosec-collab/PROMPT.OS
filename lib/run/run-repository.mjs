import { RUN_STATUS, TERMINAL_RUN_STATUSES, normalizeRunMeta } from './model.mjs';
import { decodePageCursor, historyRecordMatches, normalizeHistoryQuery } from './history-query.mjs';

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

function assertActive(run) {
  if (!run) throw new Error('Run not found');
  if (TERMINAL_RUN_STATUSES.has(run.status)) throw new Error('Cannot modify terminal run');
}

export function createRunRepository({ db, now = Date.now } = {}) {
  if (!db) throw new Error('Runtime database is required');

  async function create(run) {
    const tx = db.transaction('runs', 'readwrite');
    const request = tx.objectStore('runs').add(clone(run));
    const result = await requestValue(request);
    await transactionDone(tx);
    return result;
  }

  async function get(id) {
    const tx = db.transaction('runs', 'readonly');
    const value = await requestValue(tx.objectStore('runs').get(id));
    await transactionDone(tx);
    return value ? clone(value) : null;
  }

  async function list({ promptId, status } = {}) {
    const tx = db.transaction('runs', 'readonly');
    const store = tx.objectStore('runs');
    let request;
    if (promptId != null) request = store.index('by-prompt-id').getAll(promptId);
    else if (status != null) request = store.index('by-status').getAll(status);
    else request = store.getAll();
    let values = await requestValue(request);
    await transactionDone(tx);
    if (promptId != null) values = values.filter((run) => run.promptId === promptId);
    if (status != null) values = values.filter((run) => run.status === status);
    values.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    return clone(values);
  }

  async function listPage(input = {}) {
    const query = normalizeHistoryQuery(input);
    const offset = decodePageCursor(query.cursor);
    const tx = db.transaction('runs', 'readonly');
    const values = await requestValue(tx.objectStore('runs').index('by-created-at').getAll());
    await transactionDone(tx);
    const matched = values
      .filter((run) => historyRecordMatches(run, query))
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0) || String(b.id || '').localeCompare(String(a.id || '')));
    const items = matched.slice(offset, offset + query.limit);
    const nextOffset = offset + items.length;
    return {
      items: clone(items),
      nextCursor: nextOffset < matched.length ? String(nextOffset) : null,
    };
  }

  async function remove(id) {
    const tx = db.transaction('runs', 'readwrite');
    const store = tx.objectStore('runs');
    const current = await requestValue(store.get(id));
    if (!current) {
      await transactionDone(tx);
      return false;
    }
    store.delete(id);
    await transactionDone(tx);
    return true;
  }

  async function updateActive(id, updater) {
    const tx = db.transaction('runs', 'readwrite');
    const store = tx.objectStore('runs');
    const current = await requestValue(store.get(id));
    assertActive(current);
    const next = updater(clone(current));
    store.put(next);
    await transactionDone(tx);
    return clone(next);
  }

  async function checkpoint(id, patch = {}) {
    return updateActive(id, (current) => {
      const next = { ...current };
      const allowed = [
        'status', 'output', 'updatedAt', 'provider', 'model', 'latencyMs',
        'inputTokens', 'outputTokens', 'responseId', 'error',
      ];
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(patch, key)) next[key] = clone(patch[key]);
      }
      if (!Number.isFinite(next.updatedAt)) next.updatedAt = now();
      return next;
    });
  }

  async function heartbeat(id, { ownerSessionId, heartbeatAt } = {}) {
    return updateActive(id, (current) => ({
      ...current,
      ownerSessionId: ownerSessionId ?? current.ownerSessionId,
      heartbeatAt: Number.isFinite(heartbeatAt) ? heartbeatAt : now(),
      updatedAt: Number.isFinite(heartbeatAt) ? heartbeatAt : now(),
    }));
  }

  async function finalize(id, terminal = {}) {
    const tx = db.transaction('runs', 'readwrite');
    const store = tx.objectStore('runs');
    const current = await requestValue(store.get(id));
    if (!current) {
      try { tx.abort(); } catch {}
      throw new Error('Run not found');
    }
    if (TERMINAL_RUN_STATUSES.has(current.status)) {
      await transactionDone(tx);
      return clone(current);
    }
    if (!TERMINAL_RUN_STATUSES.has(terminal.status)) {
      try { tx.abort(); } catch {}
      throw new Error('Terminal run status is required');
    }
    const completedAt = Number.isFinite(terminal.completedAt) ? terminal.completedAt : now();
    const next = {
      ...current,
      status: terminal.status,
      output: String(terminal.output ?? current.output ?? ''),
      error: terminal.status === RUN_STATUS.FAILED ? String(terminal.error || current.error || 'Run failed') : current.error,
      completedAt,
      ownerSessionId: null,
      heartbeatAt: null,
      updatedAt: completedAt,
      ...normalizeRunMeta(terminal.meta || terminal),
    };
    store.put(next);
    await transactionDone(tx);
    return clone(next);
  }

  async function recoverableActive() {
    const values = await list();
    return values.filter((run) => run.status === RUN_STATUS.PREPARING || run.status === RUN_STATUS.RUNNING);
  }

  return { create, get, list, listPage, delete: remove, checkpoint, heartbeat, finalize, recoverableActive };
}

import { createDraft } from './draft-model.mjs';

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
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

export function createDraftRepository({ db, now = Date.now } = {}) {
  if (!db) throw new Error('Runtime database is required');

  async function get(draftId) {
    const tx = db.transaction('promptDrafts', 'readonly');
    const value = await requestValue(tx.objectStore('promptDrafts').get(String(draftId)));
    await transactionDone(tx);
    return value ? clone(value) : null;
  }

  async function upsert(input) {
    const draft = createDraft(input);
    const tx = db.transaction('promptDrafts', 'readwrite');
    const store = tx.objectStore('promptDrafts');
    const existing = await requestValue(store.get(draft.draftId));
    const at = now();
    const record = {
      ...draft,
      createdAt: existing?.createdAt ?? draft.createdAt ?? at,
      updatedAt: at,
      revision: existing ? Number(existing.revision || 0) + 1 : Number(draft.revision || 0),
      syncState: 'local',
    };
    await requestValue(store.put(clone(record)));
    await transactionDone(tx);
    return clone(record);
  }

  async function list() {
    const tx = db.transaction('promptDrafts', 'readonly');
    const values = await requestValue(tx.objectStore('promptDrafts').getAll());
    await transactionDone(tx);
    values.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    return clone(values);
  }

  async function remove(draftId) {
    const tx = db.transaction('promptDrafts', 'readwrite');
    const store = tx.objectStore('promptDrafts');
    const existing = await requestValue(store.get(String(draftId)));
    if (existing) await requestValue(store.delete(String(draftId)));
    await transactionDone(tx);
    return Boolean(existing);
  }

  return { get, upsert, list, delete: remove };
}

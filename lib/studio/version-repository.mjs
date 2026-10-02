import { createVersionSnapshot, VERSION_STATUS } from './version-model.mjs';

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

export function createVersionRepository({ db, now = Date.now, idFactory = () => crypto.randomUUID() } = {}) {
  if (!db) throw new Error('Runtime database is required');

  async function get(versionId) {
    const tx = db.transaction('promptVersions', 'readonly');
    const value = await requestValue(tx.objectStore('promptVersions').get(String(versionId)));
    await transactionDone(tx);
    return value ? clone(value) : null;
  }

  async function list(promptId) {
    const tx = db.transaction('promptVersions', 'readonly');
    const index = tx.objectStore('promptVersions').index('by-prompt-id');
    const values = await requestValue(index.getAll(String(promptId)));
    await transactionDone(tx);
    values.sort((a, b) => Number(b.versionNumber || 0) - Number(a.versionNumber || 0));
    return clone(values);
  }

  async function nextVersionNumber(promptId) {
    const values = await list(promptId);
    return values.reduce((max, item) => Math.max(max, Number(item.versionNumber || 0)), 0) + 1;
  }

  async function create(input) {
    const record = input?.promptSnapshot !== undefined
      ? clone(input)
      : createVersionSnapshot({ ...input, versionId: input?.versionId || idFactory(), createdAt: input?.createdAt ?? now() });
    const tx = db.transaction('promptVersions', 'readwrite');
    await requestValue(tx.objectStore('promptVersions').add(clone(record)));
    await transactionDone(tx);
    return clone(record);
  }

  async function archive(versionId) {
    const tx = db.transaction('promptVersions', 'readwrite');
    const store = tx.objectStore('promptVersions');
    const current = await requestValue(store.get(String(versionId)));
    if (!current) {
      await transactionDone(tx);
      return null;
    }
    const next = { ...current, status: VERSION_STATUS.ARCHIVED, revision: Number(current.revision || 0) + 1 };
    await requestValue(store.put(next));
    await transactionDone(tx);
    return clone(next);
  }

  return { get, list, nextVersionNumber, create, archive };
}

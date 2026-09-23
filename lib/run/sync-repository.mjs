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

export function createSyncRepository({ db } = {}) {
  if (!db) throw new Error('Runtime database is required');

  async function enqueue(mutation) {
    if (!mutation?.id) throw new Error('Mutation id is required');
    const record = { ...clone(mutation), state: 'pending', error: null, conflict: null };
    const tx = db.transaction('syncQueue', 'readwrite');
    tx.objectStore('syncQueue').put(record);
    await transactionDone(tx);
    return clone(record);
  }

  async function get(id) {
    const tx = db.transaction('syncQueue', 'readonly');
    const value = await requestValue(tx.objectStore('syncQueue').get(id));
    await transactionDone(tx);
    return value ? clone(value) : null;
  }

  async function listPending() {
    const tx = db.transaction('syncQueue', 'readonly');
    const values = await requestValue(tx.objectStore('syncQueue').getAll());
    await transactionDone(tx);
    return clone(values.filter((item) => item.state === 'pending').sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0)));
  }

  async function updateState(id, patch) {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const current = await requestValue(store.get(id));
    if (!current) {
      try { tx.abort(); } catch {}
      throw new Error('Sync mutation not found');
    }
    const next = { ...current, ...clone(patch) };
    store.put(next);
    await transactionDone(tx);
    return clone(next);
  }

  const markSyncing = (id) => updateState(id, { state: 'syncing', error: null });
  const markError = (id, error) => updateState(id, { state: 'sync_error', error: String(error || 'Sync failed') });
  const markConflict = (id, conflict) => updateState(id, { state: 'conflict', conflict: clone(conflict), error: null });

  async function markApplied(id) {
    const tx = db.transaction('syncQueue', 'readwrite');
    tx.objectStore('syncQueue').delete(id);
    await transactionDone(tx);
  }

  return { enqueue, get, listPending, markSyncing, markApplied, markError, markConflict };
}

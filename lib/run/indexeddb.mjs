export const RUNTIME_DB_NAME = 'prompt-os-runtime';
export const RUNTIME_DB_VERSION = 1;

function ensureIndex(store, name, keyPath, options = {}) {
  if (!store.indexNames.contains(name)) store.createIndex(name, keyPath, options);
}

function ensureSchema(request) {
  const db = request.result;
  const tx = request.transaction;

  const runs = db.objectStoreNames.contains('runs')
    ? tx.objectStore('runs')
    : db.createObjectStore('runs', { keyPath: 'id' });
  ensureIndex(runs, 'by-created-at', 'createdAt');
  ensureIndex(runs, 'by-prompt-id', 'promptId');
  ensureIndex(runs, 'by-status', 'status');

  const results = db.objectStoreNames.contains('savedResults')
    ? tx.objectStore('savedResults')
    : db.createObjectStore('savedResults', { keyPath: 'resultId' });
  ensureIndex(results, 'by-created-at', 'createdAt');
  ensureIndex(results, 'by-source-run-id', 'sourceRunId');

  const syncQueue = db.objectStoreNames.contains('syncQueue')
    ? tx.objectStore('syncQueue')
    : db.createObjectStore('syncQueue', { keyPath: 'id' });
  ensureIndex(syncQueue, 'by-created-at', 'createdAt');
  ensureIndex(syncQueue, 'by-state', 'state');

  if (!db.objectStoreNames.contains('runtimeMeta')) {
    db.createObjectStore('runtimeMeta', { keyPath: 'key' });
  }
}

export function openRuntimeDb({ indexedDBImpl = globalThis.indexedDB } = {}) {
  return new Promise((resolve, reject) => {
    if (!indexedDBImpl || typeof indexedDBImpl.open !== 'function') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    let request;
    try {
      request = indexedDBImpl.open(RUNTIME_DB_NAME, RUNTIME_DB_VERSION);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      try {
        ensureSchema(request);
      } catch (error) {
        try { request.transaction?.abort(); } catch {}
        reject(error);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open runtime IndexedDB'));
    request.onblocked = () => reject(new Error('Runtime IndexedDB upgrade is blocked by another tab'));
  });
}

export function withStore(db, storeName, mode, fn) {
  return new Promise((resolve, reject) => {
    let tx;
    try {
      tx = db.transaction(storeName, mode);
    } catch (error) {
      reject(error);
      return;
    }

    const store = tx.objectStore(storeName);
    let result;
    let request;

    try {
      request = fn(store, tx);
    } catch (error) {
      try { tx.abort(); } catch {}
      reject(error);
      return;
    }

    if (request && typeof request === 'object' && 'onsuccess' in request) {
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(request.error || new Error(`IndexedDB request failed: ${storeName}`));
    } else {
      result = request;
    }

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error(`IndexedDB transaction failed: ${storeName}`));
    tx.onabort = () => reject(tx.error || new Error(`IndexedDB transaction aborted: ${storeName}`));
  });
}

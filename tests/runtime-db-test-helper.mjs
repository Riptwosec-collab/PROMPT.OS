import { indexedDB } from 'fake-indexeddb';
import { RUNTIME_DB_NAME, openRuntimeDb } from '../lib/run/indexeddb.mjs';

function deleteRuntimeDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(RUNTIME_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Unable to reset runtime test database'));
    request.onblocked = () => reject(new Error('Runtime test database reset is blocked by an open handle'));
  });
}

export async function freshRuntimeDb() {
  await deleteRuntimeDb();
  return openRuntimeDb({ indexedDBImpl: indexedDB });
}

import { openRuntimeDb } from '../run/indexeddb.mjs';
import { createDraftRepository } from './draft-repository.mjs';
import { createVersionRepository } from './version-repository.mjs';

export async function openStudioRuntime(options = {}) {
  const db = await openRuntimeDb(options);
  return {
    db,
    draftRepository: createDraftRepository({ db }),
    versionRepository: createVersionRepository({ db }),
    close() { db.close(); },
  };
}

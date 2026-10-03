import { openRuntimeDb } from './indexeddb.mjs';
import { createRunRepository } from './run-repository.mjs';
import { createResultRepository } from './result-repository.mjs';
import { createSyncRepository } from './sync-repository.mjs';
import { recoverInterruptedRuns } from './recovery.mjs';

export async function openRuntimeRepositories(options = {}) {
  const db = await openRuntimeDb(options);
  try {
    const runRepository = createRunRepository({ db });
    const resultRepository = createResultRepository({ db });
    const syncRepository = createSyncRepository({ db });
    const recoveredRuns = await recoverInterruptedRuns({ repository: runRepository });
    return {
      db,
      runRepository,
      resultRepository,
      syncRepository,
      latestRecoveredRun: recoveredRuns[0] || null,
      close() { db.close(); },
    };
  } catch (error) {
    db.close();
    throw error;
  }
}

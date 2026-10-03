'use client';

import { useEffect, useState } from 'react';
import { openRuntimeRepositories } from '../../lib/run/runtime-repositories.mjs';

const IDLE = Object.freeze({ state: 'idle', runRepository: null, resultRepository: null, syncRepository: null, latestRecoveredRun: null, error: null });

export default function useRuntimeRepositories(enabled = true) {
  const [runtime, setRuntime] = useState(IDLE);

  useEffect(() => {
    if (!enabled) {
      setRuntime(IDLE);
      return undefined;
    }
    let cancelled = false;
    let owner = null;
    setRuntime({ ...IDLE, state: 'loading' });
    openRuntimeRepositories()
      .then((opened) => {
        owner = opened;
        if (cancelled) {
          opened.close();
          return;
        }
        setRuntime({
          state: 'ready',
          runRepository: opened.runRepository,
          resultRepository: opened.resultRepository,
          syncRepository: opened.syncRepository,
          latestRecoveredRun: opened.latestRecoveredRun,
          error: null,
        });
      })
      .catch((error) => {
        if (!cancelled) setRuntime({ ...IDLE, state: 'error', error: error?.message || 'Local runtime storage is unavailable.' });
      });
    return () => {
      cancelled = true;
      owner?.close();
    };
  }, [enabled]);

  return runtime;
}

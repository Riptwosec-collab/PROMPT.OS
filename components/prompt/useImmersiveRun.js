'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { streamAiRun } from '../../lib/ai/run-stream.mjs';
import { createRunSessionController } from '../../lib/run/session-controller.mjs';

export default function useImmersiveRun({
  runRepository,
  resultRepository,
  syncRepository,
  runner = streamAiRun,
  now = Date.now,
  idFactory,
  sessionId,
} = {}) {
  const stableSessionId = useMemo(() => sessionId || crypto.randomUUID(), [sessionId]);
  const controller = useMemo(() => createRunSessionController({
    runRepository,
    resultRepository,
    syncRepository,
    runner,
    now,
    idFactory,
    sessionId: stableSessionId,
  }), [runRepository, resultRepository, syncRepository, runner, now, idFactory, stableSessionId]);

  const [state, setState] = useState(() => controller.getSnapshot());

  useEffect(() => {
    setState(controller.getSnapshot());
    return controller.subscribe(setState);
  }, [controller]);

  useEffect(() => {
    const persistActiveRun = () => { controller.checkpointNow().catch(() => {}); };
    window.addEventListener('pagehide', persistActiveRun);
    document.addEventListener('visibilitychange', persistActiveRun);
    return () => {
      window.removeEventListener('pagehide', persistActiveRun);
      document.removeEventListener('visibilitychange', persistActiveRun);
      controller.dispose();
    };
  }, [controller]);

  return {
    session: state.session,
    persistence: state.persistence,
    sync: state.sync,
    start: useCallback((input) => controller.start(input), [controller]),
    stop: useCallback(() => controller.stop(), [controller]),
    retry: useCallback((run) => controller.retry(run), [controller]),
    regenerate: useCallback((input) => controller.regenerate(input), [controller]),
    saveResult: useCallback((metadata) => controller.saveResult(metadata), [controller]),
    reset: useCallback(() => controller.reset(), [controller]),
  };
}

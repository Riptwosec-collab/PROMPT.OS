import {
  RUN_STATUS,
  createRunRecord,
  normalizeRunMeta,
  buildRetryInput,
  buildRegenerateInput,
} from './model.mjs';
import { shouldCheckpoint } from './checkpoint.mjs';
import { RUN_LEASE_HEARTBEAT_MS } from './recovery.mjs';

function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function abortError(error) {
  return error?.name === 'AbortError' || /abort/i.test(String(error?.message || ''));
}

export function createRunSessionController({
  runRepository,
  resultRepository,
  syncRepository,
  runner,
  now = Date.now,
  idFactory = () => crypto.randomUUID(),
  sessionId,
  setIntervalImpl = globalThis.setInterval,
  clearIntervalImpl = globalThis.clearInterval,
} = {}) {
  if (!runRepository?.create || !runRepository?.finalize) throw new Error('Run repository is required');
  if (typeof runner !== 'function') throw new Error('Run runner is required');
  if (!sessionId) throw new Error('Session id is required');

  const listeners = new Set();
  let active = null;
  let snapshot = {
    session: null,
    persistence: { state: 'idle', error: null },
    sync: { state: 'local', error: null },
  };

  const emit = () => {
    const value = clone(snapshot);
    for (const listener of listeners) listener(value);
  };

  const setSnapshot = (patch) => {
    snapshot = { ...snapshot, ...patch };
    emit();
  };

  const setPersistence = (state, error = null) => {
    snapshot = { ...snapshot, persistence: { state, error: error ? String(error) : null } };
    emit();
  };

  const setSync = (state, error = null) => {
    snapshot = { ...snapshot, sync: { state, error: error ? String(error) : null } };
    emit();
  };

  const stopHeartbeat = (context) => {
    if (context?.heartbeatTimer != null && typeof clearIntervalImpl === 'function') {
      clearIntervalImpl(context.heartbeatTimer);
      context.heartbeatTimer = null;
    }
  };

  const queueTerminalSync = async (run) => {
    if (!syncRepository?.enqueue || !run?.id) return;
    try {
      const mutation = {
        id: `run:${run.id}:terminal:${run.completedAt ?? run.updatedAt ?? now()}`,
        operation: 'upsert',
        entityType: 'run',
        entityId: run.id,
        baseRevision: Number(run.revision || 0),
        createdAt: now(),
        payload: clone(run),
      };
      await syncRepository.enqueue(mutation);
      setSync('pending');
    } catch (error) {
      setSync('sync_error', error?.message || error);
    }
  };

  const finish = async (context, status, { error = null } = {}) => {
    if (!context || context.finalized) return clone(snapshot.session);
    context.finalized = true;
    stopHeartbeat(context);
    const at = now();
    const finalPayload = {
      status,
      output: context.output,
      completedAt: at,
      error: error ? String(error) : null,
      meta: normalizeRunMeta(context.meta),
    };
    setPersistence('saving');
    try {
      const persisted = await runRepository.finalize(context.id, finalPayload);
      const session = {
        ...persisted,
        status,
        output: context.output,
        error: status === RUN_STATUS.FAILED ? String(error || persisted?.error || 'Run failed') : persisted?.error ?? null,
        ...normalizeRunMeta(context.meta),
      };
      setSnapshot({ session });
      setPersistence('saved');
      await queueTerminalSync(session);
      return clone(session);
    } catch (persistError) {
      const session = {
        ...(snapshot.session || context.run),
        status,
        output: context.output,
        error: status === RUN_STATUS.FAILED ? String(error || 'Run failed') : snapshot.session?.error ?? null,
        completedAt: at,
        ...normalizeRunMeta(context.meta),
      };
      setSnapshot({ session });
      setPersistence('error', persistError?.message || persistError);
      return clone(session);
    }
  };

  const scheduleCheckpoint = (context, patch, { force = false } = {}) => {
    if (!context || context.finalized) return context?.checkpointChain || Promise.resolve();
    const at = now();
    const eligible = force || shouldCheckpoint({
      lastCheckpointAt: context.lastCheckpointAt,
      now: at,
      persistedLength: context.persistedLength,
      outputLength: context.output.length,
    });
    if (!eligible) return context.checkpointChain;

    const payload = {
      ...patch,
      output: context.output,
      updatedAt: at,
      ...normalizeRunMeta(context.meta),
    };
    context.lastCheckpointAt = at;
    context.persistedLength = context.output.length;
    context.checkpointChain = context.checkpointChain.then(async () => {
      if (context.finalized) return;
      setPersistence('saving');
      try {
        const persisted = await runRepository.checkpoint(context.id, payload);
        if (!context.finalized) {
          setSnapshot({ session: { ...persisted, output: context.output, ...normalizeRunMeta(context.meta) } });
          setPersistence('saved');
        }
      } catch (error) {
        context.persistedLength = Math.min(context.persistedLength, context.lastSuccessfulLength);
        setPersistence('warning', error?.message || error);
      }
    });
    return context.checkpointChain;
  };

  const startHeartbeat = (context) => {
    if (typeof setIntervalImpl !== 'function') return;
    context.heartbeatTimer = setIntervalImpl(() => {
      if (context.finalized) return;
      const heartbeatAt = now();
      Promise.resolve(runRepository.heartbeat?.(context.id, { ownerSessionId: sessionId, heartbeatAt }))
        .catch((error) => setPersistence('warning', error?.message || error));
    }, RUN_LEASE_HEARTBEAT_MS);
  };

  async function start(input = {}) {
    if (active && !active.finalized) await stop();

    const id = idFactory();
    const at = now();
    const base = createRunRecord({
      id,
      promptId: input.promptId ?? null,
      parentRunId: input.parentRunId ?? null,
      trigger: input.trigger || 'run',
      sourceType: input.sourceType || 'prompt',
      sourceVersionId: input.sourceVersionId ?? null,
      promptSnapshot: input.promptSnapshot ?? '',
      variablesSnapshot: input.variablesSnapshot ?? {},
      renderedPrompt: input.renderedPrompt ?? '',
      ownerSessionId: sessionId,
      now: at,
    });
    const initial = {
      ...base,
      ...normalizeRunMeta({ provider: input.provider, model: input.model }),
    };
    setSnapshot({ session: initial });
    setPersistence('saving');
    setSync('local');

    try {
      await runRepository.create(initial);
    } catch (error) {
      setPersistence('error', error?.message || error);
      throw error;
    }

    const abortController = new AbortController();
    const context = {
      id,
      run: initial,
      controller: abortController,
      output: '',
      meta: normalizeRunMeta({ provider: input.provider, model: input.model }),
      lastCheckpointAt: at,
      lastSuccessfulLength: 0,
      persistedLength: 0,
      checkpointChain: Promise.resolve(),
      heartbeatTimer: null,
      stopRequested: false,
      finalized: false,
    };
    active = context;

    const running = { ...initial, status: RUN_STATUS.RUNNING, updatedAt: now() };
    setSnapshot({ session: running });
    setPersistence('saved');
    await scheduleCheckpoint(context, { status: RUN_STATUS.RUNNING }, { force: true });
    startHeartbeat(context);

    try {
      await runner({
        provider: input.provider || 'openai',
        model: input.model,
        prompt: String(input.renderedPrompt ?? ''),
        signal: abortController.signal,
        onDelta: (delta) => {
          if (context.finalized || !delta) return;
          context.output += String(delta);
          setSnapshot({
            session: {
              ...(snapshot.session || running),
              status: RUN_STATUS.RUNNING,
              output: context.output,
              updatedAt: now(),
              ...normalizeRunMeta(context.meta),
            },
          });
          const previousPersistedLength = context.persistedLength;
          const promise = scheduleCheckpoint(context, { status: RUN_STATUS.RUNNING });
          promise.then(() => {
            if (context.persistedLength > previousPersistedLength) context.lastSuccessfulLength = context.persistedLength;
          }).catch(() => {});
        },
        onMeta: (meta) => {
          if (context.finalized) return;
          context.meta = { ...context.meta, ...normalizeRunMeta(meta) };
          setSnapshot({ session: { ...(snapshot.session || running), ...normalizeRunMeta(context.meta) } });
        },
      });
      await context.checkpointChain;
      if (context.finalized) return clone(snapshot.session);
      return finish(context, RUN_STATUS.SUCCESS);
    } catch (error) {
      await context.checkpointChain.catch(() => {});
      if (context.finalized) return clone(snapshot.session);
      if (context.stopRequested || abortError(error)) return finish(context, RUN_STATUS.STOPPED);
      return finish(context, RUN_STATUS.FAILED, { error: error?.message || error || 'Run failed' });
    } finally {
      stopHeartbeat(context);
      if (active === context && context.finalized) active = null;
    }
  }

  async function stop() {
    const context = active;
    if (!context || context.finalized) return clone(snapshot.session);
    context.stopRequested = true;
    context.controller.abort();
    await context.checkpointChain.catch(() => {});
    return finish(context, RUN_STATUS.STOPPED);
  }

  function retry(sourceRun) {
    return start({ ...buildRetryInput(sourceRun), provider: sourceRun?.provider, model: sourceRun?.model });
  }

  function regenerate(args) {
    const built = buildRegenerateInput(args);
    return start({
      ...built,
      provider: args?.provider ?? args?.sourceRun?.provider,
      model: args?.model ?? args?.sourceRun?.model,
    });
  }

  async function saveResult(metadata = {}) {
    if (!resultRepository?.saveFromRun) throw new Error('Saved Result repository is unavailable');
    const run = snapshot.session;
    if (!run?.id) throw new Error('No run is available to save');
    return resultRepository.saveFromRun(clone(run), metadata);
  }

  async function checkpointNow() {
    if (!active || active.finalized) return clone(snapshot.session);
    await scheduleCheckpoint(active, { status: RUN_STATUS.RUNNING }, { force: true });
    return clone(snapshot.session);
  }

  function reset() {
    if (active && !active.finalized) return false;
    snapshot = {
      session: null,
      persistence: { state: 'idle', error: null },
      sync: { state: 'local', error: null },
    };
    emit();
    return true;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot() {
    return clone(snapshot);
  }

  function dispose() {
    if (active && !active.finalized) {
      active.stopRequested = true;
      active.controller.abort();
      stopHeartbeat(active);
    }
    listeners.clear();
  }

  return {
    start,
    stop,
    retry,
    regenerate,
    saveResult,
    checkpointNow,
    reset,
    subscribe,
    getSnapshot,
    dispose,
  };
}

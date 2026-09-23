export const RUN_STATUS = Object.freeze({
  PREPARING: 'preparing',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  STOPPED: 'stopped',
  INTERRUPTED: 'interrupted',
});

export const TERMINAL_RUN_STATUSES = new Set([
  RUN_STATUS.SUCCESS,
  RUN_STATUS.FAILED,
  RUN_STATUS.STOPPED,
  RUN_STATUS.INTERRUPTED,
]);

export const SYNC_STATE = Object.freeze({
  LOCAL: 'local',
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  SYNC_ERROR: 'sync_error',
});

const NUMERIC_META = new Set(['latencyMs', 'inputTokens', 'outputTokens']);
const STRING_META = new Set(['provider', 'model', 'responseId']);

function cloneSnapshot(value) {
  if (value == null || typeof value !== 'object') return value;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function normalizeRunMeta(meta = {}) {
  if (!meta || typeof meta !== 'object') return {};
  const normalized = {};
  for (const key of STRING_META) {
    if (typeof meta[key] === 'string' && meta[key].trim()) normalized[key] = meta[key];
  }
  for (const key of NUMERIC_META) {
    if (Number.isFinite(meta[key])) normalized[key] = meta[key];
  }
  return normalized;
}

export function isTerminalRun(run) {
  return TERMINAL_RUN_STATUSES.has(run?.status);
}

export function createRunRecord({
  id,
  promptId,
  parentRunId = null,
  trigger = 'run',
  sourceType = 'prompt',
  sourceVersionId = null,
  promptSnapshot = '',
  variablesSnapshot = {},
  renderedPrompt = '',
  ownerSessionId = null,
  now = Date.now(),
} = {}) {
  if (!id) throw new Error('Run id is required');
  return {
    id,
    promptId: promptId ?? null,
    parentRunId,
    trigger,
    sourceType,
    sourceVersionId,
    status: RUN_STATUS.PREPARING,
    promptSnapshot: cloneSnapshot(promptSnapshot),
    variablesSnapshot: cloneSnapshot(variablesSnapshot),
    renderedPrompt: String(renderedPrompt ?? ''),
    output: '',
    error: null,
    startedAt: now,
    completedAt: null,
    ownerSessionId,
    heartbeatAt: ownerSessionId ? now : null,
    syncState: SYNC_STATE.LOCAL,
    revision: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyRunEvent(run, event = {}) {
  if (!run || typeof run !== 'object') throw new Error('Run record is required');
  if (isTerminalRun(run)) return { ...run };

  const at = Number.isFinite(event.at) ? event.at : Date.now();

  if (event.type === 'start' && run.status === RUN_STATUS.PREPARING) {
    return { ...run, status: RUN_STATUS.RUNNING, updatedAt: at };
  }

  if (event.type === 'delta' && run.status === RUN_STATUS.RUNNING) {
    return { ...run, output: String(event.output ?? run.output ?? ''), updatedAt: at };
  }

  if (TERMINAL_RUN_STATUSES.has(event.type)) {
    return {
      ...run,
      status: event.type,
      output: String(event.output ?? run.output ?? ''),
      error: event.type === RUN_STATUS.FAILED ? String(event.error || 'Run failed') : run.error,
      completedAt: at,
      ownerSessionId: null,
      heartbeatAt: null,
      updatedAt: at,
      ...normalizeRunMeta(event.meta),
    };
  }

  return { ...run };
}

export function buildRetryInput(run = {}) {
  return {
    parentRunId: run.id ?? null,
    trigger: 'retry',
    promptId: run.promptId ?? null,
    promptSnapshot: cloneSnapshot(run.promptSnapshot ?? ''),
    variablesSnapshot: cloneSnapshot(run.variablesSnapshot ?? {}),
    renderedPrompt: String(run.renderedPrompt ?? ''),
    sourceType: run.sourceType || 'prompt',
    sourceVersionId: run.sourceVersionId ?? null,
  };
}

export function buildRegenerateInput({
  sourceRun,
  promptSnapshot,
  variablesSnapshot,
  renderedPrompt,
} = {}) {
  return {
    parentRunId: sourceRun?.id ?? null,
    trigger: 'regenerate',
    promptId: sourceRun?.promptId ?? null,
    promptSnapshot: cloneSnapshot(promptSnapshot ?? ''),
    variablesSnapshot: cloneSnapshot(variablesSnapshot ?? {}),
    renderedPrompt: String(renderedPrompt ?? ''),
    sourceType: sourceRun?.sourceType || 'prompt',
    sourceVersionId: sourceRun?.sourceVersionId ?? null,
  };
}

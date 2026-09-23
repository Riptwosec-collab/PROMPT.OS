export const RUN_STATUS = Object.freeze({
  IDLE: 'idle',
  PREPARING: 'preparing',
  RUNNING: 'running',
  STREAMING: 'streaming',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STOPPED: 'stopped',
});

const META_STRING_FIELDS = ['provider', 'model', 'responseId'];
const META_NUMBER_FIELDS = ['latencyMs', 'inputTokens', 'outputTokens'];

export function normalizeRunMeta(meta = {}) {
  const normalized = {};

  for (const key of META_STRING_FIELDS) {
    if (typeof meta?.[key] === 'string' && meta[key].trim()) normalized[key] = meta[key];
  }

  for (const key of META_NUMBER_FIELDS) {
    if (Number.isFinite(meta?.[key])) normalized[key] = meta[key];
  }

  return normalized;
}

export function createRunState() {
  return {
    status: RUN_STATUS.IDLE,
    output: '',
    meta: {},
    error: '',
    startedAt: null,
  };
}

export function reduceRunState(state = createRunState(), event = {}) {
  switch (event.type) {
    case 'prepare':
      return {
        ...createRunState(),
        status: RUN_STATUS.PREPARING,
        startedAt: Number.isFinite(event.startedAt) ? event.startedAt : Date.now(),
      };
    case 'start':
      return {
        ...state,
        status: RUN_STATUS.RUNNING,
        error: '',
      };
    case 'delta': {
      const delta = typeof event.delta === 'string' ? event.delta : '';
      if (!delta) return state;
      return {
        ...state,
        status: RUN_STATUS.STREAMING,
        output: `${state.output || ''}${delta}`,
      };
    }
    case 'meta':
      return {
        ...state,
        meta: {
          ...state.meta,
          ...normalizeRunMeta(event.meta),
        },
      };
    case 'complete':
      return {
        ...state,
        status: RUN_STATUS.COMPLETED,
      };
    case 'fail':
      return {
        ...state,
        status: RUN_STATUS.FAILED,
        error: typeof event.error === 'string' ? event.error : 'Run failed',
      };
    case 'stop':
      return {
        ...state,
        status: RUN_STATUS.STOPPED,
      };
    case 'reset':
      return createRunState();
    default:
      return state;
  }
}

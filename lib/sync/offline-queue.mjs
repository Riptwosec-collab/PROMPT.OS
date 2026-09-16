const REQUIRED_FIELDS = ['id', 'operation', 'entityType', 'entityId', 'baseRevision', 'createdAt'];

function cloneMutation(mutation) {
  return {
    ...mutation,
    payload: mutation?.payload && typeof mutation.payload === 'object'
      ? structuredCloneSafe(mutation.payload)
      : mutation?.payload,
  };
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function enqueueMutation(queue = [], mutation = {}) {
  const missing = REQUIRED_FIELDS.filter((field) => mutation?.[field] === undefined || mutation?.[field] === null || mutation?.[field] === '');
  if (missing.length) throw new Error(`Invalid mutation: missing ${missing.join(', ')}`);

  const next = queue.map(cloneMutation);
  const existingIndex = next.findIndex((item) => String(item.id) === String(mutation.id));
  const record = cloneMutation(mutation);
  if (existingIndex >= 0) next[existingIndex] = record;
  else next.push(record);
  return next;
}

export function markMutationApplied(queue = [], id) {
  return queue
    .filter((mutation) => String(mutation.id) !== String(id))
    .map(cloneMutation);
}

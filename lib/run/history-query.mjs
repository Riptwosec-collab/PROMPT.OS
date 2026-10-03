function numberOrNull(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value) {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : null;
}

export function normalizeHistoryQuery(input = {}) {
  const statuses = Array.isArray(input.statuses)
    ? [...new Set(input.statuses.map((item) => String(item).trim()).filter(Boolean))]
    : [];
  const requestedLimit = Number(input.limit);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.trunc(requestedLimit))) : 25;
  return {
    search: String(input.search ?? '').trim().toLocaleLowerCase(),
    statuses,
    promptId: stringOrNull(input.promptId),
    provider: stringOrNull(input.provider),
    model: stringOrNull(input.model),
    from: numberOrNull(input.from),
    to: numberOrNull(input.to),
    saved: typeof input.saved === 'boolean' ? input.saved : null,
    limit,
    cursor: stringOrNull(input.cursor),
  };
}

export function historyRecordMatches(run = {}, query = {}) {
  if (query.statuses?.length && !query.statuses.includes(String(run.status || ''))) return false;
  if (query.promptId && String(run.promptId ?? '') !== query.promptId) return false;
  if (query.provider && String(run.provider ?? '') !== query.provider) return false;
  if (query.model && String(run.model ?? '') !== query.model) return false;
  const createdAt = Number(run.createdAt || 0);
  if (query.from != null && createdAt < query.from) return false;
  if (query.to != null && createdAt > query.to) return false;
  if (query.saved != null && Boolean(run.savedResultId || run.saved) !== query.saved) return false;
  if (query.search) {
    const haystack = [run.promptTitle, run.promptId, run.renderedPrompt, run.output]
      .map((value) => String(value ?? '').toLocaleLowerCase())
      .join('\n');
    if (!haystack.includes(query.search)) return false;
  }
  return true;
}

export function decodePageCursor(cursor) {
  const value = Number(cursor);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

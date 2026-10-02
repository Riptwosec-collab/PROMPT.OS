const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function normalizedText(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeHistoryQuery(input = {}) {
  const statuses = Array.isArray(input.statuses)
    ? [...new Set(input.statuses.map(normalizedText).filter(Boolean))]
    : input.status ? [normalizedText(input.status)].filter(Boolean) : [];
  const requestedLimit = Number(input.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.trunc(requestedLimit)))
    : DEFAULT_LIMIT;

  return {
    search: normalizedText(input.search),
    statuses,
    promptId: input.promptId == null || input.promptId === '' ? null : String(input.promptId),
    provider: input.provider == null || input.provider === '' ? null : normalizedText(input.provider),
    model: input.model == null || input.model === '' ? null : normalizedText(input.model),
    from: finiteOrNull(input.from),
    to: finiteOrNull(input.to),
    saved: typeof input.saved === 'boolean' ? input.saved : null,
    limit,
    cursor: input.cursor && Number.isFinite(Number(input.cursor.createdAt)) && input.cursor.id != null
      ? { createdAt: Number(input.cursor.createdAt), id: String(input.cursor.id) }
      : null,
  };
}

export function matchesHistoryQuery(run = {}, query = {}, context = {}) {
  if (query.statuses?.length && !query.statuses.includes(normalizedText(run.status))) return false;
  if (query.promptId && String(run.promptId ?? '') !== query.promptId) return false;
  if (query.provider && normalizedText(run.provider) !== query.provider) return false;
  if (query.model && normalizedText(run.model) !== query.model) return false;
  const createdAt = Number(run.createdAt || run.startedAt || 0);
  if (query.from != null && createdAt < query.from) return false;
  if (query.to != null && createdAt > query.to) return false;

  const saved = context.savedRunIds?.has?.(run.id) ?? Boolean(run.saved);
  if (query.saved != null && saved !== query.saved) return false;

  if (query.search) {
    const linkedNames = context.resultNamesByRun?.get?.(run.id) || [];
    const haystack = [
      run.promptId, run.promptTitle, run.promptSnapshot, run.renderedPrompt,
      run.output, run.error, run.provider, run.model, ...linkedNames,
    ].map(normalizedText).join('\n');
    if (!haystack.includes(query.search)) return false;
  }
  return true;
}

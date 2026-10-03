function numberOrNull(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value) {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : null;
}

export function normalizeResultQuery(input = {}) {
  const requestedLimit = Number(input.limit);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.trunc(requestedLimit))) : 25;
  return {
    search: String(input.search ?? '').trim().toLocaleLowerCase(),
    pinned: typeof input.pinned === 'boolean' ? input.pinned : null,
    promptId: stringOrNull(input.promptId),
    from: numberOrNull(input.from),
    to: numberOrNull(input.to),
    limit,
    cursor: stringOrNull(input.cursor),
  };
}

export function resultRecordMatches(result = {}, query = {}) {
  if (query.pinned != null && Boolean(result.pinned) !== query.pinned) return false;
  const promptId = result.metadataSnapshot?.promptId ?? result.promptId ?? null;
  if (query.promptId && String(promptId ?? '') !== query.promptId) return false;
  const createdAt = Number(result.createdAt || 0);
  if (query.from != null && createdAt < query.from) return false;
  if (query.to != null && createdAt > query.to) return false;
  if (query.search) {
    const haystack = [
      result.name,
      result.promptSnapshot,
      result.outputSnapshot,
      result.metadataSnapshot?.renderedPrompt,
      ...(Array.isArray(result.tags) ? result.tags : []),
      result.notes,
    ].map((value) => String(value ?? '').toLocaleLowerCase()).join('\n');
    if (!haystack.includes(query.search)) return false;
  }
  return true;
}

export function decodeResultCursor(cursor) {
  const value = Number(cursor);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

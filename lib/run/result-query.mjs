const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function normalizedText(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}

export function normalizeResultQuery(input = {}) {
  const requestedLimit = Number(input.limit);
  return {
    search: normalizedText(input.search),
    pinned: typeof input.pinned === 'boolean' ? input.pinned : null,
    sourceRunId: input.sourceRunId == null || input.sourceRunId === '' ? null : String(input.sourceRunId),
    limit: Number.isFinite(requestedLimit) ? Math.max(1, Math.min(MAX_LIMIT, Math.trunc(requestedLimit))) : DEFAULT_LIMIT,
    cursor: input.cursor && Number.isFinite(Number(input.cursor.createdAt)) && input.cursor.resultId != null
      ? { createdAt: Number(input.cursor.createdAt), resultId: String(input.cursor.resultId) }
      : null,
  };
}

export function matchesResultQuery(result = {}, query = {}) {
  if (query.pinned != null && Boolean(result.pinned) !== query.pinned) return false;
  if (query.sourceRunId && String(result.sourceRunId ?? '') !== query.sourceRunId) return false;
  if (!query.search) return true;
  const haystack = [
    result.name,
    result.notes,
    ...(Array.isArray(result.tags) ? result.tags : []),
    result.promptSnapshot,
    result.outputSnapshot,
    result.metadataSnapshot?.renderedPrompt,
    result.metadataSnapshot?.provider,
    result.metadataSnapshot?.model,
  ].map(normalizedText).join('\n');
  return haystack.includes(query.search);
}

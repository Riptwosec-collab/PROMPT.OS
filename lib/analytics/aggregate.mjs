function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function time(value) {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyBucket() {
  return { runs: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0, errors: 0 };
}

function addToBucket(bucket, event) {
  bucket.runs += 1;
  bucket.inputTokens += num(event.inputTokens);
  bucket.outputTokens += num(event.outputTokens);
  bucket.estimatedCost += num(event.estimatedCost);
  if (String(event.status || '').toLowerCase() === 'failed') bucket.errors += 1;
}

export function aggregateUsage(events = [], { from, to } = {}) {
  const fromMs = from == null ? Number.NEGATIVE_INFINITY : time(from);
  const toMs = to == null ? Number.POSITIVE_INFINITY : time(to);
  const selected = (Array.isArray(events) ? events : []).filter((event) => {
    const eventMs = time(event?.createdAt);
    return eventMs >= fromMs && eventMs <= toMs;
  });

  const totals = emptyBucket();
  let totalLatency = 0;
  const byProvider = {};
  const byModel = {};
  const byPrompt = {};
  const byDay = {};

  selected.forEach((event) => {
    addToBucket(totals, event);
    totalLatency += num(event.latencyMs);

    const provider = String(event.provider || 'Unknown');
    const model = String(event.model || 'Unknown');
    const prompt = String(event.promptId || 'unassigned');
    const day = new Date(event.createdAt).toISOString().slice(0, 10);

    byProvider[provider] ||= emptyBucket();
    byModel[model] ||= emptyBucket();
    byPrompt[prompt] ||= emptyBucket();
    byDay[day] ||= emptyBucket();

    addToBucket(byProvider[provider], event);
    addToBucket(byModel[model], event);
    addToBucket(byPrompt[prompt], event);
    addToBucket(byDay[day], event);
  });

  return {
    runs: totals.runs,
    inputTokens: totals.inputTokens,
    outputTokens: totals.outputTokens,
    estimatedCost: totals.estimatedCost,
    averageLatencyMs: totals.runs ? totalLatency / totals.runs : 0,
    errorRate: totals.runs ? totals.errors / totals.runs : 0,
    byProvider,
    byModel,
    byPrompt,
    byDay,
  };
}

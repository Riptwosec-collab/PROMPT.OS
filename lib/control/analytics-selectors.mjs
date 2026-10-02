function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function dateKey(value) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().slice(0, 10);
}

export function countRunsByDate(runs = []) {
  const counts = new Map();
  for (const run of runs) {
    const key = dateKey(run?.createdAt ?? run?.startedAt);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

export function statusBreakdown(runs = []) {
  const result = {};
  for (const run of runs) {
    const status = String(run?.status || '').trim();
    if (!status) continue;
    result[status] = (result[status] || 0) + 1;
  }
  return result;
}

export function mostUsedPrompts(runs = [], { limit = 5 } = {}) {
  const counts = new Map();
  const firstSeen = new Map();
  runs.forEach((run, index) => {
    const promptId = run?.promptId == null ? '' : String(run.promptId);
    if (!promptId) return;
    counts.set(promptId, (counts.get(promptId) || 0) + 1);
    if (!firstSeen.has(promptId)) firstSeen.set(promptId, index);
  });
  const bounded = Math.max(0, Math.min(Number(limit) || 5, 100));
  return [...counts.entries()]
    .sort(([a, countA], [b, countB]) => countB - countA || firstSeen.get(a) - firstSeen.get(b) || a.localeCompare(b))
    .slice(0, bounded)
    .map(([promptId, count]) => ({ promptId, count }));
}

export function averageLatency(runs = []) {
  const values = runs.map((run) => finite(run?.latencyMs)).filter((value) => value != null && value >= 0);
  if (!values.length) return null;
  return { averageMs: values.reduce((sum, value) => sum + value, 0) / values.length, records: values.length };
}

export function tokenUsage(runs = []) {
  let inputTokens = 0;
  let outputTokens = 0;
  let records = 0;
  for (const run of runs) {
    const input = finite(run?.inputTokens);
    const output = finite(run?.outputTokens);
    if (input == null && output == null) continue;
    if (input != null && input >= 0) inputTokens += input;
    if (output != null && output >= 0) outputTokens += output;
    records += 1;
  }
  if (!records) return null;
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, records };
}

export function savedResultRate(runs = [], results = []) {
  const runIds = new Set(runs.map((run) => run?.id).filter(Boolean).map(String));
  const saved = new Set(results.map((result) => result?.sourceRunId).filter(Boolean).map(String).filter((id) => runIds.has(id)));
  const totalRuns = runIds.size;
  return { savedRuns: saved.size, totalRuns, rate: totalRuns ? saved.size / totalRuns : null };
}

export function failureBreakdown(runs = []) {
  const result = { failed: 0, interrupted: 0, stopped: 0, codes: {} };
  for (const run of runs) {
    const status = String(run?.status || '');
    if (status === 'failed') result.failed += 1;
    else if (status === 'interrupted') result.interrupted += 1;
    else if (status === 'stopped') result.stopped += 1;
    if (!['failed', 'interrupted', 'stopped'].includes(status)) continue;
    const code = typeof run?.error === 'object' ? run.error?.code : null;
    if (code) result.codes[String(code)] = (result.codes[String(code)] || 0) + 1;
  }
  return result;
}

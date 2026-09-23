export const RUN_LEASE_HEARTBEAT_MS = 5000;
export const RUN_LEASE_STALE_MS = 20000;

export function isLeaseStale({ heartbeatAt, now = Date.now(), staleMs = RUN_LEASE_STALE_MS } = {}) {
  if (!Number.isFinite(heartbeatAt) || !Number.isFinite(now) || !Number.isFinite(staleMs) || staleMs < 0) return true;
  return (now - heartbeatAt) > staleMs;
}

export async function recoverInterruptedRuns({ repository, now = Date.now, staleMs = RUN_LEASE_STALE_MS } = {}) {
  if (!repository?.recoverableActive || !repository?.finalize) throw new Error('Run repository is required');
  const at = now();
  const activeRuns = await repository.recoverableActive();
  const recovered = [];

  for (const run of activeRuns) {
    if (!isLeaseStale({ heartbeatAt: run.heartbeatAt, now: at, staleMs })) continue;
    const interrupted = await repository.finalize(run.id, {
      status: 'interrupted',
      output: String(run.output ?? ''),
      completedAt: at,
      error: run.error || null,
      meta: run,
    });
    recovered.push(interrupted);
  }

  return recovered;
}

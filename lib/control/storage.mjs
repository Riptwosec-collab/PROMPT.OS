const SYNC_STATES = ['local', 'pending', 'syncing', 'synced', 'conflict', 'sync_error'];

export async function measureStorage(storageManager = globalThis.navigator?.storage ?? null) {
  if (!storageManager || typeof storageManager.estimate !== 'function') return { available: false, usage: null, quota: null };
  try {
    const estimate = await storageManager.estimate();
    const usage = Number(estimate?.usage);
    const quota = Number(estimate?.quota);
    if (!Number.isFinite(usage) || !Number.isFinite(quota)) return { available: false, usage: null, quota: null };
    return { available: true, usage, quota };
  } catch {
    return { available: false, usage: null, quota: null };
  }
}

export function summarizeSync(items = []) {
  const result = Object.fromEntries(SYNC_STATES.map((state) => [state, 0]));
  let total = 0;
  for (const item of items) {
    const state = String(item?.state || '');
    if (!Object.prototype.hasOwnProperty.call(result, state)) continue;
    result[state] += 1;
    total += 1;
  }
  return { ...result, total };
}

export function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unavailable';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let next = bytes / 1024;
  let index = 0;
  while (next >= 1024 && index < units.length - 1) { next /= 1024; index += 1; }
  return `${next >= 10 ? next.toFixed(0) : next.toFixed(1)} ${units[index]}`;
}

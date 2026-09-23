export const CHECKPOINT_INTERVAL_MS = 750;
export const CHECKPOINT_CHAR_THRESHOLD = 4096;

export function shouldCheckpoint({
  lastCheckpointAt,
  now,
  persistedLength,
  outputLength,
} = {}) {
  if (![lastCheckpointAt, now, persistedLength, outputLength].every(Number.isFinite)) return false;
  if (outputLength < persistedLength) return false;
  return (now - lastCheckpointAt) >= CHECKPOINT_INTERVAL_MS
    || (outputLength - persistedLength) >= CHECKPOINT_CHAR_THRESHOLD;
}

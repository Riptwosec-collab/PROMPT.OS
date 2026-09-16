function nonnegative(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function evaluateBudget({
  spent = 0,
  limit = 0,
  warningPercent = 80,
  hardLimitEnabled = false,
  nextEstimatedCost = 0,
} = {}) {
  const current = nonnegative(spent);
  const next = nonnegative(nextEstimatedCost);
  const projected = current + next;
  const cap = nonnegative(limit);

  if (cap <= 0) {
    return { state: 'unconfigured', projected, shouldWarn: false, shouldBlock: false };
  }

  const warning = Math.min(100, Math.max(0, nonnegative(warningPercent)));
  const warningThreshold = cap * (warning / 100);
  const shouldWarn = current >= warningThreshold || projected >= warningThreshold;
  const shouldBlock = Boolean(hardLimitEnabled) && projected > cap;

  let state = 'ok';
  if (shouldBlock) state = 'blocked';
  else if (projected > cap) state = 'over';
  else if (shouldWarn) state = 'warning';

  return { state, projected, shouldWarn, shouldBlock };
}

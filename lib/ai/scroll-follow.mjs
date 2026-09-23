export function shouldFollowLatest({
  scrollTop,
  clientHeight,
  scrollHeight,
  threshold = 96,
} = {}) {
  if (![scrollTop, clientHeight, scrollHeight].every(Number.isFinite)) return false;
  const safeThreshold = Number.isFinite(threshold) && threshold >= 0 ? threshold : 96;
  return scrollHeight - (scrollTop + clientHeight) <= safeThreshold;
}

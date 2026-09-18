export function promptLayoutId(id) {
  return `prompt-card-${String(id)}`;
}

export function getPromptTransitionMode({
  enabled = false,
  reducedMotion = false,
  sourceAvailable = false,
} = {}) {
  return enabled && !reducedMotion && sourceAvailable ? 'shared' : 'fade';
}

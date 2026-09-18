export function promptLayoutId(id) {
  return `prompt-card-${String(id)}`;
}

export function promptTitleLayoutId(id) {
  return `${promptLayoutId(id)}-title`;
}

export function promptGlyphLayoutId(id) {
  return `${promptLayoutId(id)}-glyph`;
}

export function getPromptTransitionMode({
  enabled = false,
  reducedMotion = false,
  sourceAvailable = false,
} = {}) {
  return enabled && !reducedMotion && sourceAvailable ? 'shared' : 'fade';
}

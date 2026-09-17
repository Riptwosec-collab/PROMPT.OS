function asPromptArray(prompts) {
  return Array.isArray(prompts) ? prompts : [];
}

function isVisible(prompt) {
  return !prompt?.deletedAt;
}

export function selectVisiblePrompts(prompts) {
  return asPromptArray(prompts).filter(isVisible);
}

export function selectPromptById(prompts, id, { includeDeleted = false } = {}) {
  const match = asPromptArray(prompts).find((prompt) => prompt?.id === id);
  if (!match) return null;
  if (!includeDeleted && !isVisible(match)) return null;
  return match;
}

export function selectFavoritePrompts(prompts) {
  return selectVisiblePrompts(prompts).filter((prompt) => prompt?.favorite === true);
}

export function selectPinnedPrompts(prompts) {
  return selectVisiblePrompts(prompts).filter((prompt) => prompt?.pinned === true);
}

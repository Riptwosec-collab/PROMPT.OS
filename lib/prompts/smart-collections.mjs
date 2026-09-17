function activePrompts(prompts = []) {
  return (Array.isArray(prompts) ? prompts : []).filter((prompt) => !prompt?.deletedAt);
}

function byDateDesc(field) {
  return (a, b) => {
    const av = Date.parse(a?.[field] || '') || 0;
    const bv = Date.parse(b?.[field] || '') || 0;
    if (bv !== av) return bv - av;
    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
  };
}

function hasVariables(prompt) {
  return Object.keys(prompt?.variableConfig || {}).length > 0 || Object.keys(prompt?.variables || {}).length > 0;
}

export function buildSmartCollections(prompts = [], now = new Date()) {
  const active = activePrompts(prompts);
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const recentCutoff = Number.isFinite(nowMs) ? nowMs - (7 * 24 * 60 * 60 * 1000) : 0;

  const favorites = active.filter((prompt) => prompt.favorite === true);
  const pinned = active.filter((prompt) => prompt.pinned === true);
  const recentlyUsed = active
    .filter((prompt) => Boolean(prompt.lastUsedAt))
    .slice()
    .sort(byDateDesc('lastUsedAt'));
  const mostUsed = active
    .slice()
    .sort((a, b) => {
      const bScore = Number(b.runs || 0) + Number(b.copyCount || 0);
      const aScore = Number(a.runs || 0) + Number(a.copyCount || 0);
      if (bScore !== aScore) return bScore - aScore;
      return String(a.id ?? '').localeCompare(String(b.id ?? ''));
    });
  const recentlyAdded = active
    .filter((prompt) => {
      const created = Date.parse(prompt.createdAt || '');
      return Number.isFinite(created) && created >= recentCutoff && created <= nowMs;
    })
    .slice()
    .sort(byDateDesc('createdAt'));
  const advanced = active.filter((prompt) => String(prompt.difficulty || '').toLowerCase() === 'advanced');
  const withVariables = active.filter(hasVariables);
  const quickPrompts = active.filter((prompt) => String(prompt.prompt || '').length <= 500 && !hasVariables(prompt));

  return {
    favorites,
    pinned,
    recentlyUsed,
    mostUsed,
    recentlyAdded,
    advanced,
    hasVariables: withVariables,
    quickPrompts,
  };
}

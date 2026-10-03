function values(value) {
  return Array.isArray(value) ? value.map(String) : [];
}

function sourceKey(prompt = {}) {
  return String(prompt.sourcePack || prompt.sourceType || prompt.provenance?.pack || '');
}

export function findRelatedPrompts(prompt, catalog = [], { limit = 4 } = {}) {
  if (!prompt?.id) return [];
  const sourceTags = new Set(values(prompt.tags));
  const source = sourceKey(prompt);
  const category = String(prompt.category || '');
  const boundedLimit = Math.max(0, Math.min(Number(limit) || 4, 20));

  return catalog
    .filter((candidate) => candidate && String(candidate.id) !== String(prompt.id))
    .map((candidate, index) => {
      const sharedTags = values(candidate.tags).filter((tag) => sourceTags.has(tag)).length;
      const score = (category && String(candidate.category || '') === category ? 3 : 0)
        + (source && sourceKey(candidate) === source ? 2 : 0)
        + sharedTags;
      return { candidate, score, index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index || String(a.candidate.id).localeCompare(String(b.candidate.id)))
    .slice(0, boundedLimit)
    .map((item) => item.candidate);
}

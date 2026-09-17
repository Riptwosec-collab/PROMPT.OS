import { buildPromptSearchDocument, normalizeSearchText, tokenizeSearchText } from './prompt-index.mjs';

function isRecent(prompt) {
  return Boolean(prompt?.lastUsedAt);
}

function hasVariables(prompt) {
  const config = prompt?.variableConfig;
  return Boolean(config && typeof config === 'object' && Object.keys(config).length > 0);
}

function matchesFilters(prompt, filters = {}) {
  if (filters.favorite === true && prompt?.favorite !== true) return false;
  if (filters.recent === true && !isRecent(prompt)) return false;
  if (filters.category && prompt?.category !== filters.category) return false;
  if (filters.difficulty && prompt?.difficulty !== filters.difficulty) return false;
  if (filters.source && prompt?.sourceType !== filters.source) return false;
  if (filters.hasVariables === true && !hasVariables(prompt)) return false;
  if (filters.hasVariables === false && hasVariables(prompt)) return false;
  return true;
}

function scoreField(field, queryTokens, normalizedQuery) {
  if (!field?.normalized) return 0;
  let score = 0;

  if (normalizedQuery && field.normalized === normalizedQuery) score += field.weight * 6;
  else if (normalizedQuery && field.normalized.includes(normalizedQuery)) score += field.weight * 3;

  for (const token of queryTokens) {
    if (!token) continue;
    if (field.tokens.includes(token)) score += field.weight * 2;
    else if (field.normalized.includes(token)) score += field.weight;
  }

  return score;
}

function scoreDocument(document, queryTokens, normalizedQuery) {
  return document.fields.reduce(
    (sum, field) => sum + scoreField(field, queryTokens, normalizedQuery),
    0,
  );
}

export function searchPrompts(prompts, query, filters = {}) {
  const source = Array.isArray(prompts) ? prompts : [];
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenizeSearchText(query);

  return source
    .map((prompt, index) => ({ prompt, index }))
    .filter(({ prompt }) => !prompt?.deletedAt && matchesFilters(prompt, filters))
    .map(({ prompt, index }) => {
      const document = buildPromptSearchDocument(prompt);
      return {
        ...prompt,
        __score: normalizedQuery ? scoreDocument(document, queryTokens, normalizedQuery) : 0,
        __index: index,
      };
    })
    .filter((item) => !normalizedQuery || item.__score > 0)
    .sort((a, b) => {
      if (b.__score !== a.__score) return b.__score - a.__score;
      if (filters.recent) {
        const aTime = Date.parse(a.lastUsedAt || '') || 0;
        const bTime = Date.parse(b.lastUsedAt || '') || 0;
        if (bTime !== aTime) return bTime - aTime;
      }
      return a.__index - b.__index;
    })
    .map(({ __score, __index, ...prompt }) => prompt);
}

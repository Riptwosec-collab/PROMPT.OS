const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function shouldHandleShortcut(eventLike = {}) {
  if (eventLike.ctrlKey || eventLike.metaKey) return true;
  const target = eventLike.target || {};
  const tagName = String(target.tagName || '').toUpperCase();
  if (target.isContentEditable) return false;
  return !EDITABLE_TAGS.has(tagName);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function fuzzyContains(query, text) {
  let index = 0;
  for (const char of text) {
    if (char === query[index]) index += 1;
    if (index === query.length) return true;
  }
  return query.length === 0;
}

function scoreItem(query, item) {
  const title = normalizeText(item.title);
  const keywords = (item.keywords || []).map(normalizeText);
  if (!query) return 1;
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(query)) return 60;
  if (keywords.some((keyword) => keyword === query)) return 60;
  if (keywords.some((keyword) => keyword.includes(query))) return 50;
  if (fuzzyContains(query, `${title} ${keywords.join(' ')}`)) return 20;
  return 0;
}

export function rankCommandItems(query, items = []) {
  const normalizedQuery = normalizeText(query);
  return items
    .map((item, index) => ({ item, index, score: scoreItem(normalizedQuery, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.item.kind !== b.item.kind) return a.item.kind === 'command' ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

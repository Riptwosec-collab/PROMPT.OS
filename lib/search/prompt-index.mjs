export const PROMPT_SEARCH_FIELD_WEIGHTS = Object.freeze({
  displayTitle: 10,
  displayTitleTh: 10,
  title: 10,
  titleTh: 10,
  name: 9,
  tags: 8,
  category: 7,
  categoryTh: 7,
  subcategory: 7,
  subcategoryTh: 7,
  description: 5,
  descriptionTh: 5,
  variables: 4,
  variableConfig: 4,
  prompt: 2,
  usageGuide: 1,
  usageGuideEn: 1,
  usageGuideTh: 1,
});

export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function tokenizeSearchText(value) {
  const normalized = normalizeSearchText(value);
  return normalized ? normalized.split(' ') : [];
}

function flattenSearchValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(flattenSearchValue).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .flatMap(([key, item]) => [key, flattenSearchValue(item)])
      .filter(Boolean)
      .join(' ');
  }
  return String(value);
}

export function buildPromptSearchDocument(prompt = {}) {
  const fields = Object.entries(PROMPT_SEARCH_FIELD_WEIGHTS)
    .map(([key, weight]) => {
      const text = flattenSearchValue(prompt?.[key]);
      return {
        key,
        weight,
        text,
        normalized: normalizeSearchText(text),
        tokens: tokenizeSearchText(text),
      };
    })
    .filter((field) => field.normalized);

  return {
    id: prompt?.id,
    prompt,
    fields,
  };
}

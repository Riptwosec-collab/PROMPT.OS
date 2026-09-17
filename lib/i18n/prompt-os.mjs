import { normalizeLanguage } from './runtime.mjs';
import { translateCatalogThai as translateBaseCatalogThai } from './catalog-th.mjs';
import { RESEARCHED_PROMPT_LIBRARY } from '../prompts/catalog/researched.mjs';

const RESEARCHED_THAI_TEXT = new Map();

for (const prompt of RESEARCHED_PROMPT_LIBRARY) {
  if (prompt.displayTitle && prompt.displayTitleTh) RESEARCHED_THAI_TEXT.set(prompt.displayTitle, prompt.displayTitleTh);
  if (prompt.description && prompt.descriptionTh) RESEARCHED_THAI_TEXT.set(prompt.description, prompt.descriptionTh);
  if (prompt.category && prompt.categoryTh) RESEARCHED_THAI_TEXT.set(prompt.category, prompt.categoryTh);
  if (prompt.name && prompt.displayTitleTh) RESEARCHED_THAI_TEXT.set(prompt.name, prompt.displayTitleTh);

  for (const [name, config] of Object.entries(prompt.variableConfig || {})) {
    if (!config?.labelTh) continue;
    RESEARCHED_THAI_TEXT.set(String(name).toUpperCase(), config.labelTh);
    if (config.label) RESEARCHED_THAI_TEXT.set(config.label, config.labelTh);
  }
}

export function translateCatalogThai(language, text, params = {}) {
  const lang = normalizeLanguage(language);
  const source = String(text ?? '');

  if (lang === 'th' && RESEARCHED_THAI_TEXT.has(source)) {
    return RESEARCHED_THAI_TEXT.get(source);
  }

  return translateBaseCatalogThai(lang, source, params);
}

export function getResearchedThaiDictionary() {
  return new Map(RESEARCHED_THAI_TEXT);
}

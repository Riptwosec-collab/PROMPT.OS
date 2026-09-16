import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { translateCatalogThai } from '../lib/i18n/prompt-os.mjs';

test('runtime translator renders researched prompt title, description, category, and variable labels in Thai', () => {
  const prompt = AI_PROMPT_LIBRARY.find((item) => item.name === 'NETWORK_TROUBLESHOOTER');
  assert.ok(prompt);
  assert.equal(translateCatalogThai('th', prompt.displayTitle), prompt.displayTitleTh);
  assert.equal(translateCatalogThai('th', prompt.description), prompt.descriptionTh);
  assert.equal(translateCatalogThai('th', prompt.category), prompt.categoryTh);
  assert.equal(translateCatalogThai('th', 'INCIDENT'), prompt.variableConfig.incident.labelTh);
  assert.equal(translateCatalogThai('th', 'ENVIRONMENT'), prompt.variableConfig.environment.labelTh);

  assert.equal(translateCatalogThai('en', prompt.displayTitle), prompt.displayTitle);
  assert.equal(translateCatalogThai('en', prompt.description), prompt.description);
});

test('LanguageRuntime uses the researched-prompt-aware translator', () => {
  const source = fs.readFileSync(new URL('../components/LanguageRuntime.jsx', import.meta.url), 'utf8');
  assert.match(source, /lib\/i18n\/prompt-os\.mjs/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { translateCatalogThai } from '../lib/i18n/catalog-th.mjs';

const V5_VISIBLE_LABELS = [
  'HOME', 'LIBRARY', 'WORKSPACES', 'EVALUATION LAB', 'AI IMPROVE', 'ANALYTICS',
  'CLOUD & BACKUPS', 'TRASH', 'SETTINGS', 'V5 CONTROL PLANE', 'ACTIVE_MODULE', 'COMMAND',
  'CLOUD LIVE', 'SYNCING', 'OFFLINE', 'SYNC ERROR', 'RECOVERING', 'NOT SYNCED',
  'V5 PREVIEW', 'V5 MODULE',
  'This module is staged behind the V5 rollout plan. The existing prompt library remains available from Library while this module is completed.',
  'English', 'Thai', 'Multi-language',
];

const V5_CORE_EXPERIENCE_LABELS = [
  'Prompt Library', 'Search prompts', 'Favorites', 'Recent', 'Has Variables',
  'Category', 'Difficulty', 'Source', 'All', 'Yes', 'No', 'Overview', 'Inputs', 'Preview',
  'Prompt Variables', 'Required fields are marked with *.', 'Rendered Prompt', 'Prompt Health',
  'LOCAL SCORE', 'Structure', 'Context', 'Variables', 'Constraints', 'Output Format', 'Reliability',
  'Findings', 'No variables required', 'optional', 'Required',
  'Execution is not enabled for this V5 preview yet.', 'Run Prompt', 'Improve', 'Copy', 'Favorite', 'Pin',
  'Prompt Packs', 'Curated workflows', 'Open', 'Add all to Workspace', 'Workspace', 'All Prompts',
  'Smart Collections', 'Pinned', 'Recently Used', 'Most Used', 'Recently Added', 'Folders',
  'No folders yet', 'Continue Working', 'No matching prompts',
];

const INTENTIONALLY_PRESERVED_TECHNICAL_TOKENS = new Set([
  'API', 'REST', 'SQL', 'JSON', 'NLP', 'SEO',
]);

const hasThai = (value) => /[ก-๙]/.test(String(value || ''));

test('all visible V5 shell labels have a Thai rendering', () => {
  const missing = V5_VISIBLE_LABELS.filter((text) => translateCatalogThai('th', text) === text);
  assert.deepEqual(missing, [], `Missing V5 Thai translations: ${missing.join(', ')}`);
});

test('all V5 core experience labels have a Thai rendering', () => {
  const missing = V5_CORE_EXPERIENCE_LABELS.filter((text) => translateCatalogThai('th', text) === text);
  assert.deepEqual(missing, [], `Missing V5 core Thai translations: ${missing.join(', ')}`);
});

test('dynamic V5 status text renders in Thai', () => {
  assert.equal(translateCatalogThai('th', 'REV 185'), 'รีวิชัน 185');
  assert.equal(translateCatalogThai('th', '3 PENDING'), 'รอซิงก์ 3 รายการ');
  assert.equal(translateCatalogThai('th', 'SYNCED 8s AGO'), 'ซิงก์แล้วเมื่อ 8 วินาทีก่อน');
});

test('standard technical acronyms stay recognizable in Thai mode', () => {
  for (const token of INTENTIONALLY_PRESERVED_TECHNICAL_TOKENS) {
    assert.equal(translateCatalogThai('th', token), token);
  }
});

test('the original 30 built-in prompt cards keep dictionary-backed Thai rendering', () => {
  const legacyPrompts = AI_PROMPT_LIBRARY.slice(0, 30);
  assert.equal(legacyPrompts.length, 30);

  const missing = [];
  for (const prompt of legacyPrompts) {
    for (const field of ['displayTitle', 'description', 'outputFormat']) {
      const source = prompt[field];
      const translated = translateCatalogThai('th', source);
      if (!source || translated === source) missing.push(`${prompt.name}.${field}: ${source}`);
    }

    for (const tag of prompt.tags || []) {
      if (INTENTIONALLY_PRESERVED_TECHNICAL_TOKENS.has(tag)) continue;
      if (translateCatalogThai('th', tag) === tag) missing.push(`${prompt.name}.tag: ${tag}`);
    }

    for (const variableName of Object.keys(prompt.variables || {})) {
      const label = variableName.toUpperCase();
      if (translateCatalogThai('th', label) === label) missing.push(`${prompt.name}.variable: ${label}`);
    }
  }

  assert.deepEqual(missing, [], `Missing prompt Thai translations:\n${missing.join('\n')}`);
});

test('the 50 researched prompts carry direct Thai title, description, usage, category, and variable labels', () => {
  assert.equal(AI_PROMPT_LIBRARY.length, 100);
  const researchedPrompts = AI_PROMPT_LIBRARY.slice(30, 80);
  assert.equal(researchedPrompts.length, 50);

  const missing = [];
  for (const prompt of researchedPrompts) {
    if (!hasThai(prompt.displayTitleTh)) missing.push(`${prompt.name}.displayTitleTh`);
    if (!hasThai(prompt.descriptionTh)) missing.push(`${prompt.name}.descriptionTh`);
    if (!hasThai(prompt.usageGuideTh)) missing.push(`${prompt.name}.usageGuideTh`);
    if (!prompt.categoryTh) missing.push(`${prompt.name}.categoryTh`);

    for (const [name, config] of Object.entries(prompt.variableConfig || {})) {
      if (!config.labelTh) missing.push(`${prompt.name}.variableConfig.${name}.labelTh`);
    }
  }

  assert.deepEqual(missing, [], `Missing researched prompt Thai metadata:\n${missing.join('\n')}`);
});

test('runtime UI uses the final catalog-aware translation layer', () => {
  const source = fs.readFileSync(new URL('../components/LanguageRuntime.jsx', import.meta.url), 'utf8');
  assert.match(source, /translateCatalogThai/);
  assert.match(source, /language === 'th' \? 'ตัวเลือกภาษา'/);
});

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

test('all visible V5 shell labels have a Thai rendering', () => {
  const missing = V5_VISIBLE_LABELS.filter((text) => translateCatalogThai('th', text) === text);
  assert.deepEqual(missing, [], `Missing V5 Thai translations: ${missing.join(', ')}`);
});

test('dynamic V5 status text renders in Thai', () => {
  assert.equal(translateCatalogThai('th', 'REV 185'), 'รีวิชัน 185');
  assert.equal(translateCatalogThai('th', '3 PENDING'), 'รอซิงก์ 3 รายการ');
  assert.equal(translateCatalogThai('th', 'SYNCED 8s AGO'), 'ซิงก์แล้วเมื่อ 8 วินาทีก่อน');
});

test('all 30 built-in prompt cards have Thai title, description, output format, tags, and variable labels', () => {
  assert.equal(AI_PROMPT_LIBRARY.length, 30);

  const missing = [];
  for (const prompt of AI_PROMPT_LIBRARY) {
    for (const field of ['displayTitle', 'description', 'outputFormat']) {
      const source = prompt[field];
      const translated = translateCatalogThai('th', source);
      if (!source || translated === source) missing.push(`${prompt.name}.${field}: ${source}`);
    }

    for (const tag of prompt.tags || []) {
      if (translateCatalogThai('th', tag) === tag) missing.push(`${prompt.name}.tag: ${tag}`);
    }

    for (const variableName of Object.keys(prompt.variables || {})) {
      const label = variableName.toUpperCase();
      if (translateCatalogThai('th', label) === label) missing.push(`${prompt.name}.variable: ${label}`);
    }
  }

  assert.deepEqual(missing, [], `Missing prompt Thai translations:\n${missing.join('\n')}`);
});

test('runtime UI uses the final catalog-aware translation layer', () => {
  const source = fs.readFileSync(new URL('../components/LanguageRuntime.jsx', import.meta.url), 'utf8');
  assert.match(source, /translateCatalogThai/);
  assert.match(source, /language === 'th' \? 'ตัวเลือกภาษา'/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { translateComplete } from '../lib/i18n/complete.mjs';

const V5_VISIBLE_LABELS = [
  'HOME', 'LIBRARY', 'WORKSPACES', 'EVALUATION LAB', 'AI IMPROVE', 'ANALYTICS',
  'CLOUD & BACKUPS', 'TRASH', 'SETTINGS', 'V5 CONTROL PLANE', 'ACTIVE_MODULE', 'COMMAND',
  'CLOUD LIVE', 'SYNCING', 'OFFLINE', 'SYNC ERROR', 'RECOVERING', 'NOT SYNCED',
  'V5 PREVIEW', 'V5 MODULE',
  'This module is staged behind the V5 rollout plan. The existing prompt library remains available from Library while this module is completed.',
];

test('all visible V5 shell labels have a Thai rendering', () => {
  const missing = V5_VISIBLE_LABELS.filter((text) => translateComplete('th', text) === text);
  assert.deepEqual(missing, [], `Missing V5 Thai translations: ${missing.join(', ')}`);
});

test('dynamic V5 status text renders in Thai', () => {
  assert.equal(translateComplete('th', 'REV 185'), 'รีวิชัน 185');
  assert.equal(translateComplete('th', '3 PENDING'), 'รอซิงก์ 3 รายการ');
  assert.equal(translateComplete('th', 'SYNCED 8s AGO'), 'ซิงก์แล้ว 8s AGO');
});

test('all 30 built-in prompt cards have Thai title, description, and output format', () => {
  assert.equal(AI_PROMPT_LIBRARY.length, 30);

  const missing = [];
  for (const prompt of AI_PROMPT_LIBRARY) {
    for (const field of ['displayTitle', 'description', 'outputFormat']) {
      const source = prompt[field];
      const translated = translateComplete('th', source);
      if (!source || translated === source) missing.push(`${prompt.name}.${field}: ${source}`);
    }
  }

  assert.deepEqual(missing, [], `Missing prompt Thai translations:\n${missing.join('\n')}`);
});

test('runtime UI uses the complete translation layer', () => {
  const source = fs.readFileSync(new URL('../components/LanguageRuntime.jsx', import.meta.url), 'utf8');
  assert.match(source, /translateComplete/);
  assert.match(source, /language === 'th' \? 'ตัวเลือกภาษา'/);
});

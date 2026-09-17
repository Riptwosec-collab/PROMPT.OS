import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPromptSearchDocument } from '../lib/search/prompt-index.mjs';
import { searchPrompts } from '../lib/search/prompt-search.mjs';

const prompts = [
  {
    id: 'title-hit',
    name: 'NETWORK_HELPER',
    displayTitle: 'Network DHCP Helper',
    displayTitleTh: 'ผู้ช่วย DHCP เครือข่าย',
    description: 'Troubleshoot connectivity',
    category: 'Networking',
    difficulty: 'advanced',
    sourceType: 'catalog',
    tags: ['DHCP'],
    prompt: 'Inspect leases and bindings.',
    favorite: true,
    lastUsedAt: '2026-09-17T05:00:00.000Z',
    variableConfig: { device: { type: 'text' } },
  },
  {
    id: 'body-hit',
    name: 'GENERAL_HELPER',
    displayTitle: 'General Helper',
    description: 'General troubleshooting',
    category: 'Productivity',
    difficulty: 'basic',
    sourceType: 'user',
    tags: [],
    prompt: 'network dhcp network dhcp network dhcp',
    favorite: false,
    lastUsedAt: null,
    variableConfig: {},
  },
  {
    id: 'thai-hit',
    name: 'THAI_NETWORK',
    displayTitle: 'Thai Network Helper',
    displayTitleTh: 'แก้ปัญหาเครือข่าย',
    descriptionTh: 'ตรวจสอบอินเทอร์เน็ตและเครือข่าย',
    category: 'Networking',
    difficulty: 'intermediate',
    sourceType: 'catalog',
    prompt: 'Analyze the supplied topology.',
    favorite: false,
    lastUsedAt: '2026-09-16T05:00:00.000Z',
    variableConfig: {},
  },
];

test('buildPromptSearchDocument includes bilingual weighted metadata', () => {
  const doc = buildPromptSearchDocument(prompts[0]);
  assert.equal(doc.id, 'title-hit');
  assert.ok(doc.fields.some((field) => field.key === 'displayTitle' && field.weight === 10));
  assert.ok(doc.fields.some((field) => field.key === 'displayTitleTh' && field.weight === 10));
  assert.ok(doc.fields.some((field) => field.key === 'prompt' && field.weight === 2));
});

test('title and Thai metadata matches outrank body-only matches', () => {
  const english = searchPrompts(prompts, 'network dhcp');
  assert.deepEqual(english.slice(0, 2).map((item) => item.id), ['title-hit', 'body-hit']);

  const thai = searchPrompts(prompts, 'เครือข่าย');
  assert.equal(thai[0].id, 'thai-hit');
});

test('search ranking is stable for equal scores', () => {
  const equal = [
    { id: 'a', displayTitle: 'Alpha tool', prompt: '' },
    { id: 'b', displayTitle: 'Alpha tool', prompt: '' },
  ];
  assert.deepEqual(searchPrompts(equal, 'alpha').map((item) => item.id), ['a', 'b']);
});

test('search applies favorite, recent, category, difficulty, source and variable filters', () => {
  assert.deepEqual(searchPrompts(prompts, '', { favorite: true }).map((item) => item.id), ['title-hit']);
  assert.deepEqual(searchPrompts(prompts, '', { recent: true }).map((item) => item.id), ['title-hit', 'thai-hit']);
  assert.deepEqual(searchPrompts(prompts, '', { category: 'Networking' }).map((item) => item.id), ['title-hit', 'thai-hit']);
  assert.deepEqual(searchPrompts(prompts, '', { difficulty: 'advanced' }).map((item) => item.id), ['title-hit']);
  assert.deepEqual(searchPrompts(prompts, '', { source: 'user' }).map((item) => item.id), ['body-hit']);
  assert.deepEqual(searchPrompts(prompts, '', { hasVariables: true }).map((item) => item.id), ['title-hit']);
});

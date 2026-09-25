import test from 'node:test';
import assert from 'node:assert/strict';

async function loadQuality() {
  try {
    return await import('../lib/prompts/quality-validator.mjs');
  } catch {
    return null;
  }
}

async function loadCatalog() {
  try {
    return await import('../lib/prompts/ai-prompt-library.mjs');
  } catch {
    return null;
  }
}

const valid = {
  id: 'ai-lib-test',
  name: 'TEST',
  displayTitle: 'Test Prompt',
  displayTitleTh: 'พรอมต์ทดสอบ',
  descriptionTh: 'ใช้ทดสอบสัญญา Quality V2',
  purposeTh: 'ช่วยตรวจว่าพรอมต์มีข้อมูลอธิบายและตัวแปรที่พร้อมใช้งานจริง',
  useCasesTh: ['ตรวจพรอมต์ก่อนเผยแพร่'],
  inputGuideTh: { topic: 'กรอกหัวข้อที่ต้องการทดสอบ', language: 'เลือกภาษาผลลัพธ์' },
  expectedOutputTh: ['ผลลัพธ์ที่ตรวจสอบได้'],
  exampleInputTh: 'หัวข้อ: ตรวจ VLAN trunk',
  prompt: 'TASK\nAnalyze {{topic}}.\nRespond in {{language}}.',
  variableConfig: {
    topic: { type: 'text', required: true, defaultValue: '', labelTh: 'หัวข้อ', helpTh: 'กรอกหัวข้อที่ต้องการทดสอบ', placeholderTh: 'เช่น VLAN trunk' },
    language: { type: 'select', required: true, defaultValue: 'Thai', options: ['Thai', 'English'], labelTh: 'ภาษา', helpTh: 'เลือกภาษาผลลัพธ์', placeholderTh: '' },
  },
  variables: { topic: '', language: 'Thai' },
  catalogManaged: true,
};

test('built-in validator accepts a complete Quality V2 prompt', async () => {
  const quality = await loadQuality();
  assert.ok(quality, 'Expected lib/prompts/quality-validator.mjs to exist');
  assert.deepEqual(quality.validateBuiltInPrompt(valid), { ok: true, errors: [], warnings: [] });
});

test('built-in validator rejects missing Thai purpose metadata', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const result = quality.validateBuiltInPrompt({ ...valid, purposeTh: '' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'missing-purpose-th'));
});

test('built-in validator rejects required variables without Thai help', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const broken = structuredClone(valid);
  broken.variableConfig.topic.helpTh = '';
  const result = quality.validateBuiltInPrompt(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'missing-variable-help-th'));
});

test('built-in validator rejects placeholder/config mismatch and invalid select defaults', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const broken = structuredClone(valid);
  broken.prompt += '\nCheck {{missing_input}}.';
  broken.variableConfig.language.defaultValue = 'Japanese';
  const result = quality.validateBuiltInPrompt(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'placeholder-config-mismatch'));
  assert.ok(result.errors.some((item) => item.code === 'invalid-select-default'));
});

test('catalog validator ignores user-created prompts and catches duplicate built-in ids', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const userPrompt = { id: 'user-1', name: 'USER_PROMPT', prompt: 'hello', catalogManaged: false };
  const duplicate = { ...valid, name: 'TEST_COPY' };
  const result = quality.validatePromptCatalog([valid, duplicate, userPrompt]);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'duplicate-id'));
  assert.equal(result.results.some((item) => item.id === 'user-1'), false);
});

test('the original 30 prompts expose practical Thai Quality V2 explanations without changing identity', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);
  const core = catalog.AI_PROMPT_LIBRARY.slice(0, 30);
  assert.equal(core.length, 30);
  const expectedNames = [
    'DEEP_RESEARCH_ASSISTANT', 'FACT_CHECKER', 'ARTICLE_ANALYZER', 'PAPER_ANALYZER', 'SOURCE_COMPARATOR',
    'CODE_REVIEWER', 'BUG_HUNTER', 'UNIT_TEST_GENERATOR', 'CODE_OPTIMIZER', 'TIME_COMPLEXITY_ANALYZER',
    'REGEX_GENERATOR', 'DOCKER_GENERATOR', 'API_DESIGNER', 'DATABASE_SCHEMA_DESIGNER', 'JSON_EXTRACTOR',
    'TABLE_EXTRACTOR', 'SENTIMENT_ANALYZER', 'DATA_CLASSIFIER', 'IMAGE_OBJECT_ANALYZER', 'IMAGE_TO_JSON',
    'VIDEO_QA', 'AUDIO_TRANSCRIBER', 'BLOG_GENERATOR', 'SEO_CONTENT_WRITER', 'SOCIAL_CONTENT_GENERATOR',
    'MEETING_SUMMARIZER', 'ACTION_ITEM_EXTRACTOR', 'PRESENTATION_BUILDER', 'PERSONAL_TUTOR', 'QUIZ_GENERATOR',
  ];
  assert.deepEqual(core.map((prompt) => prompt.name), expectedNames);
  for (const prompt of core) {
    assert.match(prompt.displayTitleTh || '', /[ก-๙]/, `${prompt.name} missing Thai title`);
    assert.match(prompt.descriptionTh || '', /[ก-๙]/, `${prompt.name} missing Thai description`);
    assert.match(prompt.purposeTh || '', /[ก-๙]/, `${prompt.name} missing Thai purpose`);
    assert.ok(Array.isArray(prompt.useCasesTh) && prompt.useCasesTh.length >= 3, `${prompt.name} missing practical use cases`);
    assert.ok(Array.isArray(prompt.expectedOutputTh) && prompt.expectedOutputTh.length >= 2, `${prompt.name} missing expected output`);
    assert.match(prompt.exampleInputTh || '', /[ก-๙]/, `${prompt.name} missing Thai example`);
    for (const [name, field] of Object.entries(prompt.variableConfig || {})) {
      if (!field.required) continue;
      assert.match(field.labelTh || '', /[ก-๙]/, `${prompt.name}.${name} missing Thai label`);
      assert.match(field.helpTh || '', /[ก-๙]/, `${prompt.name}.${name} missing Thai help`);
    }
  }
});

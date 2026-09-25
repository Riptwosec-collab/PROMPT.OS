import test from 'node:test';
import assert from 'node:assert/strict';

async function loadQuality() {
  try {
    return await import('../lib/prompts/quality-validator.mjs');
  } catch {
    return null;
  }
}

function validPrompt() {
  return {
    id: 'ai-lib-test',
    name: 'TEST',
    displayTitle: 'Test',
    displayTitleTh: 'ทดสอบ',
    descriptionTh: 'ใช้ทดสอบสัญญา Quality V2',
    purposeTh: 'ช่วยตรวจสัญญาข้อมูลของพรอมต์',
    useCasesTh: ['ตรวจพรอมต์'],
    inputGuideTh: { topic: 'กรอกหัวข้อที่ต้องการทดสอบ' },
    expectedOutputTh: ['ผลลัพธ์ที่ตรวจสอบได้'],
    exampleInputTh: 'หัวข้อ: VLAN trunk',
    prompt: 'TASK\nAnalyze {{topic}}.\nRespond in {{language}}.',
    variableConfig: {
      topic: { type: 'text', required: true, defaultValue: '', labelTh: 'หัวข้อ', helpTh: 'กรอกหัวข้อที่ต้องการทดสอบ' },
      language: { type: 'select', required: true, defaultValue: 'Thai', options: ['Thai', 'English'], labelTh: 'ภาษา', helpTh: 'เลือกภาษาผลลัพธ์' },
    },
    variables: { topic: '', language: 'Thai' },
    catalogManaged: true,
  };
}

test('quality validator module exists', async () => {
  const quality = await loadQuality();
  assert.ok(quality, 'Expected lib/prompts/quality-validator.mjs to exist');
});

test('built-in validator accepts a complete Quality V2 prompt', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const result = quality.validateBuiltInPrompt(validPrompt());
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

test('built-in validator rejects incomplete Quality V2 metadata', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const result = quality.validateBuiltInPrompt({ ...validPrompt(), purposeTh: '' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'missing-purpose-th'));
});

test('built-in validator rejects required variable without Thai help', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const broken = structuredClone(validPrompt());
  broken.variableConfig.topic.helpTh = '';
  const result = quality.validateBuiltInPrompt(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'missing-variable-help-th'));
});

test('built-in validator rejects placeholder and variable config mismatch', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const broken = structuredClone(validPrompt());
  broken.prompt += '\nInspect {{logs}}.';
  const result = quality.validateBuiltInPrompt(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'placeholder-config-mismatch'));
});

test('built-in validator rejects invalid select defaults', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const broken = structuredClone(validPrompt());
  broken.variableConfig.language.defaultValue = 'Japanese';
  const result = quality.validateBuiltInPrompt(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'invalid-select-default'));
});

test('catalog validator reports duplicate IDs without mutating prompts', async () => {
  const quality = await loadQuality();
  assert.ok(quality);
  const first = validPrompt();
  const second = { ...validPrompt(), name: 'TEST_2', displayTitle: 'Test 2' };
  const result = quality.validatePromptCatalog([first, second]);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'duplicate-id'));
  assert.equal(first.name, 'TEST');
});

test('all existing 80 built-ins satisfy the Quality V2 contract', async () => {
  const quality = await loadQuality();
  const catalog = await import('../lib/prompts/ai-prompt-library.mjs');
  assert.ok(quality);
  assert.equal(catalog.AI_PROMPT_LIBRARY.length, 80);

  const result = quality.validatePromptCatalog(catalog.AI_PROMPT_LIBRARY);
  assert.equal(result.ok, true, JSON.stringify(result.errors.slice(0, 12), null, 2));
});

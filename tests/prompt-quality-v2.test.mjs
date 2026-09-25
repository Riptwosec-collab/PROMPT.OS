import test from 'node:test';
import assert from 'node:assert/strict';

async function loadQuality() {
  try {
    return await import('../lib/prompts/quality-validator.mjs');
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

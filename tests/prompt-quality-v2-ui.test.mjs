import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('variable form renders Thai help and placeholder metadata accessibly', () => {
  const source = read('components/prompt/PromptVariableForm.jsx');
  assert.match(source, /helpTh/);
  assert.match(source, /placeholderTh/);
  assert.match(source, /variable-\$\{name\}-help/);
  assert.match(source, /aria-describedby/);
  assert.match(source, /helpId/);
  assert.match(source, /errorId/);
});

test('Prompt Detail exposes flag-gated Thai explanation sections before execution preview', () => {
  const source = read('components/prompt/PromptDetailV2.jsx');
  assert.match(source, /explainerEnabled/);
  for (const label of ['พรอมต์นี้ทำอะไร', 'เหมาะกับ', 'ผลลัพธ์ที่จะได้', 'ตัวอย่างข้อมูลที่กรอก']) assert.match(source, new RegExp(label));
  assert.match(source, /purposeTh/);
  assert.match(source, /useCasesTh/);
  assert.match(source, /expectedOutputTh/);
  assert.match(source, /exampleInputTh/);
  assert.match(source, /V5_FEATURE_FLAGS\.V5_PROMPT_EXPLAINER/);
});

test('V5_PROMPT_EXPLAINER is granular and default-off while legacy detail remains available', () => {
  const flags = read('lib/ui/feature-flags.mjs');
  const page = read('app/page.jsx');
  const detail = read('components/prompt/PromptDetailV2.jsx');
  const env = read('.env.example');
  assert.match(flags, /V5_PROMPT_EXPLAINER/);
  assert.match(flags, /NEXT_PUBLIC_V5_PROMPT_EXPLAINER/);
  assert.match(page, /v5PromptExplainerEnabled/);
  assert.match(detail, /explainerEnabledProp \?\? Boolean\(V5_FEATURE_FLAGS\.V5_PROMPT_EXPLAINER\)/);
  assert.match(env, /NEXT_PUBLIC_V5_PROMPT_EXPLAINER=false/);
  assert.match(detail, /explainerEnabled \? \(/);
});

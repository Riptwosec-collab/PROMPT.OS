import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('Prompt Detail V2 exposes desktop info, inputs and preview regions in mobile-safe order', () => {
  const source = read('components/prompt/PromptDetailV2.jsx');
  assert.match(source, /data-region="info"/);
  assert.match(source, /data-region="inputs"/);
  assert.match(source, /data-region="preview"/);
  assert.match(source, /lg:grid-cols/);
  assert.ok(source.indexOf('data-region="info"') < source.indexOf('data-region="inputs"'));
  assert.ok(source.indexOf('data-region="inputs"') < source.indexOf('data-region="preview"'));
});

test('Smart variable form validates required fields and exposes typed controls', () => {
  const source = read('components/prompt/PromptVariableForm.jsx');
  assert.match(source, /validatePromptVariables/);
  assert.match(source, /aria-invalid/);
  for (const type of ['textarea', 'number', 'select', 'multi-select', 'boolean', 'date', 'url', 'code', 'language', 'file']) {
    assert.match(source, new RegExp(type.replace('-', '\\-')));
  }
});

test('Prompt Detail V2 preserves entered values when delegated execution fails', () => {
  const source = read('components/prompt/PromptDetailV2.jsx');
  assert.match(source, /catch\s*\(/);
  assert.match(source, /setRunError/);
  assert.doesNotMatch(source, /catch[\s\S]{0,300}setValues\s*\(\s*\{\s*\}\s*\)/);
});

test('Prompt Health is local and Prompt Library gates detail V2 with V5_PROMPT_DETAIL', () => {
  const health = read('components/prompt/PromptHealth.jsx');
  const library = read('components/prompt/PromptLibraryV5.jsx');
  const page = read('app/page.jsx');
  assert.match(health, /scorePromptHealth/);
  assert.match(library, /PromptDetailV2/);
  assert.match(library, /detailEnabled/);
  assert.match(page, /V5_PROMPT_DETAIL/);
});

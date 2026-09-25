import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { translateCatalogThai } from '../lib/i18n/catalog-th.mjs';

test('all built-in prompts expose explicit Thai metadata and bilingual usage instructions', () => {
  assert.equal(AI_PROMPT_LIBRARY.length, 100);

  for (const prompt of AI_PROMPT_LIBRARY) {
    for (const key of ['displayTitleTh', 'descriptionTh', 'usageGuideTh', 'usageGuideEn']) {
      assert.equal(typeof prompt[key], 'string', `${prompt.name} missing ${key}`);
      assert.ok(prompt[key].trim().length > 0, `${prompt.name}.${key} must not be blank`);
    }

    assert.match(prompt.displayTitleTh, /[ก-๙]/, `${prompt.name}.displayTitleTh must contain Thai`);
    assert.match(prompt.descriptionTh, /[ก-๙]/, `${prompt.name}.descriptionTh must contain Thai`);
    assert.match(prompt.usageGuideTh, /[ก-๙]/, `${prompt.name}.usageGuideTh must contain Thai`);
    assert.match(prompt.usageGuideEn, /[A-Za-z]/, `${prompt.name}.usageGuideEn must contain English`);

    for (const variableName of Object.keys(prompt.variables || {}).filter((name) => name !== 'language')) {
      assert.match(prompt.usageGuideTh, new RegExp(variableName, 'i'), `${prompt.name}.usageGuideTh should mention ${variableName}`);
      assert.match(prompt.usageGuideEn, new RegExp(variableName, 'i'), `${prompt.name}.usageGuideEn should mention ${variableName}`);
    }

    assert.equal(prompt.exampleInput, prompt.usageGuideEn, `${prompt.name} should expose its usage guide in Prompt Detail`);
  }
});

test('the original researched 50 preserve their source-pack sample input separately from the usage guide slot', () => {
  const researched = AI_PROMPT_LIBRARY.filter((prompt) => Array.isArray(prompt.sourceInspiration));
  assert.equal(researched.length, 50);
  for (const prompt of researched) {
    assert.equal(typeof prompt.sampleInput, 'string', `${prompt.name} missing sampleInput`);
    assert.ok(prompt.sampleInput.trim().length > 0, `${prompt.name}.sampleInput must not be blank`);
  }
});

test('Prompt Detail relabels the existing example-input area as How to Use Prompt in both languages', () => {
  const source = fs.readFileSync(new URL('../components/PromptOS.jsx', import.meta.url), 'utf8');
  assert.match(source, /EXAMPLE_INPUT/);
  assert.match(source, /prompt\.exampleInput/);
  assert.equal(translateCatalogThai('th', 'EXAMPLE_INPUT'), 'วิธีใช้พรอมต์');
  assert.equal(translateCatalogThai('en', 'EXAMPLE_INPUT'), 'HOW TO USE PROMPT');
});

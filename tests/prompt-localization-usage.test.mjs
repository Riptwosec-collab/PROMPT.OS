import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';

test('all built-in prompts expose explicit Thai metadata and bilingual usage instructions', () => {
  assert.equal(AI_PROMPT_LIBRARY.length, 30);

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
  }
});

test('prompt detail renders a dedicated usage guide section', () => {
  const source = fs.readFileSync(new URL('../components/PromptOS.jsx', import.meta.url), 'utf8');
  assert.match(source, /USAGE_GUIDE/);
  assert.match(source, /prompt\.usageGuide/);
});

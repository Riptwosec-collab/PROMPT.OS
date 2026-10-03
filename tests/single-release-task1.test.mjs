import test from 'node:test';
import assert from 'node:assert/strict';

import { readFeatureFlags, isFeatureEnabled } from '../lib/ui/feature-flags.mjs';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { validateBuiltInPrompt } from '../lib/prompts/quality-validator.mjs';
import { validatePromptVariables } from '../lib/variables/validate-variables.mjs';
import { renderPromptTemplate } from '../lib/variables/render-prompt.mjs';

test('daily use release flag is default-off and strict-true only', () => {
  assert.equal(readFeatureFlags({}).V5_DAILY_USE_COMPLETE, false);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_DAILY_USE_COMPLETE: ' true ' }).V5_DAILY_USE_COMPLETE, true);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_DAILY_USE_COMPLETE: '1' }).V5_DAILY_USE_COMPLETE, false);
  assert.equal(isFeatureEnabled(readFeatureFlags({ NEXT_PUBLIC_V5_DAILY_USE_COMPLETE: 'true' }), 'V5_DAILY_USE_COMPLETE'), true);
});

test('all 100 built-ins expose non-mutating structured runnable examples', () => {
  assert.equal(AI_PROMPT_LIBRARY.length, 100);
  assert.equal(new Set(AI_PROMPT_LIBRARY.map((prompt) => prompt.id)).size, 100);

  for (const prompt of AI_PROMPT_LIBRARY) {
    const before = structuredClone(prompt);
    assert.ok(prompt.exampleValues && typeof prompt.exampleValues === 'object' && !Array.isArray(prompt.exampleValues), `${prompt.name}: missing exampleValues`);

    const quality = validateBuiltInPrompt(prompt);
    assert.equal(quality.ok, true, `${prompt.name}: ${JSON.stringify(quality.errors)}`);

    const validation = validatePromptVariables(prompt.variableConfig || {}, prompt.exampleValues);
    assert.equal(validation.ok, true, `${prompt.name}: example values invalid ${JSON.stringify(validation.errors)}`);

    const rendered = renderPromptTemplate(prompt.prompt, prompt.variableConfig || {}, prompt.exampleValues);
    assert.deepEqual(rendered.unresolvedRequired, [], `${prompt.name}: unresolved required placeholders`);
    assert.doesNotMatch(rendered.text, /{{\s*[a-zA-Z0-9_.-]+\s*}}/, `${prompt.name}: unresolved placeholder remains`);
    assert.deepEqual(prompt, before, `${prompt.name}: validation/rendering mutated built-in prompt`);
  }
});

test('validator reports invalid_example_values for a declared broken example', () => {
  const base = AI_PROMPT_LIBRARY.find((prompt) => Object.values(prompt.variableConfig || {}).some((field) => field.required));
  assert.ok(base, 'expected a built-in prompt with required variables');
  const broken = structuredClone(base);
  broken.exampleValues = Object.fromEntries(Object.keys(broken.variableConfig || {}).map((name) => [name, '']));
  const result = validateBuiltInPrompt(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'invalid_example_values'));
});

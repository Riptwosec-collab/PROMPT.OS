import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { exampleValuesForPrompt, clearValuesForPrompt } from '../lib/prompts/example-values.mjs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('example helpers return detached executable values and clear back to canonical defaults without mutating built-ins', () => {
  const prompt = AI_PROMPT_LIBRARY.find((item) => item.exampleValues && Object.keys(item.variableConfig || {}).length > 0);
  assert.ok(prompt);
  const before = structuredClone(prompt);
  const example = exampleValuesForPrompt(prompt);
  assert.deepEqual(example, prompt.exampleValues);
  const firstKey = Object.keys(example)[0];
  if (firstKey && example[firstKey] && typeof example[firstKey] === 'object') example[firstKey].changed = true;
  else if (firstKey) example[firstKey] = 'changed';
  assert.deepEqual(prompt, before);

  const cleared = clearValuesForPrompt(prompt);
  for (const [name, field] of Object.entries(prompt.variableConfig || {})) {
    const expected = Object.hasOwn(field, 'default') ? field.default : Object.hasOwn(field, 'defaultValue') ? field.defaultValue : field.type === 'boolean' || field.type === 'toggle' ? false : field.type === 'multi-select' ? [] : '';
    assert.deepEqual(cleared[name], expected, `${prompt.name}.${name}`);
  }
  assert.deepEqual(prompt, before);
});

test('Prompt Detail exposes capability-gated Try Example and Clear Example actions using structured values only', () => {
  const source = read('components/prompt/PromptDetailV2.jsx');
  assert.match(source, /exampleEnabled/);
  assert.match(source, /Try Example/);
  assert.match(source, /Clear Example/);
  assert.match(source, /exampleValuesForPrompt/);
  assert.match(source, /clearValuesForPrompt/);
  assert.doesNotMatch(source, /parse.*exampleInputTh|exampleInputTh.*split/i);
});

test('Run Workspace follows streaming output until manual upward scroll and offers explicit Follow output', () => {
  const source = read('components/prompt/RunWorkspace.jsx');
  assert.match(source, /followingOutput/);
  assert.match(source, /Follow output/);
  assert.match(source, /handleResultScroll/);
  assert.match(source, /scrollHeight/);
  assert.match(source, /scrollTop/);
});

test('Run Workspace adds safe Save and Escape keyboard behavior without stealing normal editable input', () => {
  const source = read('components/prompt/RunWorkspace.jsx');
  assert.match(source, /toLowerCase\(\) === 's'/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /active/);
  assert.match(source, /handleSaveResult/);
  assert.match(source, /confirm/);
});

test('Run Workspace exposes truthful recovery actions when persistence is not saved', () => {
  const source = read('components/prompt/RunWorkspace.jsx');
  assert.match(source, /Not persisted/);
  assert.match(source, /Retry Save/);
  assert.match(source, /Export/);
  assert.match(source, /persistence/);
  assert.doesNotMatch(source, /Saved locally.*persistence.*error/s);
});

test('library passes daily example capability and preserves session input when returning from immersive run', () => {
  const source = read('components/prompt/PromptLibraryV5.jsx');
  assert.match(source, /exampleEnabled=\{dailyUseEnabled\}/);
  assert.match(source, /initialValues=\{runRequest\.initialValues\}/);
  assert.match(source, /runRequest/);
  assert.match(source, /closeImmersiveRun/);
});

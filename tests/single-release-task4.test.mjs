import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('Prompt Detail supports example fill and clear from structured exampleValues only', () => {
  const source = read('components/prompt/PromptDetailV2.jsx');
  assert.match(source, /exampleValues/);
  assert.match(source, /Try Example/);
  assert.match(source, /Clear Example/);
  assert.doesNotMatch(source, /exampleInputTh.*setValues|setValues.*exampleInputTh/s);
});

test('Run Workspace owns follow-output, save shortcut, safe escape and export recovery actions', () => {
  const source = read('components/prompt/RunWorkspace.jsx');
  assert.match(source, /followingOutput/);
  assert.match(source, /Follow output/);
  assert.match(source, /toLowerCase\(\).*=== 's'|toLowerCase\(\).*'s'/s);
  assert.match(source, /Escape/);
  assert.match(source, /Export/);
  assert.match(source, /Retry Save/);
  assert.match(source, /Not persisted/);
});

test('Milestone A does not expose Compare or Customize as working prompt actions', () => {
  const detail = read('components/prompt/PromptDetailV2.jsx');
  const workspace = read('components/prompt/RunWorkspace.jsx');
  assert.doesNotMatch(detail, />\s*Customize\s*</);
  assert.doesNotMatch(workspace, />\s*Compare\s*</);
});

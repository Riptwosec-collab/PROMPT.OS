import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hookPath = new URL('../components/prompt/usePromptRun.js', import.meta.url);

test('immersive run hook reuses streamAiRun and one AbortController transport path', () => {
  const source = fs.readFileSync(hookPath, 'utf8');
  assert.match(source, /streamAiRun/);
  assert.match(source, /AbortController/);
  assert.match(source, /useReducer/);
  assert.match(source, /reduceRunState/);
  assert.equal(/fetch\s*\(\s*['"`]\/api\/ai\/run/.test(source), false);
});

test('immersive run hook stops aborts without converting AbortError into failure', () => {
  const source = fs.readFileSync(hookPath, 'utf8');
  assert.match(source, /\.abort\(\)/);
  assert.match(source, /AbortError/);
  assert.match(source, /type:\s*['"]stop['"]/);
  assert.match(source, /type:\s*['"]fail['"]/);
});

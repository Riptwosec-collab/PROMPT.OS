import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const modulePath = 'lib/ui/prompt-transition.mjs';

test('shared prompt transition falls back safely', async () => {
  assert.equal(fs.existsSync(modulePath), true, 'prompt transition module must exist');
  const { promptLayoutId, getPromptTransitionMode } = await import('../lib/ui/prompt-transition.mjs');
  assert.equal(promptLayoutId(42), 'prompt-card-42');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: true, sourceAvailable: true }), 'fade');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: false, sourceAvailable: false }), 'fade');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: false, sourceAvailable: true }), 'shared');
  assert.equal(getPromptTransitionMode({ enabled: false, reducedMotion: false, sourceAvailable: true }), 'fade');
});

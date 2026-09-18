import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const modulePath = 'lib/ui/prompt-transition.mjs';
const read = (path) => fs.readFileSync(path, 'utf8');

test('shared prompt transition falls back safely', async () => {
  assert.equal(fs.existsSync(modulePath), true, 'prompt transition module must exist');
  const { promptLayoutId, promptTitleLayoutId, promptGlyphLayoutId, getPromptTransitionMode } = await import('../lib/ui/prompt-transition.mjs');
  assert.equal(promptLayoutId(42), 'prompt-card-42');
  assert.equal(promptTitleLayoutId(42), 'prompt-card-42-title');
  assert.equal(promptGlyphLayoutId(42), 'prompt-card-42-glyph');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: true, sourceAvailable: true }), 'fade');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: false, sourceAvailable: false }), 'fade');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: false, sourceAvailable: true }), 'shared');
  assert.equal(getPromptTransitionMode({ enabled: false, reducedMotion: false, sourceAvailable: true }), 'fade');
});

test('card and detail share deterministic surface title and glyph identities', () => {
  const card = read('components/prompt/PromptCardV5.jsx');
  const detail = read('components/prompt/PromptDetailV2.jsx');
  for (const helper of ['promptLayoutId', 'promptTitleLayoutId', 'promptGlyphLayoutId']) {
    assert.match(card, new RegExp(helper));
    assert.match(detail, new RegExp(helper));
  }
  assert.match(detail, /transitionEnabled\s*=\s*false/);
  assert.match(detail, /sourceAvailable\s*=\s*true/);
  assert.match(detail, /useReducedMotion/);
  assert.match(detail, /getPromptTransitionMode/);
  assert.match(detail, /AnimatePresence/);
  assert.equal(/mode=["']wait["']/.test(detail), false);
});

test('library remains detail owner and restores focus with a safe fallback', () => {
  const library = read('components/prompt/PromptLibraryV5.jsx');
  assert.equal((library.match(/useState\(null\)/g) || []).length >= 1, true);
  assert.match(library, /selectedPromptId/);
  assert.match(library, /sourceAvailable/);
  assert.match(library, /originPromptIdRef|originTriggerRef/);
  assert.match(library, /data-prompt-id/);
  assert.match(library, /searchInputRef\.current\?\.focus\(\)|libraryHeadingRef\.current\?\.focus\(\)/);
  assert.match(library, /transitionEnabled=/);
  assert.match(library, /sourceAvailable=/);
  assert.equal((library.match(/<PromptDetailV2/g) || []).length, 1);
});

test('detail keeps one Variables V2 implementation while motion remains presentation-only', () => {
  const detail = read('components/prompt/PromptDetailV2.jsx');
  assert.equal((detail.match(/<PromptVariableForm/g) || []).length, 1);
  assert.equal((detail.match(/useState\(\(\) => \(\{ \.\.\.\(prompt\?\.variables/g) || []).length <= 1, true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('premium prompt presentation is independently gated', () => {
  const page = read('app/page.jsx');
  assert.match(page, /V5_PREMIUM_CARDS/);
  assert.match(page, /V5_SHARED_PROMPT_TRANSITION/);
  assert.match(page, /premiumCardsEnabled=/);
  assert.match(page, /sharedTransitionEnabled=/);
});

test('premium library uses a spacious two-column maximum with concurrent layout motion', () => {
  const library = read('components/prompt/PromptLibraryV5.jsx');
  assert.match(library, /premiumCardsEnabled\s*=\s*false/);
  assert.match(library, /sharedTransitionEnabled\s*=\s*false/);
  assert.match(library, /PromptCardV5/);
  assert.match(library, /AnimatePresence/);
  assert.match(library, /LayoutGroup/);
  assert.match(library, /layout/);
  assert.match(library, /v5-premium-grid[^"']*grid-cols-1[^"']*lg:grid-cols-2/);
  assert.equal(/v5-premium-grid[^"']*(?:lg|xl):grid-cols-[34]/.test(library), false);
  assert.equal(/mode=["']wait["']/.test(library), false);
  assert.match(library, /premiumCardsEnabled\s*\?/);
});

test('library owns optional prompt health scoring and passes values into presentation cards', () => {
  const library = read('components/prompt/PromptLibraryV5.jsx');
  const card = read('components/prompt/PromptCardV5.jsx');
  assert.match(library, /scorePromptHealth/);
  assert.match(library, /healthEnabled/);
  assert.match(library, /healthScore=/);
  assert.equal(/scorePromptHealth/.test(card), false);
});

test('slash shortcut focuses search only through editable-target shortcut policy', () => {
  const library = read('components/prompt/PromptLibraryV5.jsx');
  const search = read('components/prompt/PromptSearch.jsx');
  assert.match(library, /searchInputRef/);
  assert.match(library, /shouldHandleShortcut/);
  assert.match(library, /event\.key\s*(?:===|!==)\s*['"]\/['"]/);
  assert.match(library, /searchInputRef\.current\?\.focus\(\)/);
  assert.match(search, /inputRef/);
  assert.match(search, /ref=\{inputRef\}/);
});

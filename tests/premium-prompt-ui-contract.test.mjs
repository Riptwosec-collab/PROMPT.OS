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

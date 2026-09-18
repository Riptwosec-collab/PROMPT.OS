import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cardPath = 'components/prompt/PromptCardV5.jsx';

test('neo card pointer light is bounded and does not tilt', () => {
  assert.equal(fs.existsSync(cardPath), true, 'PromptCardV5 must exist');
  const card = fs.readFileSync(cardPath, 'utf8');
  assert.match(card, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(card, /requestAnimationFrame/);
  assert.match(card, /--card-pointer-x/);
  assert.match(card, /--card-pointer-y/);
  assert.match(card, /--card-pointer-strength/);
  assert.match(card, /useReducedMotion/);
  assert.match(card, /y:\s*-4/);
  assert.match(card, /scale:\s*0\.985/);
  assert.equal(/rotateX|rotateY|perspective/.test(card), false);
  assert.equal(/setState\(/.test(card), false);
});

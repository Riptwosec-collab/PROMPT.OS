import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cardPath = 'components/prompt/PromptCardV5.jsx';
const sheetPath = 'components/prompt/PromptQuickActionsSheet.jsx';

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

test('coarse pointer long press cancels safely without stealing normal tap', () => {
  const card = fs.readFileSync(cardPath, 'utf8');
  assert.match(card, /pointerType\s*===\s*['"]touch['"]/);
  assert.match(card, /\(pointer:\s*coarse\)/);
  assert.match(card, />\s*10|>\s*LONG_PRESS_MOVE_TOLERANCE/);
  assert.match(card, /clearLongPress/);
  assert.match(card, /longPressFiredRef\.current/);
  assert.match(card, /onClick/);
});

test('mobile quick action surface avoids destructive gestures and supports reduced motion', () => {
  assert.equal(fs.existsSync(sheetPath), true, 'PromptQuickActionsSheet must exist');
  const sheet = fs.readFileSync(sheetPath, 'utf8');
  assert.match(sheet, /useReducedMotion/);
  assert.match(sheet, /onClose/);
  assert.equal(/swipe|drag|Delete|Trash/i.test(sheet), false);
});

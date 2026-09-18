import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cardPath = 'components/prompt/PromptCardV5.jsx';
const sheetPath = 'components/prompt/PromptQuickActionsSheet.jsx';
const detailPath = 'components/prompt/PromptDetailV2.jsx';

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

test('shared detail transition uses restrained shared identities with fade fallback', () => {
  const detail = fs.readFileSync(detailPath, 'utf8');
  for (const helper of ['promptLayoutId', 'promptTitleLayoutId', 'promptGlyphLayoutId']) assert.match(detail, new RegExp(helper));
  assert.match(detail, /sourceAvailable/);
  assert.match(detail, /getPromptTransitionMode/);
  assert.match(detail, /===\s*['"]shared['"]|transitionMode\s*===\s*['"]shared['"]/);
  assert.match(detail, /opacity/);
  assert.match(detail, /useReducedMotion/);
  assert.equal(/rotateX|rotateY|perspective/.test(detail), false);
});

test('prompt support surfaces reuse static Phase 1 glass primitives without decorative loops', () => {
  const paths = [
    'components/prompt/PromptHealth.jsx',
    'components/prompt/PromptPacks.jsx',
    'components/workspace/WorkspaceSidebar.jsx',
  ];
  for (const path of paths) {
    const source = fs.readFileSync(path, 'utf8');
    assert.match(source, /GlassSurface/, `${path} should reuse the Phase 1 glass surface primitive`);
    assert.equal(/repeat\s*:\s*Infinity|setInterval\(|requestAnimationFrame\(/.test(source), false, `${path} must stay static`);
  }
});

test('final Phase 3 interaction policy stays bounded, progressive and reduced-motion safe', () => {
  const card = fs.readFileSync(cardPath, 'utf8');
  const detail = fs.readFileSync(detailPath, 'utf8');
  const sheet = fs.readFileSync(sheetPath, 'utf8');
  const phase3 = `${card}\n${detail}\n${sheet}`;

  assert.match(card, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(card, /reducedMotion/);
  assert.match(card, /pointerType\s*===\s*['"]touch['"]/);
  assert.match(card, /y:\s*-4/);
  assert.match(card, /scale:\s*0\.985/);
  assert.match(detail, /getPromptTransitionMode/);
  assert.match(detail, /reducedMotion/);
  assert.equal(/mode=["']wait["']/.test(detail), false);
  assert.equal(/scanline|cursor-trail|particle-field|rotateX|rotateY|perspective/i.test(phase3), false);
  assert.equal(/setState\(/.test(card), false);

  const quickActions = card.match(/v5-card-quick-actions[\s\S]{0,2200}/)?.[0] || '';
  for (const action of ['Run', 'Favorite', 'Pin']) assert.match(quickActions, new RegExp(action));
});

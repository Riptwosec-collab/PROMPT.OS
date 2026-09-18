import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cardPath = 'components/prompt/PromptCardV5.jsx';
const sheetPath = 'components/prompt/PromptQuickActionsSheet.jsx';

test('premium prompt card exposes essential prompt intelligence and actions', () => {
  assert.equal(fs.existsSync(cardPath), true, 'PromptCardV5 must exist');
  const source = fs.readFileSync(cardPath, 'utf8');
  assert.match(source, /layoutId/);
  assert.match(source, /Run/);
  assert.match(source, /Favorite/);
  assert.match(source, /Pin/);
  assert.match(source, /healthScore/);
  assert.match(source, /variable/i);
  assert.match(source, /type=["']button["']/);
  assert.match(source, /prompt\.model|prompt\?\.model/);
});

test('premium prompt card consumes library-owned health score instead of recalculating it', () => {
  const source = fs.readFileSync(cardPath, 'utf8');
  assert.match(source, /healthScore\s*=\s*null/);
  assert.equal(/scorePromptHealth/.test(source), false);
});

test('premium prompt card exposes a dedicated quick-action region for CSS hover and focus reveal', () => {
  const source = fs.readFileSync(cardPath, 'utf8');
  const css = fs.readFileSync('app/globals.css', 'utf8');
  assert.match(source, /v5-card-quick-actions/);
  assert.match(css, /\.v5-card-quick-actions/);
  assert.match(css, /focus-within/);
  assert.match(css, /pointer:\s*coarse/);
});

test('mobile long press uses approved timing and cancellation rules', () => {
  const source = fs.readFileSync(cardPath, 'utf8');
  assert.match(source, /450/);
  assert.match(source, /10/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /onPointerUp/);
  assert.match(source, /onPointerCancel/);
  assert.match(source, /pointercancel|handlePointerCancel/i);
  assert.match(source, /pointerType/);
  assert.match(source, /longPressFiredRef/);
  assert.match(source, /PromptQuickActionsSheet/);
});

test('quick actions sheet is explicit, capability-aware and non-destructive', () => {
  assert.equal(fs.existsSync(sheetPath), true, 'PromptQuickActionsSheet must exist');
  const source = fs.readFileSync(sheetPath, 'utf8');
  assert.match(source, /AnimatePresence/);
  assert.match(source, /role=["']dialog["']/);
  assert.match(source, /aria-modal=["']true["']/);
  assert.match(source, /Close/);
  for (const action of ['Run', 'Favorite', 'Pin', 'Copy', 'Add to pack']) assert.match(source, new RegExp(action, 'i'));
  assert.match(source, /disabled=/);
  assert.match(source, /Escape/);
  assert.equal(/Delete|Trash|swipe.*delete/i.test(source), false);
});

test('premium prompt card does not hard-code fake execution telemetry', () => {
  assert.equal(fs.existsSync(cardPath), true, 'PromptCardV5 must exist');
  const source = fs.readFileSync(cardPath, 'utf8');
  assert.equal(/model\s*=\s*["'][^"']+["']/.test(source), false);
  assert.equal(/tokens?\s*=\s*\d+/i.test(source), false);
  assert.equal(/cost\s*=\s*\d+/i.test(source), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cardPath = 'components/prompt/PromptCardV5.jsx';

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

test('premium prompt card does not hard-code fake execution telemetry', () => {
  assert.equal(fs.existsSync(cardPath), true, 'PromptCardV5 must exist');
  const source = fs.readFileSync(cardPath, 'utf8');
  assert.equal(/model\s*=\s*["'][^"']+["']/.test(source), false);
  assert.equal(/tokens?\s*=\s*\d+/i.test(source), false);
  assert.equal(/cost\s*=\s*\d+/i.test(source), false);
});

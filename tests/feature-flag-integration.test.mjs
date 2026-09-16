import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('PromptOS consumes centralized V5 feature flags without direct env reads', () => {
  const source = fs.readFileSync('components/PromptOS.jsx', 'utf8');
  assert.match(source, /V5_FEATURE_FLAGS|readFeatureFlags/);
  assert.equal(/process\.env\.NEXT_PUBLIC_V5_/.test(source), false);
});

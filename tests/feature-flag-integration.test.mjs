import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('app boundary provides centralized V5 feature flags without direct env reads', () => {
  const pageSource = fs.readFileSync('app/page.jsx', 'utf8');
  const providerSource = fs.readFileSync('components/V5FeatureFlagProvider.jsx', 'utf8');

  assert.match(pageSource, /V5FeatureFlagProvider/);
  assert.match(providerSource, /V5_FEATURE_FLAGS/);
  assert.equal(/process\.env\.NEXT_PUBLIC_V5_/.test(pageSource), false);
  assert.equal(/process\.env\.NEXT_PUBLIC_V5_/.test(providerSource), false);
});

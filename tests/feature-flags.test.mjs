import test from 'node:test';
import assert from 'node:assert/strict';
import { readFeatureFlags, isFeatureEnabled } from '../lib/ui/feature-flags.mjs';

test('V5 flags default to false', () => {
  assert.deepEqual(readFeatureFlags({}), {
    V5_WORKSPACE: false,
    V5_SYNC: false,
    V5_EVALUATION: false,
    V5_ANALYTICS: false,
  });
});

test('only explicit true values enable a flag', () => {
  const flags = readFeatureFlags({ NEXT_PUBLIC_V5_SYNC: 'true' });
  assert.equal(isFeatureEnabled(flags, 'V5_SYNC'), true);
  assert.equal(isFeatureEnabled(flags, 'UNKNOWN'), false);
});

test('true is case-insensitive while other truthy strings stay disabled', () => {
  const flags = readFeatureFlags({
    NEXT_PUBLIC_V5_WORKSPACE: 'TRUE',
    NEXT_PUBLIC_V5_SYNC: '1',
    NEXT_PUBLIC_V5_EVALUATION: 'yes',
    NEXT_PUBLIC_V5_ANALYTICS: ' true ',
  });

  assert.equal(flags.V5_WORKSPACE, true);
  assert.equal(flags.V5_SYNC, false);
  assert.equal(flags.V5_EVALUATION, false);
  assert.equal(flags.V5_ANALYTICS, true);
});

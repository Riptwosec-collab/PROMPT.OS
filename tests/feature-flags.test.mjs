import test from 'node:test';
import assert from 'node:assert/strict';
import { readFeatureFlags, isFeatureEnabled, V5_FLAG_NAMES } from '../lib/ui/feature-flags.mjs';

const EXPECTED_FLAGS = [
  'V5_WORKSPACE', 'V5_SYNC', 'V5_EVALUATION', 'V5_ANALYTICS',
  'V5_SEARCH', 'V5_PROMPT_DETAIL', 'V5_VARIABLES', 'V5_PROMPT_HEALTH',
  'V5_SMART_COLLECTIONS', 'V5_EXECUTION_ENGINE', 'V5_AI_IMPROVE',
  'V5_COST_GUARD', 'V5_PROVIDER_SELECTOR', 'V5_COMMAND_PALETTE',
  'V5_CLOUD_SYNC', 'V5_USAGE_ANALYTICS', 'V5_WORKFLOW', 'V5_VISUAL_SYSTEM',
  'V5_MISSION_CONTROL', 'V5_PREMIUM_CARDS', 'V5_SHARED_PROMPT_TRANSITION',
];

test('V5 flags default to false with the complete legacy and granular flag set', () => {
  assert.deepEqual(V5_FLAG_NAMES, EXPECTED_FLAGS);
  assert.deepEqual(readFeatureFlags({}), Object.fromEntries(EXPECTED_FLAGS.map((name) => [name, false])));
});

test('only explicit true values enable a flag', () => {
  const flags = readFeatureFlags({ NEXT_PUBLIC_V5_CLOUD_SYNC: 'true' });
  assert.equal(isFeatureEnabled(flags, 'V5_CLOUD_SYNC'), true);
  assert.equal(isFeatureEnabled(flags, 'UNKNOWN'), false);
});

test('legacy flags remain supported while granular flags use the same parsing rules', () => {
  const flags = readFeatureFlags({
    NEXT_PUBLIC_V5_WORKSPACE: 'TRUE',
    NEXT_PUBLIC_V5_SYNC: '1',
    NEXT_PUBLIC_V5_EVALUATION: 'yes',
    NEXT_PUBLIC_V5_ANALYTICS: ' true ',
    NEXT_PUBLIC_V5_SEARCH: ' true ',
  });
  assert.equal(flags.V5_WORKSPACE, true);
  assert.equal(flags.V5_SYNC, false);
  assert.equal(flags.V5_EVALUATION, false);
  assert.equal(flags.V5_ANALYTICS, true);
  assert.equal(flags.V5_SEARCH, true);
});

test('visual system flag is default-off and only explicit true enables it', () => {
  assert.equal(readFeatureFlags({}).V5_VISUAL_SYSTEM, false);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_VISUAL_SYSTEM: ' true ' }).V5_VISUAL_SYSTEM, true);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_VISUAL_SYSTEM: '1' }).V5_VISUAL_SYSTEM, false);
});

test('mission control flag is default-off and only explicit true enables it', () => {
  assert.equal(readFeatureFlags({}).V5_MISSION_CONTROL, false);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_MISSION_CONTROL: ' true ' }).V5_MISSION_CONTROL, true);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_MISSION_CONTROL: '1' }).V5_MISSION_CONTROL, false);
});

test('premium cards and shared prompt transition flags are default-off and strict-true only', () => {
  const defaults = readFeatureFlags({});
  assert.equal(defaults.V5_PREMIUM_CARDS, false);
  assert.equal(defaults.V5_SHARED_PROMPT_TRANSITION, false);

  const enabled = readFeatureFlags({
    NEXT_PUBLIC_V5_PREMIUM_CARDS: ' true ',
    NEXT_PUBLIC_V5_SHARED_PROMPT_TRANSITION: 'true',
  });
  assert.equal(enabled.V5_PREMIUM_CARDS, true);
  assert.equal(enabled.V5_SHARED_PROMPT_TRANSITION, true);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_PREMIUM_CARDS: '1' }).V5_PREMIUM_CARDS, false);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_SHARED_PROMPT_TRANSITION: 'yes' }).V5_SHARED_PROMPT_TRANSITION, false);
});

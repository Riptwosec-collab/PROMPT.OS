import test from 'node:test';
import assert from 'node:assert/strict';
import { VISUAL_TOKENS } from '../lib/ui/visual-tokens.mjs';
import { MOTION_TOKENS, getTransition } from '../lib/ui/motion-tokens.mjs';
import { getInteractionPolicy } from '../lib/ui/interaction-config.mjs';

test('approved visual and motion tokens are centralized', () => {
  assert.equal(VISUAL_TOKENS.color.iceBlue, '#8BE9FF');
  assert.equal(VISUAL_TOKENS.color.electricPurple, '#A78BFA');
  assert.deepEqual(
    [MOTION_TOKENS.instant, MOTION_TOKENS.fast, MOTION_TOKENS.standard],
    [120, 180, 280],
  );
  assert.equal(getTransition('standard', true).duration, 0.01);
});

test('interaction policy disables motion under reduced-motion preference', () => {
  assert.deepEqual(
    getInteractionPolicy({ reducedMotion: true, finePointer: true, documentVisible: true }),
    { ambient: false, pointerGlow: false, spatialMotion: false },
  );
});

test('fine pointer and visible document enable progressive effects when motion is allowed', () => {
  assert.deepEqual(
    getInteractionPolicy({ reducedMotion: false, finePointer: true, documentVisible: true }),
    { ambient: true, pointerGlow: true, spatialMotion: true },
  );
});

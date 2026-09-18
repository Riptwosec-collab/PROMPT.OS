export const MOTION_TOKENS = Object.freeze({
  instant: 120,
  fast: 180,
  standard: 280,
  springMin: 350,
  springMax: 500,
  ambientMin: 8000,
  ambientMax: 20000,
});

const TWEEN_MS = Object.freeze({
  instant: MOTION_TOKENS.instant,
  fast: MOTION_TOKENS.fast,
  standard: MOTION_TOKENS.standard,
});

export function getTransition(kind = 'standard', reducedMotion = false) {
  if (reducedMotion) return { duration: 0.01 };
  if (kind === 'spring') {
    return { type: 'spring', stiffness: 360, damping: 32, mass: 0.9 };
  }
  const ms = TWEEN_MS[kind] ?? MOTION_TOKENS.standard;
  return { type: 'tween', duration: ms / 1000, ease: [0.22, 1, 0.36, 1] };
}

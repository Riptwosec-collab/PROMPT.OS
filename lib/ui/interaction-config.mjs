export function getInteractionPolicy({
  reducedMotion = false,
  finePointer = false,
  documentVisible = true,
} = {}) {
  return {
    ambient: !reducedMotion && documentVisible,
    pointerGlow: !reducedMotion && documentVisible && finePointer,
    spatialMotion: !reducedMotion,
  };
}

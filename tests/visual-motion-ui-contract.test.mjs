import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('visual primitives expose approved glass and motion contracts', () => {
  const glass = read('components/ui/GlassSurface.jsx');
  const motion = read('components/ui/MotionSurface.jsx');
  const aurora = read('components/ui/AuroraBackground.jsx');
  const button = read('components/ui/GlowButton.jsx');
  const glyph = read('components/ui/GlassGlyph.jsx');
  assert.match(glass, /glass-subtle/);
  assert.match(glass, /glass-panel/);
  assert.match(glass, /glass-focus/);
  assert.match(motion, /motion\/react/);
  assert.match(aurora, /aria-hidden/);
  assert.match(aurora, /requestAnimationFrame/);
  assert.equal(/setState\(/.test(aurora), false);
  assert.match(button, /focus-visible/);
  assert.match(glyph, /aria-hidden/);
});

test('visual system is separately gated and legacy shell path remains', () => {
  const page = read('app/page.jsx');
  const shell = read('components/shell/AppShell.jsx');
  assert.match(page, /V5_VISUAL_SYSTEM/);
  assert.match(page, /visualSystemEnabled=/);
  assert.match(shell, /visualSystemEnabled = false/);
  assert.match(shell, /AuroraBackground/);
  assert.match(shell, /v5-ambient/);
});

test('legacy glass styling stays unchanged until the visual system gate is enabled', () => {
  const css = read('app/globals.css');
  const shell = read('components/shell/AppShell.jsx');

  assert.match(
    css,
    /\.v5-glass\s*\{[\s\S]*?background:\s*var\(--v5-glass\);[\s\S]*?border-color:\s*var\(--v5-line\);[\s\S]*?\}/,
  );
  assert.match(
    css,
    /\.v5-visual-enabled\s+\.v5-glass\s*\{[\s\S]*?background:\s*var\(--v5-glass-panel\);[\s\S]*?border-color:\s*var\(--v5-border-panel\);[\s\S]*?box-shadow:\s*var\(--v5-shadow-medium\);[\s\S]*?\}/,
  );
  assert.match(shell, /v5-visual-enabled/);
});

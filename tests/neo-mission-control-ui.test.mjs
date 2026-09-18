import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('neo pointer effects are bounded and DOM-driven', () => {
  const spotlight = read('components/ui/PointerSpotlightSurface.jsx');
  const magnetic = read('components/ui/MagneticAction.jsx');
  assert.match(spotlight, /\(hover: hover\).*\(pointer: fine\)/);
  assert.match(spotlight, /requestAnimationFrame/);
  assert.match(spotlight, /cancelAnimationFrame/);
  assert.match(spotlight, /--spotlight-x/);
  assert.match(spotlight, /--spotlight-y/);
  assert.equal(/setState\(/.test(spotlight), false);
  assert.match(magnetic, /Math\.max\(-2,\s*Math\.min\(2,/);
  assert.match(magnetic, /useReducedMotion/);
  assert.match(magnetic, /\(hover: hover\).*\(pointer: fine\)/);
});

test('mission control limits neo effects to intentional hero interactions', () => {
  const home = read('components/home/MissionControl.jsx');
  assert.match(home, /PointerSpotlightSurface/);
  assert.match(home, /MagneticAction/);
  assert.equal((home.match(/<PointerSpotlightSurface/g) || []).length, 1);
  assert.equal((home.match(/<MagneticAction/g) || []).length, 1);
  assert.equal(/repeat:\s*Infinity/.test(home), false);
});

test('neo css provides restrained spotlight depth plus fine and coarse pointer policies', () => {
  const css = read('app/globals.css');
  assert.match(css, /--spotlight-x/);
  assert.match(css, /--spotlight-y/);
  assert.match(css, /radial-gradient/);
  assert.match(css, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/);
  assert.match(css, /@media\s*\(hover:\s*none\),\s*\(pointer:\s*coarse\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.v5-pointer-spotlight::before[\s\S]*opacity:\s*0/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.v5-magnetic-inner[\s\S]*transform:\s*none\s*!important/);
  assert.equal(/scanline|cursor-trail|particle-field/i.test(css), false);
});

test('new Phase 2 surfaces avoid heavy 3D and continuous decorative motion', () => {
  const source = [
    'components/home/MissionControl.jsx',
    'components/command/CommandPaletteV5.jsx',
    'components/shell/Sidebar.jsx',
    'components/shell/MobileDock.jsx',
    'components/shell/PageTransition.jsx',
    'components/shell/CreateActionSheet.jsx',
  ].map(read).join('\n');
  assert.equal(/rotateX|rotateY|repeat:\s*Infinity|scanline|cursor-trail|particle-field/i.test(source), false);
});

test('mission control metrics render only from real enabled data paths', () => {
  const home = read('components/home/MissionControl.jsx');
  assert.match(home, /usageEnabled\s*&&\s*hasUsage/);
  assert.match(home, /cloudStatus\s*\?/);
  assert.match(home, /healthEnabled\s*\?/);
  assert.equal(/fake|mock telemetry|demo tokens|demo cost/i.test(home), false);
});

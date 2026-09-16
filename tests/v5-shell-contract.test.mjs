import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

test('V5 shell exposes desktop, mobile and status regions', () => {
  const source = fs.readFileSync('components/shell/AppShell.jsx', 'utf8');
  assert.match(source, /Sidebar/);
  assert.match(source, /TopBar/);
  assert.match(source, /StatusHud/);
  assert.match(source, /MobileDock/);
});

test('V5 visual system includes liquid glass tokens and reduced motion', () => {
  const css = fs.readFileSync('app/globals.css', 'utf8');
  assert.match(css, /--v5-glass/);
  assert.match(css, /\.v5-glass/);
  assert.match(css, /prefers-reduced-motion/);
});

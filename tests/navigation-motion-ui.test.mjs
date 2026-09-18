import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('sidebar morphs one shared active indicator across collapsed and expanded states', () => {
  const source = read('components/shell/Sidebar.jsx');
  assert.match(source, /motion\/react/);
  assert.match(source, /onToggleCollapsed/);
  assert.equal((source.match(/layoutId="v5-nav-active"/g) || []).length, 1);
  assert.match(source, /v5-nav-icon-cell/);
  assert.match(source, /useReducedMotion/);
});

test('top bar exposes command capability only when enabled and accepts real status', () => {
  const source = read('components/shell/TopBar.jsx');
  assert.match(source, /commandEnabled/);
  assert.match(source, /status/);
  assert.match(source, /commandEnabled\s*&&/);
  assert.match(source, /status\s*\?/);
});

test('shell does not present placeholder cloud status as real telemetry', () => {
  const page = read('app/page.jsx');
  const shell = read('components/shell/AppShell.jsx');
  assert.equal(/const status\s*=\s*\{[\s\S]*mode:\s*['"]ready['"]/.test(page), false);
  assert.match(shell, /status\s*\?\s*<StatusHud\s+status=\{status\}\s*\/>\s*:\s*null/);
});

test('mobile dock has approved destinations, one shared indicator, safe area and 44px targets', () => {
  const source = read('components/shell/MobileDock.jsx');
  const css = read('app/globals.css');
  for (const label of ['LIBRARY', 'WORKSPACES', 'CREATE', 'ACTIVITY', 'MORE']) assert.match(source, new RegExp(label));
  assert.equal((source.match(/layoutId="v5-mobile-active"/g) || []).length, 1);
  assert.match(source, /onOpenMore/);
  assert.match(source, /onNewPrompt/);
  assert.match(source, /min-h-(?:11|12|\[44px\])/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test('create sheet keeps unavailable actions visibly disabled instead of faking callbacks', () => {
  const source = read('components/shell/CreateActionSheet.jsx');
  for (const label of ['New Prompt', 'New Workflow', 'Import Prompt']) assert.match(source, new RegExp(label));
  assert.match(source, /disabled=/);
  assert.match(source, /onNewPrompt/);
  assert.match(source, /onNewWorkflow/);
  assert.match(source, /onImportPrompt/);
});

test('page transition animates only content concurrently with approved durations', () => {
  const transition = read('components/shell/PageTransition.jsx');
  const shell = read('components/shell/AppShell.jsx');
  assert.match(transition, /AnimatePresence/);
  assert.match(transition, /useReducedMotion/);
  assert.match(transition, /y:\s*10/);
  assert.match(transition, /duration:\s*0\.2/);
  assert.match(transition, /duration:\s*0\.12/);
  assert.equal(/mode="wait"/.test(transition), false);
  assert.match(shell, /<PageTransition\s+activeKey=\{activePage\}>/);
  assert.ok(shell.indexOf('<Sidebar') < shell.indexOf('<PageTransition'));
  assert.ok(shell.indexOf('<TopBar') < shell.indexOf('<PageTransition'));
});

test('shell owns collapse/create-sheet state and mounts one presentation-only toast viewport', () => {
  const shell = read('components/shell/AppShell.jsx');
  const viewport = read('components/ui/ToastViewport.jsx');
  assert.match(shell, /sidebarCollapsed/);
  assert.match(shell, /createSheetOpen/);
  assert.equal((shell.match(/<ToastViewport/g) || []).length, 1);
  assert.match(viewport, /role=\{toast\.tone === ['"]error['"] \? ['"]alert['"] : ['"]status['"]\}/);
  assert.match(viewport, /slice\(-3\)/);
  assert.match(viewport, /onDismiss/);
});

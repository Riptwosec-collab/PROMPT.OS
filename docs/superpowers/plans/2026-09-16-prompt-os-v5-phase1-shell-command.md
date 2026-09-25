# Prompt.OS V5 Phase 1 Shell & Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the V5 Liquid Glass/HUD application shell, Mission Control foundation, navigation, and global command palette while keeping all existing prompt functionality available.

**Architecture:** Extract shell and command behavior into focused components and pure helper modules. Keep `components/PromptOS.jsx` as the temporary legacy-content owner, but mount it inside a V5 shell so later phases can migrate pages out without another visual rewrite.

**Tech Stack:** React 19.3, Next.js 16.3.5, Tailwind 4.3.3, existing runtime i18n, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-prompt-os-v5-design.md`

## Global Constraints

- No new UI framework dependency.
- Existing prompt CRUD/run/trash behavior must remain functional.
- TH/EN must cover all new visible labels.
- Command shortcuts must ignore non-modifier keys while focus is in input, textarea, select, or contenteditable.
- Respect `prefers-reduced-motion`.

---

### Task 1: Navigation and command model

**Files:**
- Create: `lib/ui/v5-navigation.mjs`
- Create: `lib/ui/command-palette.mjs`
- Test: `tests/v5-navigation.test.mjs`
- Test: `tests/command-palette.test.mjs`

**Interfaces:**
- Produces: `V5_NAV_ITEMS`, `normalizeV5Page(page)`, `shouldHandleShortcut(eventLike)`, `rankCommandItems(query, items)`.

- [ ] **Step 1: Write failing navigation tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeV5Page, V5_NAV_ITEMS } from '../lib/ui/v5-navigation.mjs';

test('V5 navigation contains approved pages and defaults to home', () => {
  assert.deepEqual(V5_NAV_ITEMS.map((item) => item.id), [
    'home','library','workspaces','evaluation','improve','analytics','cloud','trash','settings',
  ]);
  assert.equal(normalizeV5Page('unknown'), 'home');
});
```

- [ ] **Step 2: Run tests and verify failure**

```bash
node --test tests/v5-navigation.test.mjs tests/command-palette.test.mjs
```

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Implement minimal pure helpers**

```js
export const V5_NAV_ITEMS = [
  ['home','HOME'], ['library','LIBRARY'], ['workspaces','WORKSPACES'],
  ['evaluation','EVALUATION LAB'], ['improve','AI IMPROVE'], ['analytics','ANALYTICS'],
  ['cloud','CLOUD & BACKUPS'], ['trash','TRASH'], ['settings','SETTINGS'],
].map(([id, label]) => ({ id, label }));

export function normalizeV5Page(page) {
  return V5_NAV_ITEMS.some((item) => item.id === page) ? page : 'home';
}
```

`shouldHandleShortcut` must return `false` for editable targets unless the key uses Ctrl/Cmd. `rankCommandItems` performs case-insensitive title/keywords matching and returns commands before fuzzy prompt matches when scores tie.

- [ ] **Step 4: Run focused tests**

```bash
node --test tests/v5-navigation.test.mjs tests/command-palette.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ui/v5-navigation.mjs lib/ui/command-palette.mjs tests/v5-navigation.test.mjs tests/command-palette.test.mjs
git commit -m "feat: add V5 navigation and command model"
```

### Task 2: Liquid Glass shell

**Files:**
- Create: `components/shell/AppShell.jsx`
- Create: `components/shell/Sidebar.jsx`
- Create: `components/shell/TopBar.jsx`
- Create: `components/shell/StatusHud.jsx`
- Create: `components/shell/MobileDock.jsx`
- Modify: `app/globals.css`
- Modify: `components/PromptOS.jsx`
- Test: `tests/v5-shell-contract.test.mjs`

**Interfaces:**
- `AppShell({ activePage, onNavigate, status, children, onOpenCommand })`
- `status` shape: `{ mode, revision, pendingCount, lastSyncedAt, version }`.

- [ ] **Step 1: Add a failing source-contract test**

```js
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
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/v5-shell-contract.test.mjs
```

- [ ] **Step 3: Implement shell and design tokens**

Add CSS custom properties in `app/globals.css`:

```css
:root {
  --v5-bg: #02040a;
  --v5-glass: rgba(8, 15, 29, 0.68);
  --v5-line: rgba(103, 232, 249, 0.18);
  --v5-cyan: #67e8f9;
  --v5-violet: #a78bfa;
  --v5-success: #34d399;
  --v5-warning: #fbbf24;
  --v5-danger: #f87171;
}
.v5-glass { backdrop-filter: blur(18px); background: var(--v5-glass); border: 1px solid var(--v5-line); }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
```

Mount the existing legacy UI inside `AppShell` as the Library content first. Do not remove legacy actions.

- [ ] **Step 4: Run focused and full tests**

```bash
node --test tests/v5-shell-contract.test.mjs
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/shell app/globals.css components/PromptOS.jsx tests/v5-shell-contract.test.mjs
git commit -m "feat: add V5 liquid glass app shell"
```

### Task 3: Command Palette and Mission Control foundation

**Files:**
- Create: `components/command/CommandPalette.jsx`
- Create: `components/shell/HomeMissionControl.jsx`
- Modify: `components/PromptOS.jsx`
- Modify: `lib/i18n/runtime.mjs`
- Test: `tests/v5-command-ui-contract.test.mjs`
- Test: `tests/i18n-coverage.test.mjs`

**Interfaces:**
- `CommandPalette({ open, commands, prompts, onClose, onExecute })`
- `HomeMissionControl({ prompts, syncStatus, usageSummary, onNavigate, onNewPrompt })`.

- [ ] **Step 1: Add failing tests for required commands and translations**

```js
assert.match(source, /New Prompt/);
assert.match(source, /Open Evaluation Lab/);
assert.match(source, /Force Cloud Sync/);
assert.match(source, /Switch Workspace/);
```

Also extend i18n coverage expectations for Home, Library, Workspaces, Evaluation Lab, AI Improve, Analytics, Cloud & Backups, Settings, Command Palette.

- [ ] **Step 2: Run the focused tests and verify failure**

```bash
node --test tests/v5-command-ui-contract.test.mjs tests/i18n-coverage.test.mjs
```

- [ ] **Step 3: Implement palette behavior**

Register Ctrl/Cmd+K globally, Escape to close, ArrowUp/ArrowDown selection, Enter execution. Commands call existing handlers or navigation callbacks; unsupported future-page commands navigate to a labeled placeholder panel rather than failing silently.

- [ ] **Step 4: Verify Phase 1**

```bash
npm test
npm run build
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

Expected: all pass; existing prompt library remains reachable through Library.

- [ ] **Step 5: Commit**

```bash
git add components/command components/shell/HomeMissionControl.jsx components/PromptOS.jsx lib/i18n/runtime.mjs tests
git commit -m "feat: add V5 mission control and command palette"
```
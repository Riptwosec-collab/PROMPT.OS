# Prompt.OS V5 Phase 6 Reliability, Performance & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish V5 with robust error boundaries, responsive/mobile UX, accessibility, performance safeguards, and final rollout verification.

**Architecture:** Add cross-cutting reliability primitives without reopening completed domain designs. Use pure helpers for search/indexing/status and lightweight React boundaries/components for UI resilience. Preserve the established Liquid Glass/HUD design while reducing motion and GPU cost when appropriate.

**Tech Stack:** React 19.3, Next.js 16.3.5, Tailwind 4.3.3, Node test runner, OpenNext Cloudflare.

**Spec:** `docs/superpowers/specs/2026-09-16-prompt-os-v5-design.md`

## Global Constraints

- No white-screen failure for module errors.
- No secrets/tokens in diagnostics.
- Non-modifier shortcuts must not hijack typing.
- Reduced-motion users must get minimal animation.
- Mobile uses a bottom dock and bottom sheets rather than squeezed desktop columns.
- Library remains usable at 1,000+ prompt scale.

---

### Task 1: Error boundary and diagnostic sanitization

**Files:**
- Create: `components/shell/AppErrorBoundary.jsx`
- Create: `components/shell/ModuleErrorFallback.jsx`
- Create: `lib/ui/diagnostics.mjs`
- Modify: `app/page.jsx`
- Test: `tests/diagnostics.test.mjs`
- Test: `tests/error-boundary-contract.test.mjs`

**Interfaces:**
- `sanitizeDiagnostic(value)` removes bearer tokens, API-key-looking strings, email magic-link query fragments, and long JWT-like values.
- `ModuleErrorFallback({ moduleName, error, onRetry, onHome })`.

- [ ] **Step 1: Write failing sanitization tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeDiagnostic } from '../lib/ui/diagnostics.mjs';

test('diagnostics redact bearer tokens', () => {
  const result = sanitizeDiagnostic('Authorization: Bearer abc.def.ghi');
  assert.equal(result.includes('abc.def.ghi'), false);
  assert.match(result, /REDACTED/);
});
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/diagnostics.test.mjs tests/error-boundary-contract.test.mjs
```

- [ ] **Step 3: Implement error boundary and sanitized copy diagnostic flow**

`AppErrorBoundary` wraps the V5 app root. Module-level lazy panels use `ModuleErrorFallback`. Diagnostic copy includes module name, sanitized message, app version, and timestamp only.

- [ ] **Step 4: Verify focused tests**

```bash
node --test tests/diagnostics.test.mjs tests/error-boundary-contract.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add components/shell/AppErrorBoundary.jsx components/shell/ModuleErrorFallback.jsx lib/ui/diagnostics.mjs app/page.jsx tests
git commit -m "feat: add V5 error boundaries and safe diagnostics"
```

### Task 2: Search index and large-library performance

**Files:**
- Create: `lib/prompts/search-index.mjs`
- Modify: `components/PromptOS.jsx`
- Modify: `components/command/CommandPalette.jsx`
- Test: `tests/search-index.test.mjs`

**Interfaces:**
- `buildPromptSearchIndex(prompts, workspaceLookup, folderLookup)` -> array of normalized index rows.
- `searchPromptIndex(index, query, filters)` -> ranked IDs.

- [ ] **Step 1: Write failing correctness and scale tests**

```js
test('search includes workspace, folder and variables', () => {
  const index = buildPromptSearchIndex([{ id: '1', title: 'A', prompt: 'hello', tags: [], workspaceId: 'w', folderId: 'f', variableSchema: { topic: { label: 'Cloud Topic' } } }], new Map([['w','WORK']]), new Map([['f','NETWORK']]));
  assert.deepEqual(searchPromptIndex(index, 'network', {}).map((r) => r.id), ['1']);
});
```

Add a synthetic 1,000-prompt test that completes synchronously and returns deterministic results without mutating input.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/search-index.test.mjs
```

- [ ] **Step 3: Implement normalized index and debounced UI consumption**

Build the index only when prompt/workspace/folder data changes; query the prebuilt index on search input. Reuse it for Library and Command Palette prompt matching.

- [ ] **Step 4: Verify tests**

```bash
node --test tests/search-index.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add lib/prompts/search-index.mjs components/PromptOS.jsx components/command/CommandPalette.jsx tests/search-index.test.mjs
git commit -m "perf: add reusable prompt search index"
```

### Task 3: Responsive/mobile and accessibility pass

**Files:**
- Modify: `components/shell/AppShell.jsx`
- Modify: `components/shell/MobileDock.jsx`
- Create: `components/shell/BottomSheet.jsx`
- Modify: `components/command/CommandPalette.jsx`
- Modify: `components/prompts/PromptInspector.jsx`
- Modify: `app/globals.css`
- Test: `tests/accessibility-contract.test.mjs`

**Interfaces:**
- `BottomSheet({ open, title, onClose, children })` with dialog semantics, focus containment, Escape close, and focus restoration.

- [ ] **Step 1: Add failing accessibility contract tests**

Assert interactive icon buttons have `aria-label`, command palette/bottom sheet use dialog semantics, Escape handlers exist, and CSS includes `prefers-reduced-motion` plus mobile breakpoint behavior for bottom dock.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/accessibility-contract.test.mjs
```

- [ ] **Step 3: Implement mobile-native layouts and focus behavior**

Desktop keeps sidebar; tablet collapses to rail; mobile hides sidebar and uses bottom dock. Prompt inspector opens in `BottomSheet` on mobile. Avoid nested backdrop-filter layers deeper than two visual surfaces.

- [ ] **Step 4: Verify focused and full tests**

```bash
node --test tests/accessibility-contract.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add components/shell components/command/CommandPalette.jsx components/prompts/PromptInspector.jsx app/globals.css tests/accessibility-contract.test.mjs
git commit -m "feat: finish V5 responsive and accessible UX"
```

### Task 4: Final migration, offline, security, and deployment gates

**Files:**
- Modify only files required by findings from verification.
- Test: existing full suite plus targeted V5 tests.

**Interfaces:**
- No new public interfaces; this is a release gate.

- [ ] **Step 1: Run complete automated suite**

```bash
npm test
```

Expected: all legacy and V5 tests pass.

- [ ] **Step 2: Run production build gates**

```bash
npm run build
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

Expected: OpenNext worker builds and Wrangler dry-run succeeds.

- [ ] **Step 3: Run manual scenario matrix**

Verify at minimum:

```text
fresh local-only launch
legacy V4 database upgrade
signed-in Cloud-first launch
edit -> local immediate save -> cloud debounce save
offline edit -> queued mutation -> reconnect
stale revision -> recovery snapshot -> cloud pull
soft delete -> trash -> restore
permanent delete -> two confirmations
AI Improve -> save as new version
Evaluation partial failure -> retry failed pair
budget warning and hard-limit behavior
TH/EN across new pages
keyboard-only navigation
mobile bottom dock and inspector bottom sheet
```

- [ ] **Step 4: Re-run Supabase security/performance advisors after final schema/index state**

Resolve high-severity security findings and clearly document any accepted performance advisory.

- [ ] **Step 5: Final release commit**

```bash
git add -A
git commit -m "chore: finalize Prompt.OS V5 release gates"
```

Do not merge to `main` until the final commit is green in CI.
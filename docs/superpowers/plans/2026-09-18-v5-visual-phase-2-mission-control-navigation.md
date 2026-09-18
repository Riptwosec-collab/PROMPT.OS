# Prompt.OS V5 Visual Phase 2 Mission Control & Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Mission Control home, morphing desktop navigation, floating mobile dock, and first-class command palette on top of the Phase 1 visual/motion foundation without fabricating usage or sync telemetry.

**Architecture:** Reuse the existing prompt catalog/state and command ranking logic. Extract shared browser prompt-state loading from `PromptLibraryV5` so Mission Control and Library read the same records; render data-driven Home sections only when real data exists. Navigation remains controlled by `app/page.jsx`, while Motion handles chrome transitions and the existing `V5_COMMAND_PALETTE` flag controls command capability.

**Tech Stack:** Next 16.3.5, React 19.3.0, Tailwind 4.3.3, Motion for React, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-18-prompt-os-v5-visual-motion-system-design.md`

## Global Constraints

- Phase 1 Visual + Motion Foundation must be merged first.
- Add only `V5_MISSION_CONTROL`; reuse existing `V5_COMMAND_PALETTE`, `V5_WORKSPACE`, `V5_CLOUD_SYNC`, and `V5_USAGE_ANALYTICS` flags.
- All flags default false.
- Mission Control must not display made-up tokens, cost, latency, success rate, or cloud sync state.
- Empty sections disappear instead of showing fake fixture values.
- Legacy PromptOS and Library fallback remain available.
- Existing prompt records remain single-source and the built-in catalog remains exactly 80.
- No production DB migration or production deploy.

---

## File Structure

**Create**
- `lib/prompts/client-store.mjs` — shared local browser database parsing/merge/migration helpers.
- `lib/home/mission-control.mjs` — pure Mission Control selectors/view model.
- `lib/ui/command-items.mjs` — maps navigation/prompts/actions into the existing command-ranking shape.
- `components/home/MissionControl.jsx`
- `components/command/CommandPaletteV5.jsx`
- `components/shell/CreateActionSheet.jsx`
- `tests/mission-control.test.mjs`
- `tests/mission-control-ui-contract.test.mjs`
- `tests/command-palette-v5-ui.test.mjs`
- `tests/navigation-motion-ui.test.mjs`

**Modify**
- `lib/ui/feature-flags.mjs`
- `tests/feature-flags.test.mjs`
- `components/prompt/PromptLibraryV5.jsx`
- `components/shell/AppShell.jsx`
- `components/shell/Sidebar.jsx`
- `components/shell/TopBar.jsx`
- `components/shell/MobileDock.jsx`
- `lib/ui/v5-navigation.mjs`
- `app/page.jsx`
- `lib/i18n/catalog-th.mjs`
- `tests/i18n-coverage.test.mjs`

## Task 1: Shared Prompt Client Store and Mission Control View Model

**Interfaces:**
- `readStoredPromptDatabase(storage, key='promptVaultData') -> object|array|null`.
- `loadPromptCatalogState(storage, catalog) -> { prompts, database }`; it merges catalog data and runs existing V5 migration.
- `persistPromptCatalogState(storage, prompts, baseDatabase) -> void` preserves unrelated database fields and writes schema/catalog version.
- `buildMissionControlModel(prompts, { now }) -> { continueWorking, featured, smartCollections, usage }`.
- `usage` contains only metrics derivable from real records: `runs`, `copies`; unsupported token/cost/latency fields are absent, not zero-filled.

- [ ] **Step 1: Write RED tests** in `tests/mission-control.test.mjs` for corrupted JSON fallback, catalog merge, recent prompt ordering, empty recent section, and absence of unsupported telemetry:

```js
test('mission control never invents execution telemetry', () => {
  const model = buildMissionControlModel([{ id: 1, name: 'A', runs: 2, copyCount: 3 }], { now: new Date('2026-09-18T00:00:00Z') });
  assert.equal(model.usage.runs, 2);
  assert.equal(model.usage.copies, 3);
  assert.equal('tokens' in model.usage, false);
  assert.equal('cost' in model.usage, false);
  assert.equal('latency' in model.usage, false);
});
```

- [ ] **Step 2: Run RED.** `node --test tests/mission-control.test.mjs`.
- [ ] **Step 3: Move the local-store logic** currently private to `PromptLibraryV5.jsx` into `lib/prompts/client-store.mjs`. Accept a Storage-like object as an argument so unit tests do not require `window`.
- [ ] **Step 4: Update `PromptLibraryV5.jsx`** to call the extracted functions with `window.localStorage`; behavior and storage key stay unchanged.
- [ ] **Step 5: Implement `buildMissionControlModel`.** Reuse `buildSmartCollections`; select at most 2 `recentlyUsed` records for Continue Working; derive featured prompts deterministically from highest usage then catalog order; expose real run/copy totals only.
- [ ] **Step 6: Run GREEN plus storage regressions.** `node --test tests/mission-control.test.mjs tests/v5-core-ui-contract.test.mjs tests/smart-collections.test.mjs`.
- [ ] **Step 7: Commit.** `git add lib/prompts/client-store.mjs lib/home/mission-control.mjs components/prompt/PromptLibraryV5.jsx tests/mission-control.test.mjs && git commit -m "refactor: share prompt state with mission control"`.

## Task 2: Add Mission Control Flag and Home Surface

**Interfaces:**
- `V5_MISSION_CONTROL` is strict/default-off.
- `<MissionControl onOpenCommand onOpenPrompt onNavigate cloudStatus usageEnabled />` reads shared local prompt state on mount.
- Home sections: Hero Command Bar, Continue Working, Usage Pulse when real metrics exist, Featured Packs/Prompts, Prompt Health summary, Smart Collections; cloud status appears only when `cloudStatus` is non-null.

- [ ] **Step 1: Extend `tests/feature-flags.test.mjs`** with `V5_MISSION_CONTROL` and a strict true/default-off assertion.
- [ ] **Step 2: Add RED UI contract** `tests/mission-control-ui-contract.test.mjs` that asserts the component includes `Search prompts, commands, workflows`, `Continue Working`, `Smart Collections`, and conditionally renders telemetry rather than hard-coding token/cost/latency values.
- [ ] **Step 3: Run RED.** `node --test tests/feature-flags.test.mjs tests/mission-control-ui-contract.test.mjs`.
- [ ] **Step 4: Add `V5_MISSION_CONTROL`** to `lib/ui/feature-flags.mjs` and environment mapping.
- [ ] **Step 5: Implement `MissionControl.jsx`.** Use `GlassSurface`, `GlassGlyph`, `MetricChip`, `AnimatedNumber`, and Motion layout primitives from Phase 1. Hero command bar calls `onOpenCommand`; cards call explicit callbacks. Hide Continue Working when empty and hide each unsupported telemetry chip.
- [ ] **Step 6: Wire Home in `app/page.jsx`.** When `V5_MISSION_CONTROL` is true and `activePage==='home'`, render Mission Control. Initial page is `home` only when the flag is true; otherwise retain current `library` initial behavior so enabling unrelated V5 flags never lands users on a placeholder Home.
- [ ] **Step 7: Run GREEN.** `node --test tests/feature-flags.test.mjs tests/mission-control.test.mjs tests/mission-control-ui-contract.test.mjs tests/v5-core-ui-contract.test.mjs`.
- [ ] **Step 8: Commit.** `git add lib/ui/feature-flags.mjs tests/feature-flags.test.mjs components/home/MissionControl.jsx app/page.jsx tests/mission-control-ui-contract.test.mjs && git commit -m "feat: add mission control home"`.

## Task 3: Build Command Items and Command Palette V5

**Interfaces:**
- `buildCommandItems({ navItems, prompts, actions=[] }) -> Array<{ id, kind, title, keywords, action }>`; kinds are `command`, `navigation`, `prompt`.
- Continue using `rankCommandItems(query, items)` and `shouldHandleShortcut(eventLike)` from `lib/ui/command-palette.mjs`.
- `<CommandPaletteV5 open items onClose onExecute />` supports ArrowUp/ArrowDown, Enter, Escape, focus restoration, `role="dialog"`, `aria-modal="true"`, and a combobox/listbox relationship.

- [ ] **Step 1: Extend model tests** in `tests/command-palette.test.mjs` for navigation/prompt item construction and stable ranking.
- [ ] **Step 2: Add RED component contract** `tests/command-palette-v5-ui.test.mjs` asserting `role="dialog"`, `aria-modal`, ArrowDown/ArrowUp/Enter/Escape handling, and `AnimatePresence`.
- [ ] **Step 3: Run RED.** `node --test tests/command-palette.test.mjs tests/command-palette-v5-ui.test.mjs`.
- [ ] **Step 4: Implement `lib/ui/command-items.mjs`.** Navigation actions return `{ type: 'navigate', page }`; prompt actions return `{ type: 'prompt', promptId }`; action entries preserve their explicit action payload.
- [ ] **Step 5: Implement `CommandPaletteV5.jsx`.** On open, save `document.activeElement`, focus the search input, rank with the existing model, clamp selection after result changes, execute selected item on Enter, close on Escape, and restore prior focus on close. Use Motion spring on desktop and a full-screen sheet breakpoint on mobile.
- [ ] **Step 6: Wire `Ctrl/Meta+K` in `app/page.jsx`.** Register one document keydown listener only when `V5_COMMAND_PALETTE` is enabled; use `shouldHandleShortcut`. Slash-to-search remains a later Library interaction unless existing Search V2 already exposes a focus seam.
- [ ] **Step 7: Run GREEN.** `node --test tests/command-palette.test.mjs tests/command-palette-v5-ui.test.mjs`.
- [ ] **Step 8: Commit.** `git add lib/ui/command-items.mjs components/command/CommandPaletteV5.jsx app/page.jsx tests/command-palette.test.mjs tests/command-palette-v5-ui.test.mjs && git commit -m "feat: add command palette v5"`.

## Task 4: Morphing Desktop Sidebar, Top Bar, and Floating Mobile Dock

**Interfaces:**
- `AppShell` owns `sidebarCollapsed` local UI state only; no persistence in this phase.
- `Sidebar({ activePage, onNavigate, collapsed, onToggleCollapsed })` uses Motion layout animation and stable icon/glyph alignment.
- `TopBar({ activePage, onOpenCommand, commandEnabled, status })` shows command shortcut only when enabled and real status only when provided.
- `MobileDock({ activePage, onNavigate, onNewPrompt, onOpenMore })` presents Library, Workspaces, Create, Activity (routes to analytics), More.
- `CreateActionSheet` exposes New Prompt / New Workflow / Import Prompt; unavailable callbacks render disabled controls rather than fake actions.

- [ ] **Step 1: Add RED contract tests** in `tests/navigation-motion-ui.test.mjs` for collapsed/expanded Sidebar props, a shared Motion `layoutId` active indicator, safe-area mobile dock CSS, and disabled create actions when callbacks are absent.
- [ ] **Step 2: Run RED.** `node --test tests/navigation-motion-ui.test.mjs`.
- [ ] **Step 3: Update `Sidebar.jsx`.** Replace the current dot-only active state with one shared active rail/background element using `layoutId="v5-nav-active"`; animate width via Motion spring while keeping icons in a fixed-width cell.
- [ ] **Step 4: Update `TopBar.jsx`.** Reduce technical uppercase density; use breadcrumb/current page and conditionally expose the command button. Preserve TH/EN display until language-control behavior is separately changed.
- [ ] **Step 5: Update `MobileDock.jsx` and add `CreateActionSheet.jsx`.** Respect `env(safe-area-inset-bottom)`, use Motion active indicator, no hover dependency, and at least 44px tap targets.
- [ ] **Step 6: Update `AppShell.jsx`.** Manage sidebar collapse and create-sheet open state; keep child page content mounted independently of shell chrome transitions.
- [ ] **Step 7: Run GREEN.** `node --test tests/navigation-motion-ui.test.mjs tests/feature-flag-integration.test.mjs`.
- [ ] **Step 8: Commit.** `git add components/shell lib/ui/v5-navigation.mjs tests/navigation-motion-ui.test.mjs && git commit -m "feat: upgrade v5 navigation motion"`.

## Task 5: Localization, Accessibility, and Phase Verification

- [ ] **Step 1: Add Thai catalog entries** for Mission Control, Continue Working, Usage, Runs, Copies, Smart Collections, Search anything, Create, Activity, More, New Prompt, New Workflow, Import Prompt, Close, and command-palette empty state.
- [ ] **Step 2: Extend `tests/i18n-coverage.test.mjs`** so each new visible English source label resolves through `translateCatalogThai('th', text)`.
- [ ] **Step 3: Run targeted accessibility/model tests.** `node --test tests/i18n-coverage.test.mjs tests/command-palette-v5-ui.test.mjs tests/navigation-motion-ui.test.mjs tests/mission-control-ui-contract.test.mjs`.
- [ ] **Step 4: Run full suite.** `npm test`; confirm 80-prompt regression and Legacy fallback remain green.
- [ ] **Step 5: Build.** `npm run build` and verify `.open-next/worker.js`, `.open-next/assets`, `.open-next/.build/open-next.config.edge.mjs`.
- [ ] **Step 6: Cloudflare dry-run.** `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`.
- [ ] **Step 7: Scope audit.** Run `git diff --name-only "$(git merge-base main HEAD)"...HEAD`; confirm no Supabase migration, provider implementation, or prompt catalog content changed.
- [ ] **Step 8: Open Phase 2 PR and stop before merge.** Record exact verification results and require separate explicit `merge` authorization. Do not deploy production.

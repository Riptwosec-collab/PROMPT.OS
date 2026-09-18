# Prompt.OS V5 Visual Phase 2 Mission Control & Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Mission Control home, morphing desktop navigation, floating mobile dock, first-class command palette, stable page transitions, and bounded toast feedback on top of the Phase 1 visual/motion foundation without fabricating usage or sync telemetry.

**Architecture:** Reuse the existing prompt catalog/state, prompt health scorer, pack model, smart collections, and command ranking logic. Extract shared browser prompt-state loading and default-pack construction from `PromptLibraryV5` so Mission Control, global command search, and Library consume the same records and pack references. `app/page.jsx` owns a small one-shot Library request seam so Home/Command Palette can navigate to a prompt, pack, or smart collection without duplicating Library state. Motion handles chrome/page transitions and the existing `V5_COMMAND_PALETTE` flag controls command capability.

**Tech Stack:** Next 16.3.5, React 19.3.0, Tailwind 4.3.3, Motion for React, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-18-prompt-os-v5-visual-motion-system-design.md`

## Global Constraints

- Phase 1 Visual + Motion Foundation must be merged first.
- Add only `V5_MISSION_CONTROL`; reuse existing `V5_COMMAND_PALETTE`, `V5_WORKSPACE`, `V5_CLOUD_SYNC`, `V5_USAGE_ANALYTICS`, `V5_PROMPT_HEALTH`, and `V5_SMART_COLLECTIONS` flags.
- All flags default false.
- Mission Control must not display made-up tokens, cost, latency, success rate, or cloud sync state.
- Empty sections disappear instead of showing fake fixture values.
- Legacy PromptOS and Library fallback remain available.
- Existing prompt records remain single-source and the built-in catalog remains exactly 80.
- Prompt Packs remain reference-only; default pack extraction must not clone prompt records.
- Page transitions animate content only; the shell/navigation remains mounted and immediately interactive.
- Toast stack is capped at 3 and is a presentation primitive only; it does not replace local confirmation when the triggering control can show `Copied`/`Saved` itself.
- Global Home/Command Palette navigation may request a Library destination, but `PromptLibraryV5` remains the owner of selected prompt and active view state.
- No production DB migration or production deploy.

---

## File Structure

**Create**
- `lib/prompts/client-store.mjs` — shared local browser database parsing/merge/migration helpers.
- `lib/prompts/default-packs.mjs` — default pack blueprints and reference-only resolver shared by Home and Library.
- `lib/home/mission-control.mjs` — pure Mission Control selectors/view model.
- `lib/ui/command-items.mjs` — maps navigation/prompts/actions into the existing command-ranking shape.
- `lib/ui/toast-queue.mjs` — pure bounded queue helper with max visible size 3.
- `components/home/MissionControl.jsx`
- `components/command/CommandPaletteV5.jsx`
- `components/shell/CreateActionSheet.jsx`
- `components/shell/PageTransition.jsx`
- `components/ui/ToastViewport.jsx`
- `tests/mission-control.test.mjs`
- `tests/mission-control-ui-contract.test.mjs`
- `tests/command-palette-v5-ui.test.mjs`
- `tests/navigation-motion-ui.test.mjs`
- `tests/toast-queue.test.mjs`

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

## Task 1: Shared Prompt Client Store, Default Packs, and Mission Control View Model

**Interfaces:**
- `readStoredPromptDatabase(storage, key='promptVaultData') -> object|array|null`.
- `loadPromptCatalogState(storage, catalog) -> { prompts, database }`; it merges catalog data and runs existing V5 migration.
- `persistPromptCatalogState(storage, prompts, baseDatabase) -> void` preserves unrelated database fields and writes schema/catalog version.
- `DEFAULT_PACK_BLUEPRINTS` contains the existing Network Engineer, Research, and Developer name-based definitions.
- `buildDefaultPacks(prompts) -> Pack[]` resolves prompt IDs and delegates pack construction to existing `createPack`; no prompt object cloning.
- `buildMissionControlModel(prompts, { now, packs }) -> { continueWorking, featuredPacks, smartCollections, usage, healthSummary, activity }`.
- `usage` contains only metrics derivable from real prompt records: `runs`, `copies`; unsupported token/cost/latency fields are absent, not zero-filled.
- `healthSummary` is `{ average, analyzedCount }`, calculated with the existing deterministic `scorePromptHealth` over actual prompts.
- `activity` is derived only from prompts that already have real recent-use timestamps; no synthetic events.

- [ ] **Step 1: Write RED tests** in `tests/mission-control.test.mjs` for corrupted JSON fallback, catalog merge, default-pack reference semantics, recent prompt ordering, empty recent/activity sections, deterministic health average, and absence of unsupported telemetry:

```js
test('mission control never invents execution telemetry', () => {
  const model = buildMissionControlModel([{ id: 1, name: 'A', prompt: 'Role: expert\nTask: test\nOutput: list', runs: 2, copyCount: 3 }], {
    now: new Date('2026-09-18T00:00:00Z'),
    packs: [],
  });
  assert.equal(model.usage.runs, 2);
  assert.equal(model.usage.copies, 3);
  assert.equal('tokens' in model.usage, false);
  assert.equal('cost' in model.usage, false);
  assert.equal('latency' in model.usage, false);
  assert.equal(model.healthSummary.analyzedCount, 1);
});
```

- [ ] **Step 2: Run RED.** `node --test tests/mission-control.test.mjs`.
- [ ] **Step 3: Move shared local-store and default-pack logic** currently private to `PromptLibraryV5.jsx` into `lib/prompts/client-store.mjs` and `lib/prompts/default-packs.mjs`. Accept a Storage-like object in store helpers so unit tests do not require `window`.
- [ ] **Step 4: Update `PromptLibraryV5.jsx`** to call the extracted store/default-pack functions; storage key, catalog merge, migrations, and Pack behavior stay unchanged.
- [ ] **Step 5: Implement `buildMissionControlModel`.** Reuse `buildSmartCollections` and `scorePromptHealth`; select at most 2 `recentlyUsed` records for Continue Working; pass through resolved reference-only packs; build activity from actual recent-use timestamps; expose real run/copy totals only.
- [ ] **Step 6: Run GREEN plus regressions.** `node --test tests/mission-control.test.mjs tests/v5-core-ui-contract.test.mjs tests/smart-collections.test.mjs tests/prompt-health-v2.test.mjs`.
- [ ] **Step 7: Commit.** `git add lib/prompts/client-store.mjs lib/prompts/default-packs.mjs lib/home/mission-control.mjs components/prompt/PromptLibraryV5.jsx tests/mission-control.test.mjs && git commit -m "refactor: share prompt state with mission control"`.

## Task 2: Add Mission Control Flag, Library Request Seam, and Complete Home Surface

**Interfaces:**
- `V5_MISSION_CONTROL` is strict/default-off.
- `libraryRequest` owned by `app/page.jsx` is either `null`, `{ type:'prompt', id }`, or `{ type:'view', viewId }` where view IDs match existing Library internal forms such as `pack:network-engineer` or `recentlyUsed`.
- `PromptLibraryV5` gains optional props `externalRequest=null`, `onExternalRequestHandled` and a `hydrated` boolean. A prompt request is handled only after hydration and only when the requested prompt exists; a view request updates `activeView`. The handled callback clears the one-shot request so closing detail does not immediately reopen it.
- `<MissionControl onOpenCommand onOpenPrompt onOpenPack onOpenCollection onNavigate cloudStatus usageEnabled healthEnabled smartCollectionsEnabled />` reads the shared local prompt state on mount and resolves default packs with `buildDefaultPacks`.
- Required sections: Hero Command Bar; Continue Working when non-empty; AI Usage Pulse only when `usageEnabled` and real run/copy metrics exist; Featured Prompt Packs; Cloud/Sync only when a real `cloudStatus` is supplied; Prompt Health Summary only when `healthEnabled`; Activity Timeline when real activity exists; Smart Collections only when `smartCollectionsEnabled`.

- [ ] **Step 1: Extend `tests/feature-flags.test.mjs`** with `V5_MISSION_CONTROL` and a strict true/default-off assertion.
- [ ] **Step 2: Add RED UI contract** `tests/mission-control-ui-contract.test.mjs` asserting the component includes `Search prompts, commands, workflows`, `Continue Working`, `Featured Prompt Packs`, `Prompt Health`, `Activity`, and `Smart Collections`, while telemetry/cloud sections are conditional rather than hard-coded. Also assert `app/page.jsx` has `libraryRequest`, and `PromptLibraryV5.jsx` accepts `externalRequest` plus `onExternalRequestHandled`.
- [ ] **Step 3: Run RED.** `node --test tests/feature-flags.test.mjs tests/mission-control-ui-contract.test.mjs`.
- [ ] **Step 4: Add `V5_MISSION_CONTROL`** to `lib/ui/feature-flags.mjs` and environment mapping.
- [ ] **Step 5: Implement the one-shot Library request seam.** In `app/page.jsx`, add helpers that set `{ type:'prompt', id }` / `{ type:'view', viewId }` then navigate to `library`; clear only from `onExternalRequestHandled`. In `PromptLibraryV5`, set `hydrated=true` after loading local data, then consume a valid request in an effect. If a hydrated prompt request cannot be found, clear it without opening arbitrary content.
- [ ] **Step 6: Implement `MissionControl.jsx`.** Use `GlassSurface`, `GlassGlyph`, `MetricChip`, `AnimatedNumber`, and Motion layout primitives from Phase 1. Render resolved default packs as showcase cards with CSS/SVG micrographics. Hero command bar calls `onOpenCommand`; recent prompts call `onOpenPrompt(id)`; pack cards call `onOpenPack('pack:' + pack.id)`; smart collection tiles call `onOpenCollection(key)`. Hide every empty/disabled section.
- [ ] **Step 7: Wire Home in `app/page.jsx`.** When `V5_MISSION_CONTROL` is true and `activePage==='home'`, render Mission Control. Initial page is `home` only when the flag is true; otherwise retain current `library` initial behavior so enabling unrelated V5 flags never lands users on placeholder Home. Pass `healthEnabled` from `V5_PROMPT_HEALTH`, `smartCollectionsEnabled` from `V5_SMART_COLLECTIONS`, and `usageEnabled` from `V5_USAGE_ANALYTICS`. Pass `cloudStatus=null` until a real cloud-sync state seam is available; do not reuse the current preview shell status as cloud telemetry.
- [ ] **Step 8: Run GREEN.** `node --test tests/feature-flags.test.mjs tests/mission-control.test.mjs tests/mission-control-ui-contract.test.mjs tests/v5-core-ui-contract.test.mjs`.
- [ ] **Step 9: Commit.** `git add lib/ui/feature-flags.mjs tests/feature-flags.test.mjs components/home/MissionControl.jsx components/prompt/PromptLibraryV5.jsx app/page.jsx tests/mission-control-ui-contract.test.mjs && git commit -m "feat: add mission control home"`.

## Task 3: Build Command Items and Command Palette V5

**Interfaces:**
- `buildCommandItems({ navItems, prompts, actions=[] }) -> Array<{ id, kind, title, keywords, action }>`; kinds are `command`, `navigation`, `prompt`.
- Continue using `rankCommandItems(query, items)` and `shouldHandleShortcut(eventLike)` from `lib/ui/command-palette.mjs`.
- `<CommandPaletteV5 open items onClose onExecute />` supports ArrowUp/ArrowDown, Enter, Escape, focus restoration, `role="dialog"`, `aria-modal="true"`, and a combobox/listbox relationship.
- `openCommandPalette()` in `app/page.jsx` performs a fresh `loadPromptCatalogState(window.localStorage, AI_PROMPT_LIBRARY)` read at open time, then builds items. This avoids stale prompt titles without introducing a second long-lived prompt state owner.
- Prompt command execution calls the same `libraryRequest` helper from Task 2; navigation command execution calls `navigate(page)`.

- [ ] **Step 1: Extend model tests** in `tests/command-palette.test.mjs` for navigation/prompt item construction and stable ranking.
- [ ] **Step 2: Add RED component contract** `tests/command-palette-v5-ui.test.mjs` asserting `role="dialog"`, `aria-modal`, ArrowDown/ArrowUp/Enter/Escape handling, `AnimatePresence`, fresh `loadPromptCatalogState` use when opening, and prompt actions routed through the Library request seam.
- [ ] **Step 3: Run RED.** `node --test tests/command-palette.test.mjs tests/command-palette-v5-ui.test.mjs`.
- [ ] **Step 4: Implement `lib/ui/command-items.mjs`.** Navigation actions return `{ type: 'navigate', page }`; prompt actions return `{ type: 'prompt', promptId }`; action entries preserve their explicit action payload.
- [ ] **Step 5: Implement `CommandPaletteV5.jsx`.** On open, save `document.activeElement`, focus the search input, rank with the existing model, clamp selection after result changes, execute selected item on Enter, close on Escape, and restore prior focus on close. Use Motion spring on desktop and a full-screen sheet breakpoint on mobile.
- [ ] **Step 6: Wire palette opening/execution in `app/page.jsx`.** Register one document keydown listener only when `V5_COMMAND_PALETTE` is enabled; use `shouldHandleShortcut` for `Ctrl/Meta+K`. On open, read fresh prompts and build items. On execute, route navigation directly and prompt actions through `libraryRequest`; then close. Slash-to-search is handled by the Premium Prompt phase where a Library search ref exists.
- [ ] **Step 7: Run GREEN.** `node --test tests/command-palette.test.mjs tests/command-palette-v5-ui.test.mjs tests/mission-control-ui-contract.test.mjs`.
- [ ] **Step 8: Commit.** `git add lib/ui/command-items.mjs components/command/CommandPaletteV5.jsx app/page.jsx tests/command-palette.test.mjs tests/command-palette-v5-ui.test.mjs && git commit -m "feat: add command palette v5"`.

## Task 4: Morphing Navigation, Stable Page Motion, and Toast Feedback

**Interfaces:**
- `AppShell` owns `sidebarCollapsed` local UI state only; no persistence in this phase.
- `Sidebar({ activePage, onNavigate, collapsed, onToggleCollapsed })` uses Motion layout animation and stable icon/glyph alignment.
- `TopBar({ activePage, onOpenCommand, commandEnabled, status })` shows command shortcut only when enabled and real status only when provided.
- `MobileDock({ activePage, onNavigate, onNewPrompt, onOpenMore })` presents Library, Workspaces, Create, Activity (routes to analytics), More.
- `CreateActionSheet` exposes New Prompt / New Workflow / Import Prompt; unavailable callbacks render disabled controls rather than fake actions.
- `<PageTransition activeKey>{children}</PageTransition>` keeps the shell outside the animated boundary. Enter uses opacity 0 -> 1 and y 10 -> 0 in ~200ms; exit uses opacity 1 -> 0 in ~120ms with no full-screen wipe. Enter/exit run concurrently; navigation must not wait for exit completion.
- `enqueueToast(queue, toast, limit=3)` de-duplicates by `toast.id`, appends newest, and returns only the last `limit` items.
- `<ToastViewport toasts onDismiss />` renders a max-3 glass stack: desktop top-right, mobile above the dock; each item has an explicit dismiss control.

- [ ] **Step 1: Add RED navigation/page-transition contract tests** in `tests/navigation-motion-ui.test.mjs` for collapsed/expanded Sidebar props, a shared Motion `layoutId` active indicator, safe-area mobile dock CSS, disabled create actions when callbacks are absent, persistent AppShell outside `PageTransition`, and transition values 10px / 0.20s / 0.12s.
- [ ] **Step 2: Add RED toast unit tests** in `tests/toast-queue.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueToast } from '../lib/ui/toast-queue.mjs';

test('toast queue keeps at most three newest unique items', () => {
  let queue = [];
  for (const id of ['a', 'b', 'c', 'd']) queue = enqueueToast(queue, { id, message: id });
  assert.deepEqual(queue.map((item) => item.id), ['b', 'c', 'd']);
  queue = enqueueToast(queue, { id: 'd', message: 'updated' });
  assert.deepEqual(queue.map((item) => item.id), ['b', 'c', 'd']);
  assert.equal(queue.at(-1).message, 'updated');
});
```

- [ ] **Step 3: Run RED.** `node --test tests/navigation-motion-ui.test.mjs tests/toast-queue.test.mjs`.
- [ ] **Step 4: Implement `PageTransition.jsx`.** Use `AnimatePresence` without `mode="wait"`; key the inner `motion.div` by `activeKey`, preserve child interactivity, and use reduced-motion fade-only transitions.
- [ ] **Step 5: Update `Sidebar.jsx`.** Replace the current dot-only active state with one shared active rail/background element using `layoutId="v5-nav-active"`; animate width via Motion spring while keeping icons in a fixed-width cell.
- [ ] **Step 6: Update `TopBar.jsx`.** Reduce technical uppercase density; use breadcrumb/current page and conditionally expose the command button. Preserve TH/EN display until language-control behavior is separately changed.
- [ ] **Step 7: Update `MobileDock.jsx` and add `CreateActionSheet.jsx`.** Respect `env(safe-area-inset-bottom)`, use Motion active indicator, no hover dependency, and at least 44px tap targets.
- [ ] **Step 8: Implement bounded toast primitives.** `lib/ui/toast-queue.mjs` stays pure; `ToastViewport.jsx` is presentational, uses `role="status"` for non-error messages and `role="alert"` for error tone, and never displays more than the three items passed to it.
- [ ] **Step 9: Update `AppShell.jsx`.** Manage sidebar collapse/create-sheet state, wrap only page content in `PageTransition activeKey={activePage}`, and provide a single ToastViewport mount point. Do not invent notification events in this task; future features pass real toast state/callbacks through an explicit seam.
- [ ] **Step 10: Run GREEN.** `node --test tests/navigation-motion-ui.test.mjs tests/toast-queue.test.mjs tests/feature-flag-integration.test.mjs`.
- [ ] **Step 11: Commit.** `git add components/shell components/ui/ToastViewport.jsx lib/ui/v5-navigation.mjs lib/ui/toast-queue.mjs tests/navigation-motion-ui.test.mjs tests/toast-queue.test.mjs && git commit -m "feat: upgrade v5 navigation and feedback motion"`.

## Task 5: Localization, Accessibility, and Phase Verification

- [ ] **Step 1: Add Thai catalog entries** for Mission Control, Continue Working, Usage, Runs, Copies, Featured Prompt Packs, Prompt Health, Activity, Smart Collections, Search anything, Create, More, New Prompt, New Workflow, Import Prompt, Close, Dismiss, and command-palette empty state.
- [ ] **Step 2: Extend `tests/i18n-coverage.test.mjs`** so each new visible English source label resolves through `translateCatalogThai('th', text)`.
- [ ] **Step 3: Run targeted accessibility/model tests.** `node --test tests/i18n-coverage.test.mjs tests/command-palette-v5-ui.test.mjs tests/navigation-motion-ui.test.mjs tests/toast-queue.test.mjs tests/mission-control-ui-contract.test.mjs`.
- [ ] **Step 4: Run full suite.** `npm test`; confirm 80-prompt regression, Pack reference semantics, Prompt Health, and Legacy fallback remain green.
- [ ] **Step 5: Build.** `npm run build` and verify `.open-next/worker.js`, `.open-next/assets`, `.open-next/.build/open-next.config.edge.mjs`.
- [ ] **Step 6: Cloudflare dry-run.** `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`.
- [ ] **Step 7: Scope audit.** Run `git diff --name-only "$(git merge-base main HEAD)"...HEAD`; confirm no Supabase migration, provider implementation, or prompt catalog content changed.
- [ ] **Step 8: Open Phase 2 PR and stop before merge.** Record exact verification results and require separate explicit `merge` authorization. Do not deploy production.

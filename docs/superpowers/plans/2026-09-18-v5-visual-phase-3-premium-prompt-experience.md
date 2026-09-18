# Prompt.OS V5 Visual Phase 3 Premium Prompt Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain V5 prompt grid/detail presentation with Spacious Showcase Premium Intelligence Cards, smooth search/filter reflow, mobile quick actions, and shared card-to-detail spatial transitions while preserving all Phase 1 prompt behavior.

**Architecture:** Keep Search V2, Variables V2, Prompt Health, Smart Collections, Packs, and persistence models unchanged. Add presentational card/transition components around those existing seams; Motion `layout`/`layoutId` provides reflow/shared geometry, and `useReducedMotion` selects fade-only fallbacks. Feature flags independently gate cards and shared transitions.

**Tech Stack:** Next 16.3.5, React 19.3.0, Tailwind 4.3.3, Motion for React, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-18-prompt-os-v5-visual-motion-system-design.md`

## Global Constraints

- Phase 1 Visual Foundation must be merged; Phase 2 Mission Control may be merged independently but is not required for card correctness.
- Add `V5_PREMIUM_CARDS` and `V5_SHARED_PROMPT_TRANSITION`, both default false.
- `V5_SEARCH` continues to own Search V2 capability; premium cards only enhance its presentation.
- `V5_PROMPT_DETAIL` continues to own Prompt Detail capability; shared transition must never create a second detail implementation.
- `V5_PROMPT_HEALTH` remains the authority for whether Prompt Health data is shown; card health values use the existing local deterministic `scorePromptHealth` only.
- Variables V2 values and validation, Prompt Health calculation, Smart Collections, Packs, and workspace reference semantics stay unchanged.
- Fine-pointer effects are disabled on coarse pointers and under reduced motion.
- No destructive swipe actions.
- Exactly 80 built-in prompts remain intact.
- No production DB/provider/deployment changes.

---

## File Structure

**Create**
- `lib/ui/prompt-transition.mjs` — deterministic shared layout IDs and transition-mode selection.
- `components/prompt/PromptCardV5.jsx`
- `components/prompt/PromptQuickActionsSheet.jsx`
- `tests/premium-prompt-card.test.mjs`
- `tests/premium-prompt-ui-contract.test.mjs`
- `tests/shared-prompt-transition.test.mjs`

**Modify**
- `lib/ui/feature-flags.mjs`
- `tests/feature-flags.test.mjs`
- `app/page.jsx`
- `components/prompt/PromptLibraryV5.jsx`
- `components/prompt/PromptSearch.jsx`
- `components/prompt/PromptDetailV2.jsx`
- `components/prompt/PromptHealth.jsx`
- `components/prompt/PromptPacks.jsx`
- `components/workspace/WorkspaceSidebar.jsx`
- `app/globals.css`
- `lib/i18n/catalog-th.mjs`
- `tests/i18n-coverage.test.mjs`

## Task 1: Add Premium Card and Shared Transition Rollout Flags

**Interfaces:**
- `V5_PREMIUM_CARDS` and `V5_SHARED_PROMPT_TRANSITION` use the existing strict parser.
- `app/page.jsx` passes `premiumCardsEnabled` and `sharedTransitionEnabled` to `PromptLibraryV5`.
- Shared transition is effective only when both `detailEnabled` and `sharedTransitionEnabled` are true.

- [ ] **Step 1: Extend `tests/feature-flags.test.mjs`.** Add both flags to the exact expected list and assert default false / explicit true behavior.
- [ ] **Step 2: Add RED integration assertions** to `tests/premium-prompt-ui-contract.test.mjs`:

```js
test('premium prompt presentation is independently gated', () => {
  const page = fs.readFileSync('app/page.jsx', 'utf8');
  assert.match(page, /V5_PREMIUM_CARDS/);
  assert.match(page, /V5_SHARED_PROMPT_TRANSITION/);
  assert.match(page, /premiumCardsEnabled=/);
  assert.match(page, /sharedTransitionEnabled=/);
});
```

- [ ] **Step 3: Run RED.** `node --test tests/feature-flags.test.mjs tests/premium-prompt-ui-contract.test.mjs`.
- [ ] **Step 4: Add the flags** to `lib/ui/feature-flags.mjs` and wire the props in `app/page.jsx`.
- [ ] **Step 5: Run GREEN.** Re-run the two tests.
- [ ] **Step 6: Commit.** `git add lib/ui/feature-flags.mjs tests/feature-flags.test.mjs app/page.jsx tests/premium-prompt-ui-contract.test.mjs && git commit -m "feat: add premium prompt rollout flags"`.

## Task 2: Build Deterministic Card Metadata and Premium Intelligence Card

**Interfaces:**
- `promptLayoutId(id) -> "prompt-card-${String(id)}"`.
- `getPromptTransitionMode({ enabled, reducedMotion, sourceAvailable }) -> 'shared'|'fade'`.
- `<PromptCardV5 prompt healthScore onOpen onRun onFavorite onPin transitionEnabled reducedMotion />`.
- `healthScore` is either `null` or the `.total` returned by existing `scorePromptHealth(prompt)`; the card never recalculates health independently.
- Card exposes title, category, 2–3 line description, variable count, health indicator when `healthScore` is non-null, real model/usage metadata when present, Favorite/Pin/Run actions.

- [ ] **Step 1: Write `tests/shared-prompt-transition.test.mjs`.** Assert stable layout IDs and fade fallback for reduced motion or missing source:

```js
test('shared prompt transition falls back safely', () => {
  assert.equal(promptLayoutId(42), 'prompt-card-42');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: true, sourceAvailable: true }), 'fade');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: false, sourceAvailable: false }), 'fade');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: false, sourceAvailable: true }), 'shared');
});
```

- [ ] **Step 2: Add RED source contracts** in `tests/premium-prompt-card.test.mjs` asserting `PromptCardV5` contains accessible buttons for Run/Favorite/Pin, `layoutId`, a variable count, conditional Prompt Health rendering, and no hard-coded fake model/tokens/cost.
- [ ] **Step 3: Run RED.** `node --test tests/shared-prompt-transition.test.mjs tests/premium-prompt-card.test.mjs`.
- [ ] **Step 4: Implement `lib/ui/prompt-transition.mjs`.** Pure functions only; no DOM access.
- [ ] **Step 5: Implement `PromptCardV5.jsx`.** Use `MotionSurface`, `GlassGlyph`, and the passed `healthScore`. On fine-pointer devices, update `--card-pointer-x/y` on a ref in `requestAnimationFrame`; never store pointer coordinates in React state. Limit hover lift to 4px and do not rotate the card.
- [ ] **Step 6: Implement card CSS** in `app/globals.css`: two-layer edge highlight, clamped description, hidden/revealed quick actions on hover/focus-within, and coarse-pointer rules that keep essential actions reachable without hover.
- [ ] **Step 7: Run GREEN.** `node --test tests/shared-prompt-transition.test.mjs tests/premium-prompt-card.test.mjs`.
- [ ] **Step 8: Commit.** `git add lib/ui/prompt-transition.mjs components/prompt/PromptCardV5.jsx app/globals.css tests/shared-prompt-transition.test.mjs tests/premium-prompt-card.test.mjs && git commit -m "feat: add premium intelligence prompt card"`.

## Task 3: Spacious Showcase Library and Animated Search Reflow

**Interfaces:**
- `PromptLibraryV5` gains props `premiumCardsEnabled=false`, `sharedTransitionEnabled=false`.
- Premium layout: one card per row below desktop breakpoint, two cards per row at `lg` and above; no three/four-column primary grid.
- When premium cards are disabled, retain the current card/list rendering path unchanged.
- Search result containers use Motion `layout`; removed/inserted cards use `AnimatePresence` with opacity + <=12px y translation.
- `PromptSearch` accepts optional `inputRef` so `/` can focus the search field without changing search semantics.
- When `healthEnabled` is true, `PromptLibraryV5` memoizes a `Map(String(prompt.id) -> scorePromptHealth(prompt).total)` and passes scores to cards; when false it passes `null` and performs no card-health scoring.

- [ ] **Step 1: Extend `tests/premium-prompt-ui-contract.test.mjs`** to assert `lg:grid-cols-2`, absence of `lg:grid-cols-3`/`4` in the premium primary grid, `AnimatePresence`, `layout`, a fallback branch for disabled premium cards, and reuse of `scorePromptHealth` only under `healthEnabled`.
- [ ] **Step 2: Add a RED keyboard contract** that `PromptLibraryV5` registers `/` only when the event target is not editable and calls `searchInputRef.current?.focus()`.
- [ ] **Step 3: Run RED.** `node --test tests/premium-prompt-ui-contract.test.mjs`.
- [ ] **Step 4: Modify `PromptSearch.jsx`.** Forward/use `inputRef` on its search input; preserve current query/filter callbacks and ARIA label.
- [ ] **Step 5: Modify `PromptLibraryV5.jsx`.** Keep existing search/selectors; memoize the optional health-score map; in premium mode map results to `PromptCardV5` inside `LayoutGroup`/`AnimatePresence`. Use result IDs as stable keys. Add `/` shortcut through the existing editable-target policy from `lib/ui/command-palette.mjs`.
- [ ] **Step 6: Ensure search is immediate.** Query/filter state changes must not wait for exit animation completion; Motion decorates already-computed results only.
- [ ] **Step 7: Run GREEN plus Search/Health regressions.** `node --test tests/premium-prompt-ui-contract.test.mjs tests/search-v2.test.mjs tests/prompt-health-v2.test.mjs tests/v5-core-ui-contract.test.mjs`.
- [ ] **Step 8: Commit.** `git add components/prompt/PromptLibraryV5.jsx components/prompt/PromptSearch.jsx tests/premium-prompt-ui-contract.test.mjs && git commit -m "feat: add spacious prompt library motion"`.

## Task 4: Mobile Long-Press Quick Actions Without Destructive Swipes

**Interfaces:**
- `<PromptQuickActionsSheet open prompt onClose onRun onFavorite onPin onCopy onAddToPack />`.
- Long press threshold is 450ms; cancel when pointer moves more than 10px or pointerup/pointercancel occurs first.
- Explicit close button is always present.
- No delete/trash action and no swipe-to-delete behavior.

- [ ] **Step 1: Add RED source contracts** to `tests/premium-prompt-card.test.mjs` for `450`, `pointercancel`, `10`, an explicit Close control, and absence of `Delete|Trash|swipe.*delete` in `PromptQuickActionsSheet.jsx`.
- [ ] **Step 2: Run RED.** `node --test tests/premium-prompt-card.test.mjs`.
- [ ] **Step 3: Implement `PromptQuickActionsSheet.jsx`.** Use `AnimatePresence`, a focusable modal/sheet surface, backdrop close, Escape close, and callback-disabled buttons when a capability is absent.
- [ ] **Step 4: Add long-press handling to `PromptCardV5`.** Use refs for timer/start point; clear timer on all exit paths; normal tap continues to open the prompt when long press did not fire.
- [ ] **Step 5: Run GREEN.** `node --test tests/premium-prompt-card.test.mjs`.
- [ ] **Step 6: Commit.** `git add components/prompt/PromptCardV5.jsx components/prompt/PromptQuickActionsSheet.jsx tests/premium-prompt-card.test.mjs && git commit -m "feat: add mobile prompt quick actions"`.

## Task 5: Shared Card Expansion Into Existing Prompt Detail

**Interfaces:**
- `PromptDetailV2` gains `{ transitionEnabled=false, sourceAvailable=true }` but retains all existing prompt/variables/health/action props.
- Shared title/glyph/surface use the same `promptLayoutId(prompt.id)` namespace as the originating card.
- Reduced motion or missing source renders a short fade-only detail entry/exit.
- Closing detail returns focus to the originating card when it still exists; otherwise focus moves to the Library heading/search.

- [ ] **Step 1: Add RED contracts** in `tests/shared-prompt-transition.test.mjs` reading `PromptCardV5.jsx`, `PromptLibraryV5.jsx`, and `PromptDetailV2.jsx`; assert shared `promptLayoutId`, `useReducedMotion`, `AnimatePresence`, and fallback focus handling are represented in source.
- [ ] **Step 2: Run RED.** `node --test tests/shared-prompt-transition.test.mjs tests/v5-prompt-detail-ui.test.mjs`.
- [ ] **Step 3: Modify `PromptDetailV2.jsx`.** Wrap only spatial surface/title/glyph elements in Motion shared IDs; do not animate form values or rebuild Variables V2 state. Keep current responsive info/input/preview ordering and sticky mobile Run location.
- [ ] **Step 4: Modify `PromptLibraryV5.jsx`.** Track the last trigger element/ref for selected prompt; pass transition props; keep the selected prompt state as the single detail switch. If filters remove the source card while detail is open, mark `sourceAvailable=false` and use fade exit.
- [ ] **Step 5: Upgrade `PromptHealth.jsx`, `PromptPacks.jsx`, and `WorkspaceSidebar.jsx` visually** using Phase 1 primitives only; do not change scoring, pack membership, or workspace semantics.
- [ ] **Step 6: Run GREEN plus all Phase 1 behavior regressions.** `node --test tests/shared-prompt-transition.test.mjs tests/v5-prompt-detail-ui.test.mjs tests/variables-v2.test.mjs tests/prompt-health-v2.test.mjs tests/smart-collections.test.mjs tests/workspace-model.test.mjs`.
- [ ] **Step 7: Commit.** `git add components/prompt components/workspace tests/shared-prompt-transition.test.mjs && git commit -m "feat: add shared prompt detail transition"`.

## Task 6: Localization, Accessibility, and Phase Verification

- [ ] **Step 1: Add Thai translations** for new visible labels such as Health, Variables, Run, Favorite, Pin, Add to Pack, Quick Actions, Close, No matching prompts, and any new metadata label not already covered.
- [ ] **Step 2: Extend `tests/i18n-coverage.test.mjs`** for every newly introduced literal visible to users.
- [ ] **Step 3: Run targeted accessibility/contracts.** `node --test tests/i18n-coverage.test.mjs tests/premium-prompt-card.test.mjs tests/premium-prompt-ui-contract.test.mjs tests/shared-prompt-transition.test.mjs`.
- [ ] **Step 4: Run full suite.** `npm test`; confirm exactly 80 built-in prompts, Legacy fallback, Variables V2, Prompt Health, Packs, and Workspace regressions all pass.
- [ ] **Step 5: Build and artifact checks.** `npm run build && test -f .open-next/worker.js && test -d .open-next/assets && test -f .open-next/.build/open-next.config.edge.mjs`.
- [ ] **Step 6: Cloudflare dry-run.** `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`.
- [ ] **Step 7: Scope audit.** `git diff --name-only "$(git merge-base main HEAD)"...HEAD`; confirm no Supabase migration, provider implementation, prompt catalog content, or production config secrets changed.
- [ ] **Step 8: Open Phase 3 PR and stop before merge.** Record exact verification evidence; require a separate explicit `merge` authorization and do not production-deploy.

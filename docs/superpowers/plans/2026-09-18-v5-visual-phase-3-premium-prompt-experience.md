# Prompt.OS V5 Visual Phase 3 Premium Prompt Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain V5 prompt grid/detail presentation with Spacious Showcase Premium Intelligence Cards, smooth search/filter reflow, mobile quick actions, shared card-to-detail spatial transitions, and the approved Neo Mission Control card interaction profile while preserving all Phase 1 prompt behavior.

**Architecture:** Keep Search V2, Variables V2, Prompt Health, Smart Collections, Packs, and persistence models unchanged. Add presentational card/transition components around those existing seams; Motion `layout`/`layoutId` provides reflow/shared geometry, `useReducedMotion` selects fade-only fallbacks, and card pointer effects use requestAnimationFrame + CSS custom properties without React state updates per pointer frame. Feature flags independently gate cards and shared transitions.

**Tech Stack:** Next 16.3.5, React 19.3.0, Tailwind 4.3.3, Motion for React, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-18-prompt-os-v5-visual-motion-system-design.md`

**Interaction Profile:** `docs/superpowers/specs/2026-09-18-prompt-os-neo-mission-control-design.md`

## Global Constraints

- Phase 1 Visual Foundation must be merged; Phase 2 Mission Control may be merged independently but is not required for card correctness.
- Add `V5_PREMIUM_CARDS` and `V5_SHARED_PROMPT_TRANSITION`, both default false.
- `V5_SEARCH` continues to own Search V2 capability; premium cards only enhance its presentation.
- `V5_PROMPT_DETAIL` continues to own Prompt Detail capability; shared transition must never create a second detail implementation.
- `V5_PROMPT_HEALTH` remains the authority for whether Prompt Health data is shown; card health values use the existing local deterministic `scorePromptHealth` only.
- Variables V2 values and validation, Prompt Health calculation, Smart Collections, Packs, and workspace reference semantics stay unchanged.
- Fine-pointer card effects run only on `(hover: hover) and (pointer: fine)` devices and are disabled under reduced motion.
- Card pointer tracking writes CSS variables through requestAnimationFrame/ref-managed DOM updates; no React state update is allowed per pointer frame.
- Premium cards may lift at most 4px and must not use rotateX/rotateY/perspective tilt.
- Press feedback may scale/compress visually but must not move neighboring layout or delay click/tap handling.
- No destructive swipe actions.
- Search/filter results update immediately; exit animations must not gate new results.
- Exactly 80 built-in prompts remain intact.
- Do not add scan lines, particle fields, cursor trails, continuous blur animation, or continuously animated box shadows.
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
- `tests/neo-premium-interactions.test.mjs`

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

## Task 2: Build Deterministic Card Metadata and Neo Premium Intelligence Card

**Interfaces:**
- `promptLayoutId(id) -> "prompt-card-${String(id)}"`.
- `getPromptTransitionMode({ enabled, reducedMotion, sourceAvailable }) -> 'shared'|'fade'`.
- `<PromptCardV5 prompt healthScore onOpen onRun onFavorite onPin transitionEnabled reducedMotion />`.
- `healthScore` is either `null` or the `.total` returned by existing `scorePromptHealth(prompt)`; the card never recalculates health independently.
- Card exposes title, category, 2–3 line description, variable count, health indicator when `healthScore` is non-null, real model/usage metadata when present, Favorite/Pin/Run actions.
- Fine-pointer cards maintain CSS variables `--card-pointer-x`, `--card-pointer-y`, and `--card-pointer-strength`; updates are rAF-throttled DOM writes and stop on leave/unmount.
- Pointer-reactive light is a local edge/highlight effect only; it must not rotate or perspective-transform the card.
- Press state uses transform scale between 0.985 and 1.0 with immediate pointer/touch release; hover lift is <=4px.

- [ ] **Step 1: Write `tests/shared-prompt-transition.test.mjs`.** Assert stable layout IDs and fade fallback for reduced motion or missing source:

```js
test('shared prompt transition falls back safely', () => {
  assert.equal(promptLayoutId(42), 'prompt-card-42');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: true, sourceAvailable: true }), 'fade');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: false, sourceAvailable: false }), 'fade');
  assert.equal(getPromptTransitionMode({ enabled: true, reducedMotion: false, sourceAvailable: true }), 'shared');
});
```

- [ ] **Step 2: Add RED source contracts** in `tests/premium-prompt-card.test.mjs` and `tests/neo-premium-interactions.test.mjs`. Assert `PromptCardV5` contains accessible buttons for Run/Favorite/Pin, `layoutId`, a variable count, conditional Prompt Health rendering, no hard-coded fake model/tokens/cost, `(hover: hover) and (pointer: fine)`, `requestAnimationFrame`, `--card-pointer-x`, `--card-pointer-y`, no `setState(` in pointer handling, hover lift <=4px, and no `rotateX|rotateY|perspective`.

```js
test('neo card pointer light is bounded and does not tilt', () => {
  const card = fs.readFileSync('components/prompt/PromptCardV5.jsx', 'utf8');
  assert.match(card, /requestAnimationFrame/);
  assert.match(card, /--card-pointer-x/);
  assert.match(card, /--card-pointer-y/);
  assert.equal(/rotateX|rotateY|perspective/.test(card), false);
  assert.equal(/setState\(/.test(card), false);
});
```

- [ ] **Step 3: Run RED.** `node --test tests/shared-prompt-transition.test.mjs tests/premium-prompt-card.test.mjs tests/neo-premium-interactions.test.mjs`.
- [ ] **Step 4: Implement `lib/ui/prompt-transition.mjs`.** Pure functions only; no DOM access.
- [ ] **Step 5: Implement `PromptCardV5.jsx`.** Use `MotionSurface`, `GlassGlyph`, and the passed `healthScore`. Detect fine pointer with `window.matchMedia('(hover: hover) and (pointer: fine)')`; combine with `useReducedMotion`. Update pointer variables on a ref inside at most one pending requestAnimationFrame; cancel pending frame on unmount; reset strength on leave/blur. Use Motion `whileHover={{ y: -4 }}` or equivalent bounded lift and `whileTap={{ scale: 0.985 }}` without rotation.
- [ ] **Step 6: Implement card CSS** in `app/globals.css`: two-layer stable glass edge + pointer-responsive local light, clamped description, hidden/revealed quick actions on hover/focus-within, cyan direct-interaction light with restrained purple depth, and coarse-pointer/reduced-motion rules that keep essential actions reachable without hover and disable pointer light.
- [ ] **Step 7: Run GREEN.** `node --test tests/shared-prompt-transition.test.mjs tests/premium-prompt-card.test.mjs tests/neo-premium-interactions.test.mjs`.
- [ ] **Step 8: Commit.** `git add lib/ui/prompt-transition.mjs components/prompt/PromptCardV5.jsx app/globals.css tests/shared-prompt-transition.test.mjs tests/premium-prompt-card.test.mjs tests/neo-premium-interactions.test.mjs && git commit -m "feat: add neo premium intelligence prompt card"`.

## Task 3: Spacious Showcase Library and Immediate Animated Search Reflow

**Interfaces:**
- `PromptLibraryV5` gains props `premiumCardsEnabled=false`, `sharedTransitionEnabled=false`.
- Premium layout: one card per row below desktop breakpoint, two cards per row at `lg` and above; no three/four-column primary grid.
- When premium cards are disabled, retain the current card/list rendering path unchanged.
- Search result containers use Motion `layout`; removed/inserted cards use `AnimatePresence` with opacity + <=12px y translation.
- `PromptSearch` accepts optional `inputRef` so `/` can focus the search field without changing search semantics.
- When `healthEnabled` is true, `PromptLibraryV5` memoizes a `Map(String(prompt.id) -> scorePromptHealth(prompt).total)` and passes scores to cards; when false it passes `null` and performs no card-health scoring.
- Result computation always precedes animation; do not use `mode="wait"` or transition-complete callbacks to publish the next result set.

- [ ] **Step 1: Extend `tests/premium-prompt-ui-contract.test.mjs`** to assert `lg:grid-cols-2`, absence of `lg:grid-cols-3`/`4` in the premium primary grid, `AnimatePresence`, `layout`, a fallback branch for disabled premium cards, reuse of `scorePromptHealth` only under `healthEnabled`, and absence of `mode="wait"` around the primary result grid.
- [ ] **Step 2: Add a RED keyboard contract** that `PromptLibraryV5` registers `/` only when the event target is not editable and calls `searchInputRef.current?.focus()`.
- [ ] **Step 3: Run RED.** `node --test tests/premium-prompt-ui-contract.test.mjs`.
- [ ] **Step 4: Modify `PromptSearch.jsx`.** Forward/use `inputRef` on its search input; preserve current query/filter callbacks and ARIA label.
- [ ] **Step 5: Modify `PromptLibraryV5.jsx`.** Keep existing search/selectors; memoize the optional health-score map; in premium mode map already-computed results to `PromptCardV5` inside `LayoutGroup`/`AnimatePresence`. Use result IDs as stable keys. Add `/` shortcut through the existing editable-target policy from `lib/ui/command-palette.mjs`.
- [ ] **Step 6: Ensure search is immediate.** Query/filter state changes update visible result data synchronously with React state; Motion decorates reflow only. Exit animations run concurrently and never block new matches.
- [ ] **Step 7: Run GREEN plus Search/Health regressions.** `node --test tests/premium-prompt-ui-contract.test.mjs tests/search-v2.test.mjs tests/prompt-health-v2.test.mjs tests/v5-core-ui-contract.test.mjs tests/neo-premium-interactions.test.mjs`.
- [ ] **Step 8: Commit.** `git add components/prompt/PromptLibraryV5.jsx components/prompt/PromptSearch.jsx tests/premium-prompt-ui-contract.test.mjs tests/neo-premium-interactions.test.mjs && git commit -m "feat: add immediate spacious prompt library motion"`.

## Task 4: Mobile Long-Press Quick Actions Without Desktop Hover Assumptions

**Interfaces:**
- `<PromptQuickActionsSheet open prompt onClose onRun onFavorite onPin onCopy onAddToPack />`.
- Long press threshold is 450ms; cancel when pointer moves more than 10px or pointerup/pointercancel occurs first.
- Explicit close button is always present.
- No delete/trash action and no swipe-to-delete behavior.
- Coarse-pointer cards do not register magnetic/pointer-light behavior; tap opens detail unless the long press already fired.

- [ ] **Step 1: Add RED source contracts** to `tests/premium-prompt-card.test.mjs` and `tests/neo-premium-interactions.test.mjs` for `450`, `pointercancel`, movement threshold `10`, an explicit Close control, absence of `Delete|Trash|swipe.*delete`, no hover-only requirement for Run/Favorite/Pin access, and coarse-pointer disabling of pointer light.
- [ ] **Step 2: Run RED.** `node --test tests/premium-prompt-card.test.mjs tests/neo-premium-interactions.test.mjs`.
- [ ] **Step 3: Implement `PromptQuickActionsSheet.jsx`.** Use `AnimatePresence`, a focusable modal/sheet surface, backdrop close, Escape close, and callback-disabled buttons when a capability is absent. Use a short spring on standard motion and fade/minimal translation under reduced motion.
- [ ] **Step 4: Add long-press handling to `PromptCardV5`.** Use refs for timer/start point; clear timer on pointerup/pointercancel/leave/unmount; cancel when movement exceeds 10px; set a ref flag when long press opens the sheet so the subsequent click does not open detail.
- [ ] **Step 5: Run GREEN.** `node --test tests/premium-prompt-card.test.mjs tests/neo-premium-interactions.test.mjs`.
- [ ] **Step 6: Commit.** `git add components/prompt/PromptCardV5.jsx components/prompt/PromptQuickActionsSheet.jsx tests/premium-prompt-card.test.mjs tests/neo-premium-interactions.test.mjs && git commit -m "feat: add neo mobile prompt quick actions"`.

## Task 5: Polish Shared Card Expansion Into Existing Prompt Detail

**Interfaces:**
- `PromptDetailV2` gains `{ transitionEnabled=false, sourceAvailable=true }` but retains all existing prompt/variables/health/action props.
- Shared title/glyph/surface use the same `promptLayoutId(prompt.id)` namespace as the originating card.
- Reduced motion or missing source renders a short fade-only detail entry/exit.
- Shared expansion applies to surface/title/glyph only; Variables V2 values, form state, preview state, and Prompt Health state do not get duplicated or remounted solely for animation.
- Detail body begins opacity entry after geometry starts, but no user action waits for the geometry to finish.
- Closing detail returns focus to the originating card when it still exists; otherwise focus moves to the Library heading/search.

- [ ] **Step 1: Add RED contracts** in `tests/shared-prompt-transition.test.mjs` reading `PromptCardV5.jsx`, `PromptLibraryV5.jsx`, and `PromptDetailV2.jsx`; assert shared `promptLayoutId`, `useReducedMotion`, `AnimatePresence`, fallback focus handling, no `mode="wait"`, and no duplicate Variables V2 implementation.
- [ ] **Step 2: Extend `tests/neo-premium-interactions.test.mjs`** to assert the detail transition uses the shared surface/title/glyph IDs, has fade fallback when `sourceAvailable=false`, and contains no rotate/perspective cinematic transform.
- [ ] **Step 3: Run RED.** `node --test tests/shared-prompt-transition.test.mjs tests/v5-prompt-detail-ui.test.mjs tests/neo-premium-interactions.test.mjs`.
- [ ] **Step 4: Modify `PromptDetailV2.jsx`.** Wrap only spatial surface/title/glyph elements in Motion shared IDs; do not animate form values or rebuild Variables V2 state. Keep current responsive info/input/preview ordering and sticky mobile Run location. Use opacity/minimal y for body content; interactive controls are enabled immediately.
- [ ] **Step 5: Modify `PromptLibraryV5.jsx`.** Track the last trigger element/ref for selected prompt; pass transition props; keep the selected prompt state as the single detail switch. If filters remove the source card while detail is open, mark `sourceAvailable=false` and use fade exit. Restore focus to the originating card on close when connected; otherwise focus the Library search/heading.
- [ ] **Step 6: Upgrade `PromptHealth.jsx`, `PromptPacks.jsx`, and `WorkspaceSidebar.jsx` visually** using Phase 1 primitives only; do not change scoring, pack membership, or workspace semantics. Use static crisp edge/depth treatment rather than continuous glow loops.
- [ ] **Step 7: Run GREEN plus all Phase 1 behavior regressions.** `node --test tests/shared-prompt-transition.test.mjs tests/v5-prompt-detail-ui.test.mjs tests/variables-v2.test.mjs tests/prompt-health-v2.test.mjs tests/smart-collections.test.mjs tests/workspace-model.test.mjs tests/neo-premium-interactions.test.mjs`.
- [ ] **Step 8: Commit.** `git add components/prompt components/workspace tests/shared-prompt-transition.test.mjs tests/neo-premium-interactions.test.mjs && git commit -m "feat: polish neo shared prompt detail transition"`.

## Task 6: Localization, Accessibility, Performance Contracts, and Phase Verification

- [ ] **Step 1: Add Thai translations** for new visible labels such as Health, Variables, Run, Favorite, Pin, Add to Pack, Quick Actions, Close, No matching prompts, and any new metadata label not already covered.
- [ ] **Step 2: Extend `tests/i18n-coverage.test.mjs`** for every newly introduced literal visible to users.
- [ ] **Step 3: Extend `tests/neo-premium-interactions.test.mjs`** with final contracts: fine-pointer media query is required for pointer light; reduced motion disables pointer light/shared spring; hover lift <=4px; press scale >=0.985; no `scanline|cursor-trail|particle-field|rotateX|rotateY|perspective`; rAF pointer handling does not use React state; essential actions remain reachable on coarse pointers.
- [ ] **Step 4: Run targeted accessibility/contracts.** `node --test tests/i18n-coverage.test.mjs tests/premium-prompt-card.test.mjs tests/premium-prompt-ui-contract.test.mjs tests/shared-prompt-transition.test.mjs tests/neo-premium-interactions.test.mjs`.
- [ ] **Step 5: Run full suite.** `npm test`; confirm exactly 80 built-in prompts, Legacy fallback, Variables V2, Prompt Health, Packs, Workspace, Search V2, feature flags, and reduced-motion regressions all pass.
- [ ] **Step 6: Build and artifact checks.** `npm run build && test -f .open-next/worker.js && test -d .open-next/assets && test -f .open-next/.build/open-next.config.edge.mjs`.
- [ ] **Step 7: Cloudflare dry-run.** `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`.
- [ ] **Step 8: Scope audit.** `git diff --name-only "$(git merge-base main HEAD)"...HEAD`; confirm no Supabase migration, provider implementation, prompt catalog content, production config secrets, or parallel Neo route tree changed.
- [ ] **Step 9: Open Phase 3 PR and stop before merge.** Record exact verification evidence; require a separate explicit `merge` authorization and do not production-deploy.
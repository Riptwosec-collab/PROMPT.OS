# Prompt.OS V5 Visual Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the shared Hybrid Premium Tech visual and motion foundation, Motion for React dependency, Aurora Glass background, reusable UI primitives, reduced-motion behavior, and a default-off `V5_VISUAL_SYSTEM` rollout gate without changing product data or execution behavior.

**Architecture:** Centralize visual/motion constants in pure `lib/ui` modules, keep glass/aurora effects in CSS, and use Motion for React only for layout/enter-exit/spring orchestration. `AppShell` consumes the primitives only when `V5_VISUAL_SYSTEM` is enabled; the current V5/Legacy presentation remains unchanged when it is disabled.

**Tech Stack:** Next 16.3.5, React 19.3.0, Tailwind 4.3.3, Motion for React (`motion` package), Node test runner, OpenNext Cloudflare 1.20.6, Wrangler 4.131.2.

**Spec:** `docs/superpowers/specs/2026-09-18-prompt-os-v5-visual-motion-system-design.md`

## Global Constraints

- Motion compatibility must be verified against React 19.3.0 and Next 16.3.5 before dependency adoption; current official Motion docs state React 18.2+ and Next App Router support.
- New rollout flag `V5_VISUAL_SYSTEM` defaults to false and uses the existing strict `"true"` parser.
- Legacy PromptOS remains available.
- Existing 80 built-in prompts remain exactly 80.
- No Supabase production DDL, provider changes, billing enforcement, prompt catalog changes, or production deployment.
- Prefer transform/opacity animation; no continuous blur/width/height animation.
- `prefers-reduced-motion` must disable ambient movement and spring-style spatial motion.
- TDD: every behavior task starts RED, reaches GREEN, then commits.

---

## File Structure

**Create**
- `lib/ui/visual-tokens.mjs` — semantic color/elevation/radius constants usable by tests and UI.
- `lib/ui/motion-tokens.mjs` — canonical durations, spring configs, and reduced-motion transition helpers.
- `lib/ui/interaction-config.mjs` — fine-pointer/reduced-motion capability policy; no DOM access in exported pure helpers.
- `components/ui/GlassSurface.jsx` — semantic glass levels: subtle/panel/focus.
- `components/ui/MotionSurface.jsx` — thin Motion wrapper using shared motion tokens.
- `components/ui/AuroraBackground.jsx` — decorative ambient layer with visibility-aware pause and pointer CSS variables.
- `components/ui/GlassGlyph.jsx` — reusable category/status glyph shell.
- `components/ui/StatusPill.jsx` — semantic state capsule.
- `components/ui/MetricChip.jsx` — mono technical metric surface.
- `components/ui/GlowButton.jsx` — focus-visible/press-aware action primitive.
- `components/ui/AnimatedNumber.jsx` — reduced-motion-safe number interpolation wrapper.
- `tests/visual-motion-foundation.test.mjs`
- `tests/visual-motion-ui-contract.test.mjs`

**Modify**
- `package.json`
- `package-lock.json`
- `app/globals.css`
- `lib/ui/feature-flags.mjs`
- `tests/feature-flags.test.mjs`
- `components/shell/AppShell.jsx`
- `app/page.jsx`

## Task 1: Add Rollout Flag and Motion Dependency

**Interfaces:**
- `V5_FLAG_NAMES` includes `V5_VISUAL_SYSTEM`.
- `readFeatureFlags(env)` reads `NEXT_PUBLIC_V5_VISUAL_SYSTEM` with the same strict parser as existing flags.
- Dependency import contract is `import { motion, AnimatePresence, useReducedMotion } from 'motion/react'`.

- [ ] **Step 1: Extend the feature-flag test first.** Add `V5_VISUAL_SYSTEM` to `EXPECTED_FLAGS` in `tests/feature-flags.test.mjs` and add:

```js
test('visual system flag is default-off and only explicit true enables it', () => {
  assert.equal(readFeatureFlags({}).V5_VISUAL_SYSTEM, false);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_VISUAL_SYSTEM: ' true ' }).V5_VISUAL_SYSTEM, true);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_VISUAL_SYSTEM: '1' }).V5_VISUAL_SYSTEM, false);
});
```

- [ ] **Step 2: Run RED.** Run `node --test tests/feature-flags.test.mjs`. Expected: failure because `V5_VISUAL_SYSTEM` is absent.
- [ ] **Step 3: Add the flag.** Append `V5_VISUAL_SYSTEM` to `V5_FLAG_NAMES` and map `NEXT_PUBLIC_V5_VISUAL_SYSTEM` in `V5_FEATURE_FLAGS` inside `lib/ui/feature-flags.mjs`.
- [ ] **Step 4: Verify GREEN.** Re-run `node --test tests/feature-flags.test.mjs`.
- [ ] **Step 5: Verify Motion compatibility before install.** Confirm the official Motion installation guide still supports React >=18.2 and Next App Router. If that check fails, stop this phase and revise the design; do not substitute another library silently.
- [ ] **Step 6: Install and pin through the lockfile.** Run `npm install motion`. Confirm `package.json` contains a `motion` dependency and `package-lock.json` records the resolved version.
- [ ] **Step 7: Smoke-import Motion.** Run `node -e "import('motion/react').then(m=>{if(!m.motion||!m.AnimatePresence)process.exit(1)})"`. Expected: exit code 0.
- [ ] **Step 8: Commit.** `git add package.json package-lock.json lib/ui/feature-flags.mjs tests/feature-flags.test.mjs && git commit -m "feat: add visual system rollout foundation"`.

## Task 2: Create Pure Visual and Motion Tokens

**Interfaces:**
- `VISUAL_TOKENS` is a frozen object with `color`, `glass`, `radius`, `shadow`, and `focus` groups.
- `MOTION_TOKENS` is a frozen object with numeric millisecond durations `instant=120`, `fast=180`, `standard=280`, `springMin=350`, `springMax=500`, plus `ambientMin=8000`, `ambientMax=20000`.
- `getTransition(kind, reducedMotion=false)` returns a Motion transition object; reduced motion returns `{ duration: 0.01 }`.
- `getInteractionPolicy({ reducedMotion, finePointer, documentVisible })` returns `{ ambient, pointerGlow, spatialMotion }` booleans.

- [ ] **Step 1: Write the failing unit test** `tests/visual-motion-foundation.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { VISUAL_TOKENS } from '../lib/ui/visual-tokens.mjs';
import { MOTION_TOKENS, getTransition } from '../lib/ui/motion-tokens.mjs';
import { getInteractionPolicy } from '../lib/ui/interaction-config.mjs';

test('approved visual and motion tokens are centralized', () => {
  assert.equal(VISUAL_TOKENS.color.iceBlue, '#8BE9FF');
  assert.equal(VISUAL_TOKENS.color.electricPurple, '#A78BFA');
  assert.deepEqual(
    [MOTION_TOKENS.instant, MOTION_TOKENS.fast, MOTION_TOKENS.standard],
    [120, 180, 280],
  );
  assert.equal(getTransition('standard', true).duration, 0.01);
});

test('interaction policy disables ambient and pointer motion when reduced motion is requested', () => {
  assert.deepEqual(
    getInteractionPolicy({ reducedMotion: true, finePointer: true, documentVisible: true }),
    { ambient: false, pointerGlow: false, spatialMotion: false },
  );
});
```

- [ ] **Step 2: Run RED.** `node --test tests/visual-motion-foundation.test.mjs`; expected module-not-found failure.
- [ ] **Step 3: Implement `lib/ui/visual-tokens.mjs`.** Export a deeply stable/frozen semantic object; keep raw values here rather than duplicating them in React components.
- [ ] **Step 4: Implement `lib/ui/motion-tokens.mjs`.** Use spring config `{ type: 'spring', stiffness: 360, damping: 32, mass: 0.9 }` for `getTransition('spring')`, seconds converted from millisecond tokens for tween durations, and the 0.01-second reduced-motion fallback.
- [ ] **Step 5: Implement `lib/ui/interaction-config.mjs`.** Ambient is true only when visible and not reduced-motion; pointerGlow additionally requires fine pointer; spatialMotion is false only for reduced-motion.
- [ ] **Step 6: Run GREEN.** `node --test tests/visual-motion-foundation.test.mjs`.
- [ ] **Step 7: Commit.** `git add lib/ui/visual-tokens.mjs lib/ui/motion-tokens.mjs lib/ui/interaction-config.mjs tests/visual-motion-foundation.test.mjs && git commit -m "feat: add visual and motion tokens"`.

## Task 3: Build Reusable UI Primitives and Aurora CSS

**Interfaces:**
- `<GlassSurface level="subtle|panel|focus" as="div" className="">children</GlassSurface>`.
- `<MotionSurface transitionKind="standard|spring" reducedMotion={boolean}>` forwards normal DOM props and Motion props.
- `<AuroraBackground />` is `aria-hidden="true"` and never captures pointer events.
- `StatusPill` takes `{ tone='neutral', label, children }`.
- `MetricChip` takes `{ label, value, suffix }`.
- `GlowButton` passes through standard button props and has visible `:focus-visible` treatment.
- `AnimatedNumber` takes `{ value, format=(v)=>String(v), reducedMotion }` and renders final value immediately when reduced-motion is true.

- [ ] **Step 1: Write a source-contract RED test** `tests/visual-motion-ui-contract.test.mjs` that reads the component files and asserts `glass-subtle`, `glass-panel`, `glass-focus`, `aria-hidden`, `motion/react`, and `focus-visible` are present. It must also assert `AuroraBackground.jsx` does not contain `setState` in its pointer-move handler path.
- [ ] **Step 2: Run RED.** `node --test tests/visual-motion-ui-contract.test.mjs`; expected missing-file failures.
- [ ] **Step 3: Add CSS token mappings** to `app/globals.css`: define `--v5-ice-blue`, `--v5-electric-purple`, three glass backgrounds/borders, elevation shadows, focus halo, `.v5-glass-subtle`, `.v5-glass-panel`, `.v5-glass-focus`, `.v5-aurora`, and `.v5-pointer-light`. Keep the existing `.v5-glass` class as a backward-compatible alias to panel glass.
- [ ] **Step 4: Add Aurora keyframes.** Animate only `transform`/`opacity` of pseudo/child layers over 12s and 18s cycles. Inside `prefers-reduced-motion: reduce`, set aurora animation to none and preserve the current global reduced-motion override.
- [ ] **Step 5: Implement the UI primitives** in `components/ui/`. `AuroraBackground` uses `useReducedMotion`, `matchMedia('(hover: hover) and (pointer: fine)')`, `document.visibilityState`, `requestAnimationFrame`, and CSS variables `--pointer-x` / `--pointer-y`; pointer changes write styles directly to the element ref rather than React state.
- [ ] **Step 6: Run GREEN.** `node --test tests/visual-motion-ui-contract.test.mjs tests/visual-motion-foundation.test.mjs`.
- [ ] **Step 7: Commit.** `git add app/globals.css components/ui tests/visual-motion-ui-contract.test.mjs && git commit -m "feat: add premium visual primitives"`.

## Task 4: Gate the New Foundation in AppShell

**Interfaces:**
- `AppShell` gains optional prop `visualSystemEnabled=false`.
- When false, existing `.v5-ambient` behavior remains.
- When true, shell renders `<AuroraBackground />` and may wrap shell chrome in new primitives without altering navigation/data behavior.
- `app/page.jsx` reads `V5_FEATURE_FLAGS.V5_VISUAL_SYSTEM` and passes the boolean to `AppShell`.

- [ ] **Step 1: Extend `tests/visual-motion-ui-contract.test.mjs`**:

```js
test('visual system is separately gated and legacy shell path remains', () => {
  const page = fs.readFileSync('app/page.jsx', 'utf8');
  const shell = fs.readFileSync('components/shell/AppShell.jsx', 'utf8');
  assert.match(page, /V5_VISUAL_SYSTEM/);
  assert.match(page, /visualSystemEnabled=/);
  assert.match(shell, /visualSystemEnabled = false/);
  assert.match(shell, /AuroraBackground/);
  assert.match(shell, /v5-ambient/);
});
```

- [ ] **Step 2: Run RED.** `node --test tests/visual-motion-ui-contract.test.mjs`.
- [ ] **Step 3: Modify `AppShell.jsx`.** Import `AuroraBackground`; conditionally render it when enabled and otherwise render the current ambient `<div>`. Do not change child routing, Sidebar, TopBar, StatusHud, or MobileDock behavior in this task.
- [ ] **Step 4: Modify `app/page.jsx`.** Define `const v5VisualSystemEnabled = Boolean(V5_FEATURE_FLAGS.V5_VISUAL_SYSTEM);` and pass `visualSystemEnabled={v5VisualSystemEnabled}`.
- [ ] **Step 5: Run targeted GREEN.** `node --test tests/visual-motion-ui-contract.test.mjs tests/feature-flags.test.mjs tests/feature-flag-integration.test.mjs`.
- [ ] **Step 6: Commit.** `git add app/page.jsx components/shell/AppShell.jsx tests/visual-motion-ui-contract.test.mjs && git commit -m "feat: gate premium visual foundation"`.

## Task 5: Phase Verification and PR Gate

- [ ] **Step 1: Run all tests.** `npm test`. Expected: all tests pass; prompt catalog regression remains exactly 80.
- [ ] **Step 2: Run production build.** `npm run build`. Expected: Next/OpenNext build completes and `.open-next/worker.js` exists.
- [ ] **Step 3: Verify OpenNext artifacts.** `test -f .open-next/worker.js && test -d .open-next/assets && test -f .open-next/.build/open-next.config.edge.mjs`.
- [ ] **Step 4: Run Cloudflare dry-run.** `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`. Expected: successful bundle processing and dry-run exit.
- [ ] **Step 5: Verify the default-off path.** Run the feature-flag tests and inspect `app/page.jsx` to confirm no direct env reads and no visual-system activation without `NEXT_PUBLIC_V5_VISUAL_SYSTEM=true`.
- [ ] **Step 6: Verify no forbidden scope.** Run `git diff --name-only "$(git merge-base main HEAD)"...HEAD`; the changed-file list must contain no Supabase migration, provider adapter, prompt catalog content, or deployment-secret changes.
- [ ] **Step 7: Commit verification-only changes if any tests/docs changed.** Use `git commit -m "test: verify visual motion foundation"` only when there are tracked verification edits.
- [ ] **Step 8: Open a Phase 1 PR and stop before merge.** The PR body must record exact test count, build result, Wrangler dry-run result, feature flag default state, and that no production deploy or DB DDL occurred. Merge requires a separate explicit `merge` authorization.

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
- `lib/ui/visual-tokens.mjs`
- `lib/ui/motion-tokens.mjs`
- `lib/ui/interaction-config.mjs`
- `components/ui/GlassSurface.jsx`
- `components/ui/MotionSurface.jsx`
- `components/ui/AuroraBackground.jsx`
- `components/ui/GlassGlyph.jsx`
- `components/ui/StatusPill.jsx`
- `components/ui/MetricChip.jsx`
- `components/ui/GlowButton.jsx`
- `components/ui/AnimatedNumber.jsx`
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

## Task 1: Rollout Flag and Motion Dependency

**Interfaces:**
- Consumes: existing `readFeatureFlags`, `V5_FLAG_NAMES`, `V5_FEATURE_FLAGS`.
- Produces: `V5_VISUAL_SYSTEM` and `motion/react` import availability.

- [ ] **Step 1: Write the failing feature-flag test.** Add this case to `tests/feature-flags.test.mjs` and add `V5_VISUAL_SYSTEM` to `EXPECTED_FLAGS`:

```js
test('visual system flag is default-off and only explicit true enables it', () => {
  assert.equal(readFeatureFlags({}).V5_VISUAL_SYSTEM, false);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_VISUAL_SYSTEM: ' true ' }).V5_VISUAL_SYSTEM, true);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_VISUAL_SYSTEM: '1' }).V5_VISUAL_SYSTEM, false);
});
```

- [ ] **Step 2: Run the test and confirm RED.**

```bash
node --test tests/feature-flags.test.mjs
```

Expected: the exact flag-list assertion fails because `V5_VISUAL_SYSTEM` does not exist yet.

- [ ] **Step 3: Add the flag using the existing parser.** In `lib/ui/feature-flags.mjs`, add the name and environment mapping in the same structures used by the other granular flags:

```js
'V5_VISUAL_SYSTEM',
```

```js
V5_VISUAL_SYSTEM: parseBoolean(env.NEXT_PUBLIC_V5_VISUAL_SYSTEM),
```

Do not add a second parser or direct `process.env` read in `app/page.jsx`.

- [ ] **Step 4: Re-run the flag test and confirm GREEN.**

```bash
node --test tests/feature-flags.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Re-check Motion compatibility before installation.** Verify the official Motion React installation/upgrade documentation still states support compatible with React 19.3.0 and Next App Router. If that is no longer true, stop the phase and revise the approved design rather than substituting another library.

- [ ] **Step 6: Install Motion and pin it through the lockfile.**

```bash
npm install motion
node -e "import('motion/react').then(m=>{if(!m.motion||!m.AnimatePresence||!m.useReducedMotion)process.exit(1)})"
```

Expected: install succeeds and smoke import exits 0.

- [ ] **Step 7: Commit.**

```bash
git add package.json package-lock.json lib/ui/feature-flags.mjs tests/feature-flags.test.mjs
git commit -m "feat: add visual system rollout foundation"
```

## Task 2: Visual, Motion, and Interaction Tokens

**Interfaces:**
- Produces `VISUAL_TOKENS`.
- Produces `MOTION_TOKENS` and `getTransition(kind, reducedMotion=false)`.
- Produces `getInteractionPolicy({ reducedMotion, finePointer, documentVisible })`.

- [ ] **Step 1: Write the failing unit tests.** Create `tests/visual-motion-foundation.test.mjs`:

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

test('interaction policy disables motion under reduced-motion preference', () => {
  assert.deepEqual(
    getInteractionPolicy({ reducedMotion: true, finePointer: true, documentVisible: true }),
    { ambient: false, pointerGlow: false, spatialMotion: false },
  );
});

test('fine pointer and visible document enable progressive effects when motion is allowed', () => {
  assert.deepEqual(
    getInteractionPolicy({ reducedMotion: false, finePointer: true, documentVisible: true }),
    { ambient: true, pointerGlow: true, spatialMotion: true },
  );
});
```

- [ ] **Step 2: Run and confirm RED.**

```bash
node --test tests/visual-motion-foundation.test.mjs
```

Expected: module-not-found error for the new token modules.

- [ ] **Step 3: Implement `lib/ui/visual-tokens.mjs`.**

```js
export const VISUAL_TOKENS = Object.freeze({
  color: Object.freeze({
    background: '#02040A',
    iceBlue: '#8BE9FF',
    electricPurple: '#A78BFA',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
  }),
  glass: Object.freeze({
    subtle: 'rgba(8, 15, 29, 0.48)',
    panel: 'rgba(8, 15, 29, 0.68)',
    focus: 'rgba(10, 18, 34, 0.82)',
  }),
  radius: Object.freeze({ sm: 12, md: 18, lg: 24, xl: 32 }),
  shadow: Object.freeze({
    low: '0 12px 40px rgba(0,0,0,.18)',
    medium: '0 20px 60px rgba(0,0,0,.26)',
    high: '0 30px 90px rgba(0,0,0,.34)',
  }),
  focus: Object.freeze({ ring: '0 0 0 3px rgba(139,233,255,.28)' }),
});
```

- [ ] **Step 4: Implement `lib/ui/motion-tokens.mjs`.**

```js
export const MOTION_TOKENS = Object.freeze({
  instant: 120,
  fast: 180,
  standard: 280,
  springMin: 350,
  springMax: 500,
  ambientMin: 8000,
  ambientMax: 20000,
});

const TWEEN_MS = Object.freeze({
  instant: MOTION_TOKENS.instant,
  fast: MOTION_TOKENS.fast,
  standard: MOTION_TOKENS.standard,
});

export function getTransition(kind = 'standard', reducedMotion = false) {
  if (reducedMotion) return { duration: 0.01 };
  if (kind === 'spring') {
    return { type: 'spring', stiffness: 360, damping: 32, mass: 0.9 };
  }
  const ms = TWEEN_MS[kind] ?? MOTION_TOKENS.standard;
  return { type: 'tween', duration: ms / 1000, ease: [0.22, 1, 0.36, 1] };
}
```

- [ ] **Step 5: Implement `lib/ui/interaction-config.mjs`.**

```js
export function getInteractionPolicy({
  reducedMotion = false,
  finePointer = false,
  documentVisible = true,
} = {}) {
  return {
    ambient: !reducedMotion && documentVisible,
    pointerGlow: !reducedMotion && documentVisible && finePointer,
    spatialMotion: !reducedMotion,
  };
}
```

- [ ] **Step 6: Run and confirm GREEN.**

```bash
node --test tests/visual-motion-foundation.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add lib/ui/visual-tokens.mjs lib/ui/motion-tokens.mjs lib/ui/interaction-config.mjs tests/visual-motion-foundation.test.mjs
git commit -m "feat: add visual and motion tokens"
```

## Task 3: Reusable UI Primitives and Aurora CSS

**Interfaces:**
- `<GlassSurface level="subtle|panel|focus" as="div">`.
- `<MotionSurface transitionKind="standard|spring" reducedMotion={boolean}>`.
- `<AuroraBackground />` decorative only.
- `<GlassGlyph>`, `<StatusPill>`, `<MetricChip>`, `<GlowButton>`, `<AnimatedNumber>`.

- [ ] **Step 1: Write the failing source-contract test.** Create `tests/visual-motion-ui-contract.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('visual primitives expose approved glass and motion contracts', () => {
  const glass = read('components/ui/GlassSurface.jsx');
  const motion = read('components/ui/MotionSurface.jsx');
  const aurora = read('components/ui/AuroraBackground.jsx');
  const button = read('components/ui/GlowButton.jsx');
  assert.match(glass, /glass-subtle/);
  assert.match(glass, /glass-panel/);
  assert.match(glass, /glass-focus/);
  assert.match(motion, /motion\/react/);
  assert.match(aurora, /aria-hidden/);
  assert.match(aurora, /requestAnimationFrame/);
  assert.equal(/setState\(/.test(aurora), false);
  assert.match(button, /focus-visible/);
});
```

- [ ] **Step 2: Run and confirm RED.**

```bash
node --test tests/visual-motion-ui-contract.test.mjs
```

Expected: missing-file failure.

- [ ] **Step 3: Add the visual CSS primitives to `app/globals.css`.** Preserve existing selectors and add these semantic variables/classes:

```css
:root {
  --v5-ice-blue: #8be9ff;
  --v5-electric-purple: #a78bfa;
  --v5-glass-subtle: rgba(8, 15, 29, 0.48);
  --v5-glass-panel: rgba(8, 15, 29, 0.68);
  --v5-glass-focus: rgba(10, 18, 34, 0.82);
  --v5-border-subtle: rgba(139, 233, 255, 0.12);
  --v5-border-panel: rgba(139, 233, 255, 0.18);
  --v5-border-focus: rgba(139, 233, 255, 0.30);
  --v5-focus-ring: 0 0 0 3px rgba(139, 233, 255, 0.28);
}

.v5-glass-subtle { background: var(--v5-glass-subtle); backdrop-filter: blur(12px); }
.v5-glass-panel { background: var(--v5-glass-panel); backdrop-filter: blur(18px); }
.v5-glass-focus { background: var(--v5-glass-focus); backdrop-filter: blur(22px); }
.v5-glass { background: var(--v5-glass-panel); backdrop-filter: blur(18px); }

.v5-aurora { position: fixed; inset: -12%; pointer-events: none; overflow: hidden; }
.v5-aurora::before,
.v5-aurora::after { content: ''; position: absolute; inset: 0; will-change: transform, opacity; }
.v5-aurora::before {
  background: radial-gradient(circle at 22% 24%, rgba(139,233,255,.15), transparent 34%);
  animation: v5-aurora-a 12s ease-in-out infinite alternate;
}
.v5-aurora::after {
  background: radial-gradient(circle at 78% 16%, rgba(167,139,250,.16), transparent 32%);
  animation: v5-aurora-b 18s ease-in-out infinite alternate;
}
@keyframes v5-aurora-a { to { transform: translate3d(3%, -2%, 0) scale(1.05); opacity: .82; } }
@keyframes v5-aurora-b { to { transform: translate3d(-3%, 3%, 0) scale(1.06); opacity: .78; } }

@media (prefers-reduced-motion: reduce) {
  .v5-aurora::before, .v5-aurora::after { animation: none !important; }
}
```

- [ ] **Step 4: Implement the focused primitives.** Use these exact boundaries rather than embedding feature behavior:

```jsx
// components/ui/GlassSurface.jsx
import React from 'react';
const LEVEL_CLASS = { subtle: 'v5-glass-subtle', panel: 'v5-glass-panel', focus: 'v5-glass-focus' };
export default function GlassSurface({ as: Tag = 'div', level = 'panel', className = '', children, ...props }) {
  return <Tag className={`${LEVEL_CLASS[level] || LEVEL_CLASS.panel} ${className}`} {...props}>{children}</Tag>;
}
```

```jsx
// components/ui/MotionSurface.jsx
'use client';
import React from 'react';
import { motion } from 'motion/react';
import { getTransition } from '../../lib/ui/motion-tokens.mjs';
export default function MotionSurface({ transitionKind = 'standard', reducedMotion = false, transition, ...props }) {
  return <motion.div transition={transition || getTransition(transitionKind, reducedMotion)} {...props} />;
}
```

```jsx
// components/ui/GlowButton.jsx
'use client';
import React from 'react';
export default function GlowButton({ className = '', ...props }) {
  return <button className={`rounded-xl border border-white/10 focus-visible:outline-none focus-visible:shadow-[var(--v5-focus-ring)] ${className}`} {...props} />;
}
```

Implement `GlassGlyph`, `StatusPill`, and `MetricChip` as presentational wrappers with no storage/network logic. `AnimatedNumber` must immediately render `format(value)` when `reducedMotion` is true and may tween numeric display only when motion is allowed.

- [ ] **Step 5: Implement `AuroraBackground.jsx` without pointer state.**

```jsx
'use client';
import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

export default function AuroraBackground() {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return undefined;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    const move = (event) => {
      if (!fine.matches || document.visibilityState !== 'visible') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--pointer-x', `${event.clientX}px`);
        node.style.setProperty('--pointer-y', `${event.clientY}px`);
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
    };
  }, [reducedMotion]);
  return <div ref={ref} className="v5-aurora" aria-hidden="true" />;
}
```

- [ ] **Step 6: Run targeted tests and confirm GREEN.**

```bash
node --test tests/visual-motion-ui-contract.test.mjs tests/visual-motion-foundation.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add app/globals.css components/ui tests/visual-motion-ui-contract.test.mjs
git commit -m "feat: add premium visual primitives"
```

## Task 4: Gate the New Foundation in AppShell

**Interfaces:**
- `AppShell({ visualSystemEnabled=false, ...existingProps })`.
- `app/page.jsx` reads the centralized flag only.

- [ ] **Step 1: Add the failing gate contract.** Append to `tests/visual-motion-ui-contract.test.mjs`:

```js
test('visual system is separately gated and legacy shell path remains', () => {
  const page = read('app/page.jsx');
  const shell = read('components/shell/AppShell.jsx');
  assert.match(page, /V5_VISUAL_SYSTEM/);
  assert.match(page, /visualSystemEnabled=/);
  assert.match(shell, /visualSystemEnabled = false/);
  assert.match(shell, /AuroraBackground/);
  assert.match(shell, /v5-ambient/);
});
```

- [ ] **Step 2: Run and confirm RED.**

```bash
node --test tests/visual-motion-ui-contract.test.mjs
```

Expected: gate contract fails.

- [ ] **Step 3: Update `AppShell.jsx` with a reversible background boundary.** Preserve existing Sidebar/TopBar/StatusHud/MobileDock wiring and replace only the ambient line with:

```jsx
export default function AppShell({
  activePage,
  onNavigate,
  status,
  children,
  onOpenCommand,
  onNewPrompt,
  visualSystemEnabled = false,
}) {
  return (
    <div className="v5-shell min-h-screen bg-[var(--v5-bg)] text-slate-200 overflow-hidden relative">
      {visualSystemEnabled
        ? <AuroraBackground />
        : <div className="v5-ambient pointer-events-none fixed inset-0" aria-hidden="true" />}
      {/* keep the existing shell body unchanged */}
    </div>
  );
}
```

When applying this edit, retain the current full shell body instead of the explanatory comment shown in the snippet.

- [ ] **Step 4: Wire the centralized flag from `app/page.jsx`.** Add alongside the existing V5 booleans:

```jsx
const v5VisualSystemEnabled = Boolean(V5_FEATURE_FLAGS.V5_VISUAL_SYSTEM);
```

Pass it to the existing AppShell instance:

```jsx
<AppShell
  activePage={activePage}
  onNavigate={navigate}
  status={status}
  onOpenCommand={openCommand}
  onNewPrompt={newPrompt}
  visualSystemEnabled={v5VisualSystemEnabled}
>
  {pageContent}
</AppShell>
```

Use the actual existing callback names in the file; do not create new callbacks merely to match this illustrative prop ordering.

- [ ] **Step 5: Run targeted regressions.**

```bash
node --test tests/visual-motion-ui-contract.test.mjs tests/feature-flags.test.mjs tests/feature-flag-integration.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add app/page.jsx components/shell/AppShell.jsx tests/visual-motion-ui-contract.test.mjs
git commit -m "feat: gate premium visual foundation"
```

## Task 5: Phase Verification and PR Gate

- [ ] **Step 1: Run the full suite.**

```bash
npm test
```

Expected: all tests pass and the existing catalog regression still reports exactly 80 built-in prompts.

- [ ] **Step 2: Build for Cloudflare/OpenNext.**

```bash
npm run build
```

Expected: successful Next/OpenNext build.

- [ ] **Step 3: Verify required artifacts.**

```bash
test -f .open-next/worker.js
test -d .open-next/assets
test -f .open-next/.build/open-next.config.edge.mjs
```

Expected: all commands exit 0.

- [ ] **Step 4: Run Wrangler dry-run only.**

```bash
rm -rf .wrangler-dry-run
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

Expected: bundle processes successfully and Wrangler exits without deployment.

- [ ] **Step 5: Audit changed-file scope.**

```bash
git diff --name-only "$(git merge-base main HEAD)"...HEAD
```

Expected: approved docs plus Phase 1 UI/token/test/dependency files only; no Supabase migration, provider adapter, prompt catalog content, secret, or production-deployment changes.

- [ ] **Step 6: Open the Phase 1 PR and stop.** PR body must include current head SHA, exact test count, build result, artifact result, Wrangler dry-run result, `V5_VISUAL_SYSTEM` default-off state, and explicit notes that no production deploy or DB DDL occurred. Do not merge until the user separately types `merge`.

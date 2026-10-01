# Prompt.OS V5 Phase 0 Foundation Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic V5 feature flags and version metadata so each later subsystem can ship disabled, be tested independently, and be enabled without scattering ad-hoc environment checks.

**Architecture:** Define one pure feature-flag module with explicit defaults and environment overrides. UI code consumes the module; no component reads `process.env` directly for V5 rollout flags.

**Tech Stack:** Next.js 16.3.5, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-prompt-os-v5-design.md`

## Global Constraints

- Initial flags: `V5_WORKSPACE`, `V5_SYNC`, `V5_EVALUATION`, `V5_ANALYTICS`.
- Unknown flags resolve to `false`.
- Production defaults remain off until each phase passes its release gates.
- No secret values are stored in feature flags.

---

### Task 1: Feature flag registry

**Files:**
- Create: `lib/ui/feature-flags.mjs`
- Create: `tests/feature-flags.test.mjs`
- Modify: `.env.example`

**Interfaces:**
- `V5_FEATURE_FLAGS`
- `readFeatureFlags(env)` -> `{ V5_WORKSPACE, V5_SYNC, V5_EVALUATION, V5_ANALYTICS }`
- `isFeatureEnabled(flags, name)` -> boolean.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFeatureFlags, isFeatureEnabled } from '../lib/ui/feature-flags.mjs';

test('V5 flags default to false', () => {
  assert.deepEqual(readFeatureFlags({}), {
    V5_WORKSPACE: false,
    V5_SYNC: false,
    V5_EVALUATION: false,
    V5_ANALYTICS: false,
  });
});

test('only explicit true values enable a flag', () => {
  const flags = readFeatureFlags({ NEXT_PUBLIC_V5_SYNC: 'true' });
  assert.equal(isFeatureEnabled(flags, 'V5_SYNC'), true);
  assert.equal(isFeatureEnabled(flags, 'UNKNOWN'), false);
});
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/feature-flags.test.mjs
```

- [ ] **Step 3: Implement registry and document env names**

Use public environment names only for non-secret rollout toggles:

```text
NEXT_PUBLIC_V5_WORKSPACE=false
NEXT_PUBLIC_V5_SYNC=false
NEXT_PUBLIC_V5_EVALUATION=false
NEXT_PUBLIC_V5_ANALYTICS=false
```

`readFeatureFlags` treats only the string `true` (case-insensitive) as enabled.

- [ ] **Step 4: Verify**

```bash
node --test tests/feature-flags.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add lib/ui/feature-flags.mjs tests/feature-flags.test.mjs .env.example
git commit -m "feat: add V5 rollout feature flags"
```

### Task 2: App-level flag consumption

**Files:**
- Modify: `components/PromptOS.jsx`
- Test: `tests/feature-flag-integration.test.mjs`

**Interfaces:**
- `PromptOS` reads one flags object and passes booleans to V5 modules; later phases do not read env directly.

- [ ] **Step 1: Add failing integration contract test**

```js
const source = fs.readFileSync('components/PromptOS.jsx', 'utf8');
assert.match(source, /readFeatureFlags/);
assert.equal(/process\.env\.NEXT_PUBLIC_V5_/.test(source), false);
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/feature-flag-integration.test.mjs
```

- [ ] **Step 3: Wire the registry at the orchestration boundary**

Create one memoized/read-once `featureFlags` object in the client shell and pass it into Workspace, Sync, Evaluation, and Analytics modules as those modules are introduced.

- [ ] **Step 4: Verify**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add components/PromptOS.jsx tests/feature-flag-integration.test.mjs
git commit -m "refactor: centralize V5 feature flag consumption"
```
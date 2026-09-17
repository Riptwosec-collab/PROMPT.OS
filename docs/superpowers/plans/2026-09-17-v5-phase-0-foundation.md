# Prompt.OS V5 Phase 0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish modular V5 foundations without changing user-visible behavior or losing any of the 80 built-in prompts or mutable user state.

**Architecture:** Keep `components/PromptOS.jsx` as the legacy-compatible orchestrator while extracting shared service boundaries for flags, prompt state, migration, and runtime metadata. The extracted modules become stable dependencies for later phases; no new product behavior is enabled by default.

**Tech Stack:** Next 16.3.5, React 19.3.0, Node test runner, Tailwind 4.3.3, OpenNext 1.20.6, Wrangler 4.131.2.

**Spec:** `docs/superpowers/specs/2026-09-17-prompt-os-v5-complete-upgrade-design.md`

## Global Constraints

- Preserve exactly 80 built-in prompts unless an explicitly approved catalog change occurs.
- Preserve favorites, pinned state, rating, collections, variables, versions, results, run history, and timestamps.
- Legacy Library remains available and shares the same underlying local prompt data.
- No production Supabase migration is applied in this phase.
- No production deployment is performed in this phase.
- Feature flags remain granular and default-safe.
- Every code task follows TDD: failing test, implementation, passing test, commit.
- Final gate: `npm test`, `npm run build`, and Wrangler/OpenNext validation already encoded by repository CI must pass.

---

## File Structure

**Create**
- `lib/prompts/state-schema.mjs` — schema version constants, prompt-state normalization and validation.
- `lib/prompts/state-migration.mjs` — idempotent migration from legacy prompt state to V5-compatible records.
- `lib/prompts/state-selectors.mjs` — pure selectors shared by Legacy and V5.
- `tests/v5-state-migration.test.mjs` — preservation/idempotency regression coverage.
- `tests/v5-foundation-boundaries.test.mjs` — contract tests for feature flags and module boundaries.

**Modify**
- `components/PromptOS.jsx` — delegate migration/selectors without changing user-visible behavior.
- `components/V5FeatureFlagProvider.jsx` — expose granular subsystem flags while preserving existing flags.
- `tests/feature-flags.test.mjs`
- `tests/feature-flag-integration.test.mjs`
- `tests/v5-review-regressions.test.mjs`

## Task 1: Add V5 State Schema Contracts

**Files:**
- Create: `lib/prompts/state-schema.mjs`
- Create: `tests/v5-state-migration.test.mjs`

**Interfaces:**
- Produces: `V5_PROMPT_SCHEMA_VERSION`, `normalizePromptRecord(prompt)`, `validatePromptRecord(prompt)`.

- [ ] **Step 1: Write the failing schema test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { V5_PROMPT_SCHEMA_VERSION, normalizePromptRecord, validatePromptRecord } from '../lib/prompts/state-schema.mjs';

test('normalizes legacy prompt records without dropping mutable state', () => {
  const legacy = {
    id: 'p1', name: 'TEST', prompt: 'Hello {{name}}', favorite: true,
    pinned: true, rating: 5, variables: { name: 'Mek' }, versions: [{ id: 'v1' }],
    results: [{ id: 'r1' }], runs: 7, copyCount: 3, createdAt: '2026-01-01T00:00:00.000Z'
  };
  const value = normalizePromptRecord(legacy);
  assert.equal(value.schemaVersion, V5_PROMPT_SCHEMA_VERSION);
  assert.equal(value.favorite, true);
  assert.equal(value.pinned, true);
  assert.equal(value.rating, 5);
  assert.deepEqual(value.variables, { name: 'Mek' });
  assert.equal(value.versions.length, 1);
  assert.equal(value.results.length, 1);
  assert.equal(validatePromptRecord(value).ok, true);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test tests/v5-state-migration.test.mjs`
Expected: FAIL because `state-schema.mjs` does not exist.

- [ ] **Step 3: Implement minimal normalization and validation**

Implement `V5_PROMPT_SCHEMA_VERSION = 5`; preserve unknown fields; add missing V5 fields with non-destructive defaults; validation must require `id`, `name`, `prompt`, and numeric `schemaVersion`.

- [ ] **Step 4: Run the test and confirm GREEN**

Run: `node --test tests/v5-state-migration.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/prompts/state-schema.mjs tests/v5-state-migration.test.mjs
git commit -m "refactor: add v5 prompt state schema"
```

## Task 2: Add Idempotent Prompt-State Migration

**Files:**
- Create: `lib/prompts/state-migration.mjs`
- Modify: `tests/v5-state-migration.test.mjs`

**Interfaces:**
- Consumes: `normalizePromptRecord`, `validatePromptRecord`.
- Produces: `migratePromptState(prompts)` returning `{ ok, prompts, changed, errors }`.

- [ ] **Step 1: Add failing tests for idempotency and failure safety**

Add assertions that migrating the same data twice produces deep-equal prompt arrays and that an invalid record returns `ok: false` without mutating the source array.

- [ ] **Step 2: Run targeted test and confirm RED**

Run: `node --test tests/v5-state-migration.test.mjs`
Expected: FAIL because `migratePromptState` is missing.

- [ ] **Step 3: Implement copy-first migration**

Implementation must clone each record, normalize it, validate the normalized copy, and only return the migrated collection when every record validates. Never mutate input objects.

- [ ] **Step 4: Run targeted test and confirm GREEN**

Run: `node --test tests/v5-state-migration.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/prompts/state-migration.mjs tests/v5-state-migration.test.mjs
git commit -m "refactor: add idempotent v5 prompt migration"
```

## Task 3: Extract Shared Prompt Selectors

**Files:**
- Create: `lib/prompts/state-selectors.mjs`
- Modify: `tests/v5-foundation-boundaries.test.mjs`

**Interfaces:**
- Produces: `selectVisiblePrompts`, `selectPromptById`, `selectFavoritePrompts`, `selectPinnedPrompts`.

- [ ] **Step 1: Write failing selector tests**

Cover soft-deleted records being excluded from visible prompts while still retrievable explicitly by ID when `includeDeleted: true` is passed.

- [ ] **Step 2: Run RED**

Run: `node --test tests/v5-foundation-boundaries.test.mjs`
Expected: FAIL due to missing selectors.

- [ ] **Step 3: Implement pure selectors**

Selectors must never mutate or sort the source array in place.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/v5-foundation-boundaries.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/prompts/state-selectors.mjs tests/v5-foundation-boundaries.test.mjs
git commit -m "refactor: extract prompt state selectors"
```

## Task 4: Expand Granular Feature Flags

**Files:**
- Modify: `components/V5FeatureFlagProvider.jsx`
- Modify: `tests/feature-flags.test.mjs`
- Modify: `tests/feature-flag-integration.test.mjs`

**Interfaces:**
- Produces flags: `V5_SEARCH`, `V5_PROMPT_DETAIL`, `V5_VARIABLES`, `V5_PROMPT_HEALTH`, `V5_SMART_COLLECTIONS`, `V5_EXECUTION_ENGINE`, `V5_AI_IMPROVE`, `V5_EVALUATION`, `V5_COST_GUARD`, `V5_PROVIDER_SELECTOR`, `V5_COMMAND_PALETTE`, `V5_WORKSPACE`, `V5_CLOUD_SYNC`, `V5_USAGE_ANALYTICS`, `V5_WORKFLOW`.

- [ ] **Step 1: Extend tests with the exact flag set**
- [ ] **Step 2: Run `node --test tests/feature-flags.test.mjs tests/feature-flag-integration.test.mjs` and confirm RED**
- [ ] **Step 3: Add default-false granular flags while preserving existing public flag accessors**
- [ ] **Step 4: Re-run targeted tests and confirm GREEN**
- [ ] **Step 5: Commit**

```bash
git add components/V5FeatureFlagProvider.jsx tests/feature-flags.test.mjs tests/feature-flag-integration.test.mjs
git commit -m "feat: add granular v5 subsystem flags"
```

## Task 5: Integrate Migration Into PromptOS Without UX Change

**Files:**
- Modify: `components/PromptOS.jsx`
- Modify: `tests/v5-review-regressions.test.mjs`
- Modify: `tests/v5-foundation-boundaries.test.mjs`

**Interfaces:**
- Consumes: `migratePromptState`, shared selectors.
- Produces no new user-facing UI.

- [ ] **Step 1: Add regression assertions for 80 built-ins and preserved mutable state**
- [ ] **Step 2: Run the focused regression tests and confirm RED against the desired integration seam**
- [ ] **Step 3: Replace duplicated inline normalization/selection logic with the new shared modules**
- [ ] **Step 4: Verify Legacy and V5 flag-off behavior remains unchanged**
- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Run production build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/PromptOS.jsx tests/v5-review-regressions.test.mjs tests/v5-foundation-boundaries.test.mjs
git commit -m "refactor: wire shared v5 prompt foundations"
```

## Phase 0 Acceptance Gate

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Exactly 80 catalog prompts remain available.
- [ ] Legacy Library behavior is unchanged.
- [ ] All new V5 feature flags are disabled by default.
- [ ] No Supabase production action has occurred.
- [ ] Create a reviewable Phase 0 PR and stop before merge until explicit authorization.

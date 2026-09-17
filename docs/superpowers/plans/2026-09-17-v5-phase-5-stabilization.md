# Prompt.OS V5 Phase 5 Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate cross-feature behavior, migration safety, mobile/desktop UX, Thai/English coverage, offline recovery, security boundaries, and Legacy fallback before any Legacy retirement discussion.

**Architecture:** This phase adds minimal product code. Its purpose is regression closure, observability of failure modes, recovery verification, and removal of blockers discovered while exercising all V5 subsystems together.

**Tech Stack:** Next 16.3.5, React 19.3.0, Node test runner, OpenNext 1.20.6, Wrangler 4.131.2.

**Spec:** `docs/superpowers/specs/2026-09-17-prompt-os-v5-complete-upgrade-design.md`

## Global Constraints
- Legacy Library is not removed in this phase.
- No production Supabase migration.
- No automatic production deployment.
- Do not expand scope with marketplace, RBAC, real Claude/Gemini execution, parallel workflows, or cloud file storage.
- Every blocker found must receive a failing regression test before the fix.

---

## File Structure

**Create**
- `tests/v5-cross-feature-regression.test.mjs`
- `tests/v5-migration-recovery.test.mjs`
- `tests/v5-security-boundaries.test.mjs`
- `tests/v5-legacy-fallback.test.mjs`
- `tests/v5-mobile-accessibility-contract.test.mjs`

**Modify as failures require**
- Focused V5 modules introduced in Phases 0–4.
- `components/PromptOS.jsx` only for integration defects.
- `components/LanguageRuntime.jsx` only for localization defects.
- `.env.example` only if documented non-secret provider/config flags are missing.
- `README.md` to document feature flags, local verification, migration non-application, and Legacy fallback.

## Task 1: Catalog and Mutable-State End-to-End Regression

- [ ] Write a regression fixture with all 80 built-ins plus at least one user-created prompt carrying favorite, pinned, rating, variables, versions, results, runs, copy count, folder, pack, and timestamps.
- [ ] Assert migration + search + workspace + detail render preserves all mutable state and exactly 80 catalog-managed built-ins.
- [ ] Run `node --test tests/v5-cross-feature-regression.test.mjs` and confirm RED for any uncovered integration seam.
- [ ] Fix the smallest owning module for each failure.
- [ ] Re-run until GREEN.
- [ ] Commit `test: lock v5 catalog and state compatibility`.

## Task 2: Migration Recovery and Backup Round Trip

- [ ] Write failing tests for invalid migration preserving old state, backup export/import round trip, repeated migration idempotency, and soft-deleted entity preservation.
- [ ] Run `node --test tests/v5-migration-recovery.test.mjs` and confirm RED.
- [ ] Fix migration/backup modules until all cases pass.
- [ ] Commit `test: verify v5 migration recovery`.

## Task 3: Security Boundary Regression

- [ ] Write tests asserting browser-visible bundles/state never contain `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` values.
- [ ] Add tests proving sync sanitizer excludes file objects/raw credentials and workflow outputs cannot replace execution-system policy fields.
- [ ] Add tests proving disabled Claude/Gemini providers never call transport code.
- [ ] Run `node --test tests/v5-security-boundaries.test.mjs` and confirm failures before fixes where applicable.
- [ ] Fix only owning boundary modules.
- [ ] Commit `test: harden v5 security boundaries`.

## Task 4: Legacy Fallback Matrix

Test flag combinations:

```text
all V5 off
core only
core + power UX
AI tools only where dependencies allow
cloud flag with backend unavailable
all implemented V5 flags on
```

- [ ] Write failing tests proving Legacy Library is reachable in every supported rollout state.
- [ ] Assert shared state changes made in V5 are visible in Legacy where the legacy UI exposes the same field.
- [ ] Run `node --test tests/v5-legacy-fallback.test.mjs`.
- [ ] Fix routing/gating defects.
- [ ] Commit `test: verify legacy fallback matrix`.

## Task 5: Offline and Failure Recovery Matrix

Cover:
- AI provider error preserves entered variables.
- Sync error preserves local mutation and queue.
- Analytics sink error preserves successful AI result.
- Workflow step failure preserves completed steps and blocks later steps by default.
- Cancellation records cancelled status.
- Cloud backend missing shows `Backend not configured` rather than `Synced`.

- [ ] Add these cases to `tests/v5-cross-feature-regression.test.mjs`.
- [ ] Run targeted tests and fix owning modules.
- [ ] Commit `test: verify v5 failure recovery`.

## Task 6: Thai/English Coverage

- [ ] Extend existing i18n tests to traverse all new V5 labels and dynamic metadata paths in both Thai and English modes.
- [ ] Assert Thai prompt titles/descriptions are used when explicitly available rather than machine-translating stored metadata at render time.
- [ ] Run `node --test tests/i18n-complete.test.mjs tests/i18n-coverage.test.mjs`.
- [ ] Fix only missing localization paths.
- [ ] Commit `test: complete v5 bilingual coverage`.

## Task 7: Mobile and Accessibility Contracts

- [ ] Add structural tests for mobile Prompt Detail section order, workflow ordered-list UI, visible focus, modal focus return, keyboard palette operation, labels on variable inputs, disabled/loading state semantics, and Escape handling.
- [ ] Run `node --test tests/v5-mobile-accessibility-contract.test.mjs` and confirm RED where contracts are missing.
- [ ] Fix components without introducing a desktop-only canvas dependency.
- [ ] Commit `test: verify v5 mobile accessibility`.

## Task 8: Performance/Loading Boundaries

- [ ] Add source-level contract tests that Evaluation Lab, Analytics, and Workflow Builder are lazy-loaded from the main V5 shell rather than eagerly imported into initial Home render.
- [ ] Confirm RED if any heavy module is eager.
- [ ] Introduce `next/dynamic` or equivalent repository-consistent lazy loading with meaningful loading states.
- [ ] Re-run tests.
- [ ] Commit `perf: lazy load heavy v5 modules`.

## Task 9: Documentation and Operator Notes

**Files:**
- Modify: `README.md`
- Modify: `.env.example` only for safe public/config placeholders, never secrets.

- [ ] Document the V5 feature flags and phased rollout behavior.
- [ ] Document OpenAI live vs Claude/Gemini disabled-ready status.
- [ ] Document that Supabase migrations exist in repo but production application requires a separate explicit action.
- [ ] Document verification commands: `npm test`, `npm run build`.
- [ ] Document Legacy fallback and backup/export recovery path.
- [ ] Commit `docs: add v5 rollout and recovery guide`.

## Task 10: Final CI and Acceptance Gate

- [ ] Run `npm test` and require PASS.
- [ ] Run `npm run build` and require PASS.
- [ ] Run the repository's Wrangler/OpenNext dry-run/bundle validation path and require PASS.
- [ ] Confirm exactly 80 built-in prompts.
- [ ] Confirm all new subsystem flags can be disabled independently.
- [ ] Confirm no production Supabase migration was executed.
- [ ] Confirm no production deploy was executed.
- [ ] Record any non-blocking follow-ups separately; no blocker may remain.
- [ ] Open Stabilization PR and stop before merge until explicit authorization.

## Legacy Retirement Decision

Passing this plan only makes Legacy **eligible for later retirement review**. It does not authorize removal. Legacy removal requires a separate dedicated change after explicit approval.

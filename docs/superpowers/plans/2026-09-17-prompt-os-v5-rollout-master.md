# Prompt.OS V5 Complete Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved Prompt.OS V5 upgrade through independently testable, reversible phases while preserving the 80-prompt catalog, mutable user state, and Legacy Library fallback.

**Architecture:** This master plan coordinates five subsystem plans. Each phase produces working software, passes the repository CI/build gate, opens a reviewable PR, and stops before merge unless the user explicitly authorizes merge. Implementation branches start from the latest `main`, not the documentation branch.

**Tech Stack:** Next 16.3.5, React 19.3.0, Tailwind 4.3.3, Supabase JS 2.116.0, OpenAI 7.15.0, OpenNext 1.20.6, Wrangler 4.131.2, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-17-prompt-os-v5-complete-upgrade-design.md`

## Global Constraints
- Preserve exactly 80 built-in prompts unless a separate catalog change is approved.
- Preserve mutable user state and Legacy compatibility.
- OpenAI is the only enabled AI provider in this rollout.
- Claude and Gemini remain disabled-ready.
- Supabase migrations are prepared but not applied to production without separate explicit authorization.
- Production deployment is never implied by merge.
- Workflow V1 is sequential only.
- Multi-call features use Cost Guard.
- No Legacy removal is authorized by this plan.

---

## Execution Order

### Phase 0 — Foundation
Plan: `docs/superpowers/plans/2026-09-17-v5-phase-0-foundation.md`

Deliverables:
- Shared V5 state schema and migration.
- Shared prompt selectors.
- Granular feature flags.
- `PromptOS.jsx` integration without behavior change.

Gate:
- `npm test` PASS.
- `npm run build` PASS.
- 80 built-ins preserved.
- Legacy unchanged.

### Phase 1 — Core Experience
Plan: `docs/superpowers/plans/2026-09-17-v5-phase-1-core-experience.md`

Deliverables:
- Search V2.
- Prompt Detail V2.
- Variables V2.
- Prompt Health V2.
- Smart Collections.
- Recent/Most Used.
- Prompt Packs.
- Workspace foundation.

Dependencies:
- Phase 0 merged.

### Phase 2 — AI Tools and Evaluation
Plan: `docs/superpowers/plans/2026-09-17-v5-phase-2-ai-evaluation.md`

Deliverables:
- Unified Execution Engine.
- Provider registry.
- OpenAI live adapter.
- Disabled-ready Claude/Gemini adapters.
- Retry/cancellation.
- Cost Guard.
- Telemetry.
- AI Improve V2.
- Evaluation Lab V2.

Dependencies:
- Phase 0 merged.
- Phase 1 prompt/variable interfaces available where UI integration requires them.

### Phase 3 — Power UX
Plan: `docs/superpowers/plans/2026-09-17-v5-phase-3-power-ux.md`

Deliverables:
- Command Palette.
- Keyboard shortcuts.
- Workspace/Folder full UX.
- Prompt Pack integration.

Dependencies:
- Phase 1 search/workspace model merged.

### Phase 4 — Cloud, Analytics, Workflow
Plan: `docs/superpowers/plans/2026-09-17-v5-phase-4-cloud-analytics-workflow.md`

Deliverables:
- Local-first sync queue/engine.
- Conflict handling.
- Backup import/export.
- Usage/Cost Analytics.
- Budget dashboard integration.
- Sequential workflow model/runner/UI.
- Supabase migration files only.

Dependencies:
- Phase 2 execution/telemetry/cost interfaces merged.
- Phase 3 command/workspace surfaces merged for final integration.

### Phase 5 — Stabilization
Plan: `docs/superpowers/plans/2026-09-17-v5-phase-5-stabilization.md`

Deliverables:
- Cross-feature regression closure.
- Migration recovery verification.
- Security boundary verification.
- Legacy fallback matrix.
- TH/EN validation.
- Mobile/accessibility validation.
- Lazy-loading/performance boundaries.
- Operator documentation.

Dependencies:
- Phases 0–4 merged.

## Branch and PR Discipline

For each phase:

```text
latest main
  -> create phase feature branch
  -> execute plan with TDD
  -> run tests/build
  -> open PR
  -> report PR + CI state
  -> STOP
  -> merge only after explicit user command
```

Recommended branch names:

```text
feat/v5-foundation
feat/v5-core-experience
feat/v5-ai-evaluation
feat/v5-power-ux
feat/v5-cloud-analytics-workflow
feat/v5-stabilization
```

## Verification Commands

Repository scripts currently define:

```bash
npm test
npm run build
```

`npm run build` uses `opennextjs-cloudflare build`. The implementation worker must also use the repository's current Wrangler/OpenNext dry-run or bundle validation path when preparing each PR, matching the existing CI configuration rather than inventing a deployment command.

## Self-Review Checklist

- [x] Every approved design subsystem is assigned to a phase.
- [x] Legacy fallback remains throughout rollout.
- [x] Provider scope is explicit.
- [x] Supabase production boundary is explicit.
- [x] Workflow is sequential only.
- [x] Cost Guard is assigned before Evaluation/Workflow use.
- [x] Migration/state preservation is handled before V5 feature UI.
- [x] Security and recovery receive explicit stabilization coverage.
- [x] Each phase has its own test/build/PR stop point.
- [x] No implementation task authorizes merge or production deployment.

## Execution Start

Begin with Phase 0 only. Do not start Phase 1 until Phase 0 is implemented, verified, reviewed, and merged or otherwise explicitly accepted into the implementation base.

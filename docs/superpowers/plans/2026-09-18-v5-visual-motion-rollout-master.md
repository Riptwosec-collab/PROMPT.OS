# Prompt.OS V5 Visual & Motion Rollout Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coordinate the approved Prompt.OS Hybrid Premium Tech redesign as four independently testable and reversible implementation phases.

**Architecture:** Phase 1 starts from the approved `docs/v5-visual-motion-system-design` branch, whose code base is `main` plus the approved design/plan documents only; this causes those documents to travel with the first implementation PR. After Phase 1 merges, each later phase starts from the then-current merged `main`, follows its detailed plan with TDD, opens its own PR, and stops at a merge gate. Visual work remains presentation-layer-first; execution presentation in Phase 4 reuses the existing streaming transport rather than changing providers or backend architecture.

**Tech Stack:** Next 16.3.5, React 19.3.0, Tailwind 4.3.3, Motion for React beginning in Phase 1, Node test runner, OpenNext Cloudflare 1.20.6, Wrangler 4.131.2.

**Spec:** `docs/superpowers/specs/2026-09-18-prompt-os-v5-visual-motion-system-design.md`

## Global Constraints

- Preserve exactly 80 built-in prompts unless a separate catalog change is approved.
- Legacy PromptOS remains available until a separate removal decision.
- New visual flags default false.
- Every phase uses RED -> GREEN TDD and full regression/build/Wrangler dry-run verification before its PR is merge-ready.
- No phase applies Supabase production DDL.
- No phase performs a manual production deployment.
- Each PR requires a separate explicit `merge` authorization.
- Production deployment remains a separate authorization after merge.
- Approved design/plan documents are documentation-only prerequisites; they do not authorize production feature flags or deployment.

---

## Phase Order

1. **Visual + Motion Foundation** — `docs/superpowers/plans/2026-09-18-v5-visual-phase-1-foundation.md`
   - Motion dependency compatibility/install
   - visual/motion/interaction tokens
   - glass primitives
   - Aurora background
   - reduced-motion foundation
   - `V5_VISUAL_SYSTEM`

2. **Mission Control + Navigation** — `docs/superpowers/plans/2026-09-18-v5-visual-phase-2-mission-control-navigation.md`
   - shared prompt client store/default packs
   - Mission Control Home
   - command palette
   - morphing Sidebar/Top Bar
   - stable page transitions
   - floating mobile dock
   - bounded toast feedback
   - `V5_MISSION_CONTROL`

3. **Premium Prompt Experience** — `docs/superpowers/plans/2026-09-18-v5-visual-phase-3-premium-prompt-experience.md`
   - Premium Intelligence Cards
   - Spacious Showcase layout
   - Search V2 reflow animation
   - mobile long-press actions
   - Shared Card Expansion into existing Prompt Detail
   - `V5_PREMIUM_CARDS` and `V5_SHARED_PROMPT_TRANSITION`

4. **Immersive Run Experience** — `docs/superpowers/plans/2026-09-18-v5-visual-phase-4-immersive-run.md`
   - explicit run state machine
   - execution pulse
   - real telemetry only
   - streaming output / stop / retry / jump-to-latest
   - mobile run island
   - existing `V5_EXECUTION_ENGINE` + new `V5_IMMERSIVE_RUN`

## Per-Phase Branch / PR Protocol

- [ ] **Step 1: Establish the phase base.** For Phase 1, verify `docs/v5-visual-motion-system-design` still descends from the expected current `main` base; if `main` moved, rebase/update the docs branch before implementation. For Phases 2–4, confirm the required previous phase PR is merged and CI-green on current `main`.
- [ ] **Step 2: Create an isolated feature branch.** Phase 1: create `feat/v5-visual-foundation` from the refreshed docs branch so the approved spec/plans travel with the PR. Later phases: create `feat/v5-mission-control`, `feat/v5-premium-prompts`, or `feat/v5-immersive-run` from current `main`.
- [ ] **Step 3: Execute only the detailed plan for that phase.** Do not pull future-phase implementation work forward merely because adjacent files are open. Documentation for future phases may already exist on the branch after Phase 1 and is not implementation scope.
- [ ] **Step 4: Run phase targeted tests after each task and commit frequently.** Each task in the detailed plan is independently reviewable.
- [ ] **Step 5: Run final verification.** `npm test`, `npm run build`, OpenNext artifact checks, and `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`.
- [ ] **Step 6: Audit scope.** Run `git diff --name-only "$(git merge-base main HEAD)"...HEAD` and compare executable/source changes with the phase plan; documentation-only spec/plan files are expected in Phase 1.
- [ ] **Step 7: Open the phase PR.** Include exact head SHA, test count, build result, dry-run result, feature flags, and confirmation that production DB/deploy actions did not occur.
- [ ] **Step 8: Stop before merge.** Merge only after the user explicitly types `merge` for that PR.

## Final Acceptance

After Phase 4 is merged, perform a cross-phase acceptance pass with all visual flags enabled in a non-production verification environment. Confirm Hybrid Premium Tech appearance, Desktop + Mobile behavior, Spacious Showcase cards, shared prompt transition, Mission Control, keyboard navigation, stable page transitions, reduced-motion mode, bounded feedback surfaces, and immersive execution. Any request to enable flags or deploy to production is a separate operation and is not authorized by completion of these implementation plans.

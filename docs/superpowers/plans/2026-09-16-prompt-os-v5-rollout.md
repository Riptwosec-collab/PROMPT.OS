# Prompt.OS V5 Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Prompt.OS V5 incrementally as seven independently testable phases without rewriting the existing application.

**Architecture:** Keep the current Next.js/OpenNext/Cloudflare foundation and progressively extract domain logic from `components/PromptOS.jsx` into focused modules. Each phase leaves the app in a working state, preserves V4 data, and is gated by tests plus OpenNext/Wrangler verification.

**Tech Stack:** Next.js 16.3.5, React 19.3.0, Tailwind CSS 4.3.3, Supabase JS 2.116.0, OpenAI 7.15.0, OpenNext Cloudflare 1.20.6, Wrangler 4.131.2, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-prompt-os-v5-design.md`

## Global Constraints

- Preserve all V4 prompts, the 30 catalog prompts, versions, trash state, TH/EN support, Supabase auth, and existing OpenAI run flow.
- Supabase is authoritative for authenticated users; local storage is cache/offline/recovery state.
- Never ship Supabase service-role or secret keys to the browser.
- Use RLS on every exposed user-owned table; UPDATE policies require both `USING` and `WITH CHECK`.
- Permanent destructive actions keep two-step confirmation and create a snapshot where specified.
- AI Improve never silently replaces the current prompt.
- Historical AI cost remains an estimate tied to a pricing snapshot.
- Support `prefers-reduced-motion` and keyboard navigation.
- Keep the existing `npm test`, OpenNext build, and Wrangler dry-run gates green after each phase.

---

## Plan Sequence

0. `2026-09-16-prompt-os-v5-phase0-foundation.md` — centralized feature flags and rollout foundation.
1. `2026-09-16-prompt-os-v5-phase1-shell-command.md` — V5 shell, visual system, Mission Control foundation, global navigation, command palette.
2. `2026-09-16-prompt-os-v5-phase2-workspace-variables.md` — Workspace V2, folders, saved views, Variables V2, prompt inspector refactor.
3. `2026-09-16-prompt-os-v5-phase3-cloud-sync.md` — normalized Supabase schema, V4 migration, cloud-first revision sync, offline queue, snapshots, realtime.
4. `2026-09-16-prompt-os-v5-phase4-improve-evaluation.md` — AI Improve and Evaluation Lab with budget-aware batch execution.
5. `2026-09-16-prompt-os-v5-phase5-analytics-cost.md` — usage events, pricing snapshots, aggregates, budget alerts, Cost & Usage Center.
6. `2026-09-16-prompt-os-v5-phase6-polish.md` — error boundaries, performance pass, accessibility, responsive/mobile, final V5 rollout gates.

## Release Rule

Each phase is implemented on its own feature branch from the latest green `main`, reviewed independently, and merged only after:

```bash
npm test
npm run build
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

All three commands must succeed. Phase 3 additionally requires Supabase security/performance advisor review after schema changes.
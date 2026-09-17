# Prompt.OS V5 Phase 4 Cloud, Analytics, and Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local-first sync, conflict handling, usage/cost analytics, backup/import-export, and sequential workflow execution while preparing—but not applying—Supabase migrations.

**Architecture:** Local state remains immediate UX authority. Mutations enqueue sync operations for asynchronous Supabase transport. Analytics consumes execution telemetry; workflow consumes the shared execution engine and Cost Guard. Supabase migrations are repository artifacts only until separately authorized.

**Tech Stack:** Next 16.3.5, React 19.3.0, Supabase JS 2.116.0, Node test runner, OpenNext 1.20.6, Wrangler 4.131.2.

**Spec:** `docs/superpowers/specs/2026-09-17-prompt-os-v5-complete-upgrade-design.md`

## Global Constraints
- Local-first save must succeed independently of cloud availability.
- Sync must never silently overwrite conflicts.
- API keys, provider secrets, raw credentials, and temporary local files are excluded from sync payloads.
- Analytics failure must not fail successful AI execution.
- Workflow V1 is sequential only.
- Multi-step workflow requires Cost Guard confirmation.
- Supabase migration files may be created; production DB must remain untouched.

---

## File Structure

**Create**
- `lib/sync/queue.mjs`
- `lib/sync/engine.mjs`
- `lib/sync/conflicts.mjs`
- `lib/sync/backup.mjs`
- `lib/analytics/aggregate.mjs`
- `lib/workflow/model.mjs`
- `lib/workflow/runner.mjs`
- `lib/workflow/input-mapping.mjs`
- `components/analytics/UsageDashboard.jsx`
- `components/workflow/WorkflowBuilder.jsx`
- `components/workflow/WorkflowRunner.jsx`
- `components/workflow/WorkflowRunDetail.jsx`
- `tests/sync-queue-v2.test.mjs`
- `tests/sync-conflict-v2.test.mjs`
- `tests/backup-v2.test.mjs`
- `tests/analytics-v2.test.mjs`
- `tests/workflow-v1.test.mjs`
- `supabase/migrations/*_v5_workspace_versions.sql`
- `supabase/migrations/*_v5_evaluation_usage.sql`
- `supabase/migrations/*_v5_workflow_sync.sql`

**Modify**
- `components/CloudSyncPanel.jsx`
- `components/PromptOS.jsx`
- existing files under `lib/cloud`, `lib/sync`, `lib/analytics`, `lib/workspace` where current abstractions already provide compatible seams.
- existing Supabase migration tests if present.

## Task 1: Sync Operation Queue

**Interfaces:**
- `enqueueSyncOperation(queue, operation)`.
- `ackSyncOperation(queue, id)`.
- Operation types: `prompt.created`, `prompt.updated`, `prompt.archived`, `favorite.changed`, `folder.moved`, `workspace.updated`, `variablePreset.updated`, `workflow.updated`.

- [ ] Write failing tests for stable operation IDs, order preservation, deduplication policy, and offline persistence shape.
- [ ] Run `node --test tests/sync-queue-v2.test.mjs` and confirm RED.
- [ ] Implement immutable queue operations.
- [ ] Re-run and confirm GREEN.
- [ ] Commit `feat: add local first sync queue`.

## Task 2: Sync Sanitization and Engine

**Interfaces:**
- `sanitizeSyncPayload(entity)` removes secrets/files.
- `syncPendingOperations({ queue, transport, online })` returns updated queue and status.

- [ ] Add failing tests that reject/strip provider secrets, service role keys, raw credentials, and file objects.
- [ ] Confirm RED.
- [ ] Implement sanitizer and engine; offline returns queued status without data loss.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add safe sync engine`.

## Task 3: Conflict Detection

**Interfaces:**
- `detectConflict(local, remote)` based on entity/version timestamps and immutable version IDs.
- `resolveConflict(conflict, strategy)` where strategy is `keep-local | keep-cloud | save-both`.

- [ ] Write failing tests for concurrent edits and no-conflict fast path.
- [ ] Run `node --test tests/sync-conflict-v2.test.mjs` and confirm RED.
- [ ] Implement conflict objects with local/remote snapshots and diff-ready text fields.
- [ ] Re-run and confirm GREEN.
- [ ] Commit `feat: add sync conflict handling`.

## Task 4: Backup Export and Import

**Interfaces:**
- `exportPromptOSBackup(state)` -> versioned JSON object.
- `validatePromptOSBackup(data)`.
- `importPromptOSBackup(currentState, backup)` returns validated replacement candidate without mutating current state.

- [ ] Write failing tests for schema version, 80 built-ins preservation rule, invalid backup rejection, and no secret inclusion.
- [ ] Confirm RED.
- [ ] Implement backup helpers.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add prompt os backup recovery`.

## Task 5: Analytics Aggregation

**Interfaces:**
- `aggregateUsage(events, range)` returns runs, tokens, estimatedCost, avgLatency, successRate, byFeature, byPrompt, byModel, trend, expensiveRuns.

- [ ] Write failing fixed-clock tests for daily/weekly/monthly aggregation and estimated-cost labels.
- [ ] Run `node --test tests/analytics-v2.test.mjs tests/analytics-aggregate.test.mjs` and confirm RED.
- [ ] Implement pure aggregation using telemetry events only; no prompt/output content required.
- [ ] Re-run and confirm GREEN.
- [ ] Commit `feat: add usage cost analytics v2`.

## Task 6: Analytics Dashboard UI

**Files:**
- Create: `components/analytics/UsageDashboard.jsx`
- Modify: `components/PromptOS.jsx`

- [ ] Add UI contract tests for monthly summary, model/feature/prompt breakdown, trend ranges, expensive runs, warning threshold, and hard-limit state.
- [ ] Confirm RED.
- [ ] Implement dashboard behind `V5_USAGE_ANALYTICS`.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add usage analytics dashboard`.

## Task 7: Workflow Model and Versioning

**Interfaces:**
- `createWorkflow`, `createWorkflowVersion`, `addWorkflowStep`, `updateWorkflowStep`.
- Each step has promptId, promptVersion, model, variables, input mapping, outputAlias, retryPolicy, continueOnFailure=false by default.

- [ ] Write failing tests for immutable workflow versions and ordered steps.
- [ ] Run `node --test tests/workflow-v1.test.mjs` and confirm RED.
- [ ] Implement pure workflow model.
- [ ] Re-run and confirm GREEN.
- [ ] Commit `feat: add sequential workflow model`.

## Task 8: Workflow Input Mapping

**Interfaces:**
- `resolveWorkflowInput(mapping, context)` supports workflow input, previous step output, specific earlier step output, static text, workflow variable.

- [ ] Add failing mapping tests including missing alias errors.
- [ ] Confirm RED.
- [ ] Implement deterministic input mapping without evaluating arbitrary code.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add workflow input mapping`.

## Task 9: Sequential Workflow Runner

**Interfaces:**
- `runWorkflow(workflowVersion, context)` executes ordered steps through the shared execution engine.
- `retryWorkflowStep(run, stepId, overrides)` reruns only the failed/current step and then may continue later steps.
- `cancelWorkflowRun(runId)` aborts current step and prevents later steps.

- [ ] Add failing tests for strict ordering, completed-step preservation, stop, failed-step blocking, retry-single-step, per-step telemetry, and total cost estimate call count.
- [ ] Confirm RED.
- [ ] Implement runner using Execution Engine + Cost Guard; default `continueOnFailure=false`.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add sequential workflow runner`.

## Task 10: Workflow Builder and Runner UI

**Files:**
- Create: `components/workflow/WorkflowBuilder.jsx`, `WorkflowRunner.jsx`, `WorkflowRunDetail.jsx`
- Modify: `components/PromptOS.jsx`

- [ ] Add UI contract tests for ordered mobile-friendly step list, add/reorder/remove step, input source selector, estimate confirmation, live step statuses, stop, retry, edit input, history.
- [ ] Confirm RED.
- [ ] Implement UI behind `V5_WORKFLOW`; avoid desktop-only canvas dependency.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add workflow builder and runner ui`.

## Task 11: Supabase Migration Files

**Files:**
- Create migration files under `supabase/migrations/` using the next available timestamp/name ordering in the repository.

**Schema must cover:** workspaces, folders, prompts/version extensions if needed, prompt_variable_presets, prompt_packs, prompt_pack_items, workflows, workflow_steps, evaluation_suites, evaluation_cases, execution_runs, usage_events, sync_operations.

- [ ] Inspect existing migrations and write schema-contract tests before SQL.
- [ ] Add migrations with explicit foreign keys, nullable FK handling, ownership columns, RLS policies, and browser grants.
- [ ] Ensure usage event browser update/delete are restricted; insertion is scoped to the authenticated owner.
- [ ] Ensure any `ON DELETE SET NULL` targets only nullable FK columns.
- [ ] Run migration/schema tests locally or through repository static contract tests; do not apply production.
- [ ] Commit `feat: prepare v5 supabase migrations`.

## Task 12: Cloud Sync Panel States

**Files:**
- Modify: `components/CloudSyncPanel.jsx`

- [ ] Add tests for `Synced`, `Syncing`, `Offline — N changes waiting`, `Conflict`, and `Backend not configured`.
- [ ] Confirm RED.
- [ ] Wire states to sync engine; never show Synced when backend/schema readiness is false.
- [ ] Confirm GREEN.
- [ ] Commit `feat: wire v5 cloud sync status`.

## Task 13: Full Phase Verification

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Verify no production Supabase call/migration was executed.
- [ ] Verify analytics failure path does not break prompt execution.
- [ ] Verify workflow is sequential only.
- [ ] Verify backups and sync payloads exclude secrets and local files.
- [ ] Open Phase 4 PR and stop before merge until explicit authorization.

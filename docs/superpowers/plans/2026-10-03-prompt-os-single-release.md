# Prompt.OS Single-Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Daily Use Complete, Prompt Studio, and Control Center in one production-ready pull request while keeping the same TDD, migration, accessibility, CI, review, and rollback quality.

**Architecture:** Extend the existing Prompt Detail -> Run Workspace -> `/api/ai/run` path and current IndexedDB repository boundaries. Work is split into three internal milestones but remains on one implementation branch and one final Draft PR. Release-level flags isolate incomplete milestone surfaces until the complete branch is verified.

**Tech Stack:** Next.js 16, React, JavaScript/ES modules, IndexedDB, Motion, Node test runner, OpenNext for Cloudflare, Wrangler.

**Spec:** `docs/superpowers/specs/2026-10-03-prompt-os-single-release-design.md`

## Global Constraints

- Preserve exactly 100 built-in prompt IDs.
- Never mutate a built-in through Builder, Customize, restore, import, or sync.
- Reuse `/api/ai/run`; no second execution engine.
- React never opens IndexedDB/Supabase directly.
- Local-first remains usable while cloud is offline or absent.
- Terminal Run content and Saved Result snapshot content remain immutable.
- No fabricated metrics, tokens, latency, storage quota, quality score, or cloud/sync success.
- New flags: `V5_DAILY_USE_COMPLETE`, `V5_PROMPT_STUDIO`, `V5_CONTROL_CENTER_V2`; all default false.
- Existing granular flags remain supported.
- IndexedDB upgrades are additive and never clear data automatically.
- No production Supabase DDL in this release without separate explicit approval.
- Every functional task follows observed RED -> GREEN.
- Final Draft PR is the only PR/merge gate.
- Final merge and production deploy require separate explicit user commands.

## Review Focus

1. Existing Run/Result data must survive all DB upgrades.
2. Large History/Result datasets must paginate and avoid full rescans per keystroke/render.
3. Storage/checkpoint/sync failures must preserve visible work and never claim success falsely.
4. Built-ins must remain immutable through every new Studio/Restore path.
5. Backup restore must validate first and preserve both sides on mutable conflicts.

## File Responsibility Map

### Existing files to extend

- `lib/ui/feature-flags.mjs`
- `lib/prompts/catalog/quality-v2/*`
- `lib/prompts/quality-validator.mjs`
- `lib/run/indexeddb.mjs`
- `lib/run/run-repository.mjs`
- `lib/run/result-repository.mjs`
- `lib/run/sync-repository.mjs`
- `components/prompt/PromptDetailV2.jsx`
- `components/prompt/PromptCardV5.jsx`
- `components/prompt/PromptLibraryV5.jsx`
- `components/prompt/PromptQuickActionsSheet.jsx`
- `components/prompt/RunWorkspace.jsx`
- `components/prompt/RunStatus.jsx`
- `components/shell/AppShell.jsx`
- `components/shell/Sidebar.jsx`
- `components/shell/MobileDock.jsx`
- `components/command/CommandPaletteV5.jsx`
- `components/home/MissionControl.jsx`
- `app/page.jsx`

### New focused modules

- `lib/run/history-query.mjs`
- `lib/run/result-query.mjs`
- `lib/export/artifact-export.mjs`
- `components/history/RunHistory.jsx`
- `components/results/SavedResults.jsx`
- `lib/studio/draft-model.mjs`
- `lib/studio/draft-repository.mjs`
- `lib/studio/version-model.mjs`
- `lib/studio/version-repository.mjs`
- `lib/studio/customize.mjs`
- `lib/studio/diff.mjs`
- `lib/studio/test-lab.mjs`
- `lib/studio/related-prompts.mjs`
- `components/studio/PromptStudio.jsx`
- `components/studio/CompareWorkspace.jsx`
- `components/studio/PromptQualityCenter.jsx`
- `lib/control/analytics-selectors.mjs`
- `lib/control/activity.mjs`
- `lib/control/storage.mjs`
- `lib/control/backup.mjs`
- `components/control/ControlCenter.jsx`
- `components/control/StorageSyncCenter.jsx`

---

# Milestone A — Daily Use Complete

## Task 1: Release flags + structured example contract

**Files:** modify `lib/ui/feature-flags.mjs`, Quality V2 metadata/index, `lib/prompts/quality-validator.mjs`; tests `feature-flags`, `prompt-library-quality-v2`, `prompt-executability`.

**Interfaces:**
- `V5_DAILY_USE_COMPLETE` strict true/default false.
- optional prompt `exampleValues: Record<string, unknown>`.
- deterministic `invalid_example_values` validator finding.

- [ ] Write RED tests for the flag, exact 100 IDs, non-mutating examples, valid required variables, and zero unresolved required placeholders.
- [ ] Run targeted tests; verify RED.
- [ ] Implement flag and explicit `exampleValues`; do not parse prose.
- [ ] Extend validator through existing variable/render helpers.
- [ ] Run targeted tests; verify GREEN.
- [ ] Commit `feat: add structured prompt examples`.

## Task 2: History/Result queries + additive DB indexes

**Files:** modify `lib/run/indexeddb.mjs`, run/result repositories; create `history-query.mjs`, `result-query.mjs`; tests repository/migration/query.

**Interfaces:**
- `normalizeHistoryQuery(input)`.
- `RunRepository.listPage(query) -> { items, nextCursor }` newest-first.
- `RunRepository.delete(id)` without Result cascade.
- `ResultRepository.listPage(query)`.
- `ResultRepository.updateMetadata(id, patch)` only `name|pinned|tags|notes`.
- `ResultRepository.duplicate(id, patch?)`.
- `ResultRepository.delete(id)` without Run cascade.

- [ ] Write RED migration test from current DB with real legacy fixtures; assert all existing records survive.
- [ ] Write RED pagination/filter/search/large-fixture tests.
- [ ] Write RED Result metadata whitelist and deletion-independence tests.
- [ ] Run targeted tests; verify RED.
- [ ] Implement additive indexes and repository APIs.
- [ ] Run targeted tests; verify GREEN.
- [ ] Commit `feat: add history and result query repositories`.

## Task 3: Export + History + Saved Results surfaces

**Files:** create `lib/export/artifact-export.mjs`, `components/history/RunHistory.jsx`, `components/results/SavedResults.jsx`; modify AppShell/Sidebar/MobileDock/CommandPalette/page; tests export/navigation/UI.

**Interfaces:**
- `serializeArtifact({ kind, record, format }) -> string`, format `markdown|txt|json`.
- child UI receives repositories from runtime owner; no direct IndexedDB.

- [ ] Write RED serialization tests including absent-not-zero fake metadata behavior.
- [ ] Write RED navigation tests: distinct History/Results destinations, flag-off fallback, no Compare/Customize working actions yet.
- [ ] Run targeted tests; verify RED.
- [ ] Implement serializers and paginated/searchable workspaces.
- [ ] Add bulk export/delete with explicit destructive confirmation.
- [ ] Wire navigation and command palette behind `V5_DAILY_USE_COMPLETE`.
- [ ] Run targeted tests; verify GREEN.
- [ ] Commit `feat: add history and saved results workspaces`.

## Task 4: Run Workspace ergonomics + truthful recovery UX

**Files:** modify Prompt Detail/Card/QuickActions/Library, RunWorkspace, RunStatus; add/modify Daily Use UI tests.

- [ ] Write RED tests for Try Example/Clear Example and deep built-in immutability.
- [ ] Write RED tests for output auto-follow stop/resume, `Ctrl/Cmd+S`, safe Esc, Retry Save, Copy/Export after persistence failure, session preservation.
- [ ] Run targeted tests; verify RED.
- [ ] Implement example quick actions and capability gating.
- [ ] Implement follow-output and keyboard behavior without stealing text-field shortcuts.
- [ ] Implement truthful `Not persisted`/recovery UI.
- [ ] Run targeted tests including mobile/reduced-motion checks; verify GREEN.
- [ ] Commit `feat: complete daily run workflow`.

## Task 5: Milestone A regression checkpoint

- [ ] Run all Daily Use and existing Run/Prompt regression tests.
- [ ] Re-run current DB migration fixture and exact-100 built-in regression.
- [ ] Fix any failure with RED -> GREEN.
- [ ] Commit only necessary fixes as `fix: harden daily use milestone` if needed.
- [ ] Do **not** open a PR; continue on the same implementation branch.

---

# Milestone B — Prompt Studio

## Task 6: Draft/Version models, stores, repositories

**Files:** modify `lib/run/indexeddb.mjs`; create draft/version model/repository modules; tests migration, repository, immutability.

**Interfaces:**
- `createDraft(input)` canonical mutable Draft.
- `DraftRepository.get/upsert/list/delete`.
- `createVersionSnapshot({ draft, versionNumber, ...meta })` deep immutable snapshot.
- `VersionRepository.nextVersionNumber(promptId)` monotonic.
- `VersionRepository.create/list/get/archive`.
- restore returns Draft data only; never mutates Version.

- [ ] Write RED DB-upgrade test preserving existing Run/Result records while adding Draft/Version stores.
- [ ] Write RED Draft autosave/revision tests.
- [ ] Write RED Version deep-immutability, monotonic-number, archive/reference tests.
- [ ] Run targeted tests; verify RED.
- [ ] Implement models/stores/repositories with additive migration.
- [ ] Run targeted tests; verify GREEN.
- [ ] Commit `feat: add prompt draft and version repositories`.

## Task 7: Canonical Builder + autosave/recovery

**Files:** create `components/studio/PromptStudio.jsx`; extend page/shell/command palette; tests Builder contract.

**Interfaces:** Structured and Raw modes read/write one canonical Draft; autosave delegates to DraftRepository with debounce.

- [ ] Write RED tests for Structured<->Raw synchronization, reload recovery, autosave-without-version creation, mobile mode switching.
- [ ] Run targeted tests; verify RED.
- [ ] Implement Builder shell, Preview and Versions navigation.
- [ ] Implement debounced repository autosave and explicit Recovered Draft state.
- [ ] Run tests; verify GREEN.
- [ ] Commit `feat: add canonical prompt studio builder`.

## Task 8: Customize built-in + version actions

**Files:** create `lib/studio/customize.mjs`; modify Prompt Detail/Studio; tests customization/version actions.

**Interfaces:**
- `createDerivedDraft(builtIn) -> user Draft` with new ID and `derivedFromPromptId`.
- Save Version is explicit only.
- Restore Version writes current Draft only.

- [ ] Write RED tests proving built-in source object and catalog remain unchanged after Customize/edit/restore.
- [ ] Write RED tests for Save Version, Stable/Experimental/Archived status, restore -> Draft -> next monotonic version.
- [ ] Run targeted tests; verify RED.
- [ ] Implement Customize and version actions.
- [ ] Run tests; verify GREEN.
- [ ] Commit `feat: add prompt customization and versioning`.

## Task 9: Deterministic Compare/Diff

**Files:** create `lib/studio/diff.mjs`, `components/studio/CompareWorkspace.jsx`; connect History/Results/Studio; tests compare.

**Interfaces:** `compareArtifacts(a, b, options) -> normalized diff model` for Run/Result/Version/Draft combinations.

- [ ] Write RED tests for Run-vs-Run, Result-vs-Result, Run-vs-Result, Version-vs-Version, Draft-vs-Version; identical input yields no diff.
- [ ] Write RED mobile `A|B|Diff` and desktop side-by-side contract tests.
- [ ] Run targeted tests; verify RED.
- [ ] Implement deterministic comparison with no AI/network use.
- [ ] Enable Compare actions only under Studio capability.
- [ ] Run tests; verify GREEN.
- [ ] Commit `feat: add prompt and result comparison`.

## Task 10: Test Lab + Quality Center + relationships/packs

**Files:** create `lib/studio/test-lab.mjs`, `lib/studio/related-prompts.mjs`, `PromptQualityCenter.jsx`; extend existing quality validator/packs UI; tests.

- [ ] Write RED deterministic Test Lab tests for required/optional inputs, examples, Thai/English, long input, output-format checks.
- [ ] Write RED Quality Center test ensuring concrete findings only and no synthetic percentage score.
- [ ] Write RED related-prompt tests based on category/tags/source only; no embeddings.
- [ ] Run targeted tests; verify RED.
- [ ] Implement Test Lab, Quality Center, and relationship/packs integration.
- [ ] Run tests; verify GREEN.
- [ ] Commit `feat: add prompt test lab and quality center`.

## Task 11: Milestone B regression checkpoint

- [ ] Run all Prompt Studio + Daily Use + migration tests.
- [ ] Assert exact 100 built-ins remain immutable and executable.
- [ ] Assert archived versions still resolve historical Run version references.
- [ ] Fix failures with RED -> GREEN.
- [ ] Commit hardening fixes if needed.
- [ ] Do **not** open a PR; continue on same branch.

---

# Milestone C — Control Center

## Task 12: Control Center flag + repository-derived analytics selectors

**Files:** modify feature flags; create `lib/control/analytics-selectors.mjs`; tests analytics.

**Interfaces:** selectors include `countRunsByDate`, `statusBreakdown`, `mostUsedPrompts`, `averageLatency`, `tokenUsage`, `savedResultRate`, `failureBreakdown`.

- [ ] Write RED flag tests for `V5_CONTROL_CENTER_V2` default false/strict true.
- [ ] Write RED analytics tests with missing latency/tokens omitted from aggregates.
- [ ] Write RED large-dataset test proving deterministic pagination/aggregation path rather than UI full rescans.
- [ ] Run targeted tests; verify RED.
- [ ] Implement selectors over persisted domain records; no duplicate analytics event store.
- [ ] Run tests; verify GREEN.
- [ ] Commit `feat: add repository derived control analytics`.

## Task 13: Activity + Failure Center

**Files:** create `lib/control/activity.mjs`, `components/control/ControlCenter.jsx`; modify MissionControl/page/navigation; tests.

- [ ] Write RED tests mapping real Run/Result/Version/Sync/Storage records into recent activity and failure groups.
- [ ] Assert no fake KPI cards or guessed values.
- [ ] Run targeted tests; verify RED.
- [ ] Implement Mission Control V2 and Failure Center using selector outputs only.
- [ ] Run tests; verify GREEN.
- [ ] Commit `feat: add real mission control and failure center`.

## Task 14: Storage Center + truthful sync health

**Files:** create `lib/control/storage.mjs`, `components/control/StorageSyncCenter.jsx`; extend sync repository; tests.

**Interfaces:** storage adapter returns measured `{ usage?, quota?, available }`; sync summary returns actual queue/state counts.

- [ ] Write RED tests for browser quota available/unavailable paths; unavailable renders `Unavailable`.
- [ ] Write RED tests for local/pending/syncing/synced/conflict/sync_error summary.
- [ ] Assert `Sync Now` disabled if no real cloud adapter exists.
- [ ] Write RED explicit-cleanup tests; no automatic pruning.
- [ ] Run targeted tests; verify RED.
- [ ] Implement storage/sync center and explicit cleanup actions.
- [ ] Run tests; verify GREEN.
- [ ] Commit `feat: add storage and sync health center`.

## Task 15: Backup / Restore

**Files:** create `lib/control/backup.mjs`; integrate StorageSyncCenter; tests backup/restore.

**Interfaces:**
- `createBackup(snapshot) -> versioned JSON object`.
- `validateBackup(input) -> { ok, errors, summary }`.
- `planRestore(backup, localState) -> collision-aware plan`.
- apply restore only after explicit confirmation; repository transaction boundaries where supported.

- [ ] Write RED round-trip tests for custom prompts/drafts/versions/runs/results/packs/favorites/export-safe settings.
- [ ] Write RED test that built-in definitions are not duplicated in backup.
- [ ] Write RED malformed-backup test asserting zero partial mutation.
- [ ] Write RED mutable-collision test requiring preserve-both unless destructive replacement explicitly confirmed.
- [ ] Run targeted tests; verify RED.
- [ ] Implement backup validation/planning/restore mapping.
- [ ] Run tests; verify GREEN.
- [ ] Commit `feat: add validated backup and restore`.

## Task 16: Single-release final verification + one Draft PR

**No scope expansion after this task begins.**

- [ ] Run `npm test`; expected zero failures.
- [ ] Run `npm run build`; expected OpenNext production build succeeds.
- [ ] Verify `.open-next/worker.js`, `.open-next/assets`, `.open-next/.build/open-next.config.edge.mjs`.
- [ ] Run `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`; expected successful dry-run only.
- [ ] Run migration/idempotency suite from current production-shaped DB fixtures.
- [ ] Run exact-100 built-in ID/executability/immutability regression.
- [ ] Run mobile/accessibility/reduced-motion contract tests.
- [ ] Whole-branch review against all five Review Focus risks.
- [ ] Any Important finding gets a new RED test, GREEN fix, targeted rerun, then full verification rerun.
- [ ] Open/update **one Draft PR** against `main` titled `Prompt.OS Complete Workspace: Daily Use + Studio + Control Center`.
- [ ] PR body lists all three milestones, migration guarantees, final test/build/dry-run evidence, and states `Do not merge without explicit user approval. No manual production deployment.`
- [ ] Stop before merge.

## Execution Rule

Use one implementation branch from current `main`. Do not open milestone PRs. Milestone checkpoints are internal test/commit gates only. The user sees one merge decision after the entire release is verified.

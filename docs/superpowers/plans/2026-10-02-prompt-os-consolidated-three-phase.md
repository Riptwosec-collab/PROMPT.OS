# Prompt.OS Consolidated Three-Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Prompt.OS in three large production-ready releases—Daily Use Complete, Prompt Studio, and Control Center—while reusing the existing local-first Run/Result architecture, preserving all 100 built-in prompts, and reducing approval/merge cycles without reducing TDD, migration, accessibility, CI, or rollback quality.

**Architecture:** Extend the existing Prompt Detail → Run Workspace → `/api/ai/run` execution path and the existing IndexedDB repository layer. New product state lives behind repository/domain interfaces, release-level flags gate the three large surfaces, immutable entities stay immutable, mutable Draft/metadata state uses revision-aware repositories, and analytics are derived from real persisted records rather than duplicate telemetry stores.

**Tech Stack:** Next.js 16, React, JavaScript/ES modules, IndexedDB, Motion, Node test runner (`node --test`), OpenNext for Cloudflare, Wrangler dry-run, existing prompt/run/sync/analytics modules.

**Spec:** `docs/superpowers/specs/2026-10-02-prompt-os-consolidated-three-phase-design.md`

## Global Constraints

- Preserve all 100 built-in prompt IDs and current executable behavior.
- Built-in prompts are immutable templates; customization creates user-owned derived prompts.
- Reuse `PromptDetailV2 -> RunWorkspace -> /api/ai/run`; do not create a second execution engine.
- React components do not call IndexedDB or Supabase directly.
- Local-first remains authoritative for normal work; cloud failure never blocks local Run/Builder workflows.
- Run terminal execution snapshots remain immutable.
- Saved Result snapshot content remains immutable; only organization metadata may change.
- New release flags are exactly `V5_DAILY_USE_COMPLETE`, `V5_PROMPT_STUDIO`, and `V5_CONTROL_CENTER_V2`; all default `false`.
- Existing granular flags remain supported.
- No fabricated analytics, token counts, latency, cloud state, storage capacity, or quality scores.
- New IndexedDB stores/indexes use forward-compatible schema upgrades; never clear local data to recover from migration failure.
- Motion is presentation-only; reduced-motion preserves correctness.
- Mobile actions use touch-safe targets and safe-area-aware sticky controls.
- Every functional task follows observed RED -> GREEN before the task commit.
- Before each product PR is called complete: full `npm test`, `npm run build`, OpenNext artifact checks, and `npx wrangler deploy --dry-run --outdir .wrangler-dry-run` must pass.
- Stop before each merge. Merge requires explicit user command. Production deployment requires a separate explicit user command.
- No production Supabase schema/DDL migration is included in these three UI/domain PRs unless separately approved as its own migration gate.

## Review Focus

1. **Migration from current runtime DB:** opening a database containing current Run/Result data must add new stores/indexes without losing or rewriting existing records.
2. **Large local datasets:** History/Results/analytics must paginate and search without rescanning every record on every keystroke or render.
3. **Interrupted/offline/storage failure:** partial work stays visible and local workflows remain usable; UI never claims persistence/sync that did not happen.
4. **Built-in immutability:** no Builder, restore, import, or customization path may mutate or replace any of the 100 built-in definitions.
5. **Backup collision handling:** restore validates first, preserves both on mutable conflicts, and requires explicit confirmation before destructive replacement.

## File / Responsibility Map

### Existing files to extend

- `lib/ui/feature-flags.mjs` — release-level default-off feature gates.
- `lib/prompts/catalog/quality-v2/*` — built-in structured example values and current Quality V2 metadata.
- `lib/prompts/quality-validator.mjs` — deterministic example/quality validation.
- `lib/run/indexeddb.mjs` — schema upgrades and indexes; no UI logic.
- `lib/run/run-repository.mjs` — History queries/pagination/delete APIs over current Run records.
- `lib/run/result-repository.mjs` — Saved Result metadata/query/duplicate/delete APIs.
- `lib/run/sync-repository.mjs` — queue/state summaries and retry surfaces.
- `components/prompt/RunWorkspace.jsx` — run ergonomics only; persistence stays delegated.
- `components/prompt/PromptDetailV2.jsx`, `components/prompt/PromptCardV5.jsx`, `components/prompt/PromptLibraryV5.jsx` — example/quick actions and routing.
- `components/shell/AppShell.jsx` — shell state and content routing.
- `components/shell/Sidebar.jsx` — desktop primary navigation.
- `components/shell/MobileDock.jsx` — mobile primary navigation.
- `components/home/MissionControl.jsx` — current Mission Control surface.
- `components/command/CommandPaletteV5.jsx` — destination/action routing under feature gates.
- `app/page.jsx` — top-level feature-gate and surface ownership.

### New focused modules planned

- `lib/run/history-query.mjs` — deterministic query/filter normalization for Runs.
- `lib/run/result-query.mjs` — deterministic query/filter normalization for Saved Results.
- `lib/export/artifact-export.mjs` — Markdown/TXT/JSON serialization for Runs/Results.
- `components/history/RunHistory.jsx` — History workspace.
- `components/results/SavedResults.jsx` — Saved Results workspace.
- `lib/studio/draft-model.mjs` — canonical Draft shape and structured/raw conversion rules.
- `lib/studio/draft-repository.mjs` — mutable Draft persistence.
- `lib/studio/version-model.mjs` — immutable Version model and monotonic numbering rules.
- `lib/studio/version-repository.mjs` — Version persistence/archive/restore lookup.
- `lib/studio/customize.mjs` — built-in → derived user Prompt/Draft creation.
- `lib/studio/diff.mjs` — deterministic text/schema/metadata/output compare model.
- `lib/studio/test-lab.mjs` — deterministic prompt test suite.
- `lib/studio/related-prompts.mjs` — deterministic relationships using category/tags/source.
- `components/studio/PromptStudio.jsx` — Builder shell.
- `components/studio/StructuredPromptEditor.jsx` — structured Draft editing surface.
- `components/studio/VersionPanel.jsx` — immutable Version actions/history.
- `components/studio/CompareWorkspace.jsx` — compare UI.
- `components/studio/PromptQualityCenter.jsx` — concrete validator findings UI.
- `lib/control/analytics-selectors.mjs` — Run/Result/Draft/Version aggregations from repositories.
- `lib/control/activity.mjs` — normalized recent activity/failure records.
- `lib/control/storage.mjs` — measurable storage counts/quota adapter.
- `lib/control/backup.mjs` — backup schema, validation, plan, serialization, restore mapping.
- `components/control/ControlCenter.jsx` — dashboard and failure views.
- `components/control/StorageSyncCenter.jsx` — storage/sync/backup UI.
- `components/control/BackupRestorePanel.jsx` — backup validation/restore confirmation UI.

---

# PR A — Daily Use Complete

## Task 1: Release Gate + Structured Example Contract

**Files:**
- Modify: `lib/ui/feature-flags.mjs`
- Modify: `lib/prompts/catalog/quality-v2/metadata-core.mjs`
- Modify: `lib/prompts/catalog/quality-v2/metadata-researched-a.mjs`
- Modify: `lib/prompts/catalog/quality-v2/metadata-researched-b.mjs`
- Modify: `lib/prompts/catalog/quality-v2/new-prompts.mjs`
- Modify: `lib/prompts/catalog/quality-v2/index.mjs`
- Modify: `lib/prompts/quality-validator.mjs`
- Test: `tests/feature-flags.test.mjs`
- Test: `tests/prompt-library-quality-v2.test.mjs`
- Test: `tests/prompt-executability.test.mjs`

**Interfaces:**
- Produces: `V5_DAILY_USE_COMPLETE` as strict-true/default-false release gate.
- Produces: built-in field `exampleValues: Record<string, unknown>` when a deterministic runnable example exists.
- Produces: validator error code `invalid_example_values` when declared examples fail variable validation or leave required placeholders unresolved.

- [ ] **Step 1: Write RED tests for the release flag and structured example contract.** Assert the new flag defaults false, only explicit `true` enables it, all 100 IDs remain unchanged, and every prompt with `exampleValues` validates/renders without unresolved required placeholders.
- [ ] **Step 2: Run targeted tests and verify RED.** `node --test tests/feature-flags.test.mjs tests/prompt-library-quality-v2.test.mjs tests/prompt-executability.test.mjs`; expected failures reference missing flag/example contract.
- [ ] **Step 3: Implement the minimal flag and explicit `exampleValues` metadata.** Do not parse `exampleInputTh`; prompts without safe structured examples omit the field.
- [ ] **Step 4: Extend deterministic validation for example values.** Use existing variable-schema/render helpers and never mutate prompt records.
- [ ] **Step 5: Run targeted tests and verify GREEN.** Same command; catalog stays exactly 100 unique built-ins.
- [ ] **Step 6: Commit.** `git commit -m "feat: add structured prompt examples"`

## Task 2: History / Result Repository Query APIs and Runtime DB Upgrade

**Files:**
- Modify: `lib/run/indexeddb.mjs`
- Modify: `lib/run/run-repository.mjs`
- Modify: `lib/run/result-repository.mjs`
- Create: `lib/run/history-query.mjs`
- Create: `lib/run/result-query.mjs`
- Test: `tests/run-indexeddb.test.mjs`
- Test: `tests/run-repository.test.mjs`
- Test: `tests/result-repository.test.mjs`
- Create: `tests/history-query.test.mjs`

**Interfaces:**
- `normalizeHistoryQuery(input) -> { search, statuses, promptId, provider, model, from, to, saved, limit, cursor }`.
- `RunRepository.listPage(query) -> Promise<{ items, nextCursor }>` newest-first.
- `RunRepository.delete(id) -> Promise<boolean>`; no cascade into Saved Results.
- `ResultRepository.listPage(query) -> Promise<{ items, nextCursor }>`.
- `ResultRepository.updateMetadata(resultId, patch) -> Promise<Result>` accepts only `name`, `pinned`, `tags`, `notes`.
- `ResultRepository.duplicate(resultId, metadataPatch?) -> Promise<Result>` creates a detached immutable snapshot artifact.
- `ResultRepository.delete(resultId) -> Promise<boolean>` leaves source Run untouched.

- [ ] **Step 1: Write RED migration tests.** Seed current DB with Runs/Results, reopen under the new version, assert records survive and indexes/stores are added without reset.
- [ ] **Step 2: Write RED repository/query tests.** Cover newest-first cursor pagination, status/date/model/search filters, large fixture pagination, metadata whitelist, delete independence, and duplicate snapshot detachment.
- [ ] **Step 3: Run targeted tests and verify RED.** `node --test tests/run-indexeddb.test.mjs tests/run-repository.test.mjs tests/result-repository.test.mjs tests/history-query.test.mjs`.
- [ ] **Step 4: Implement schema indexes and repository APIs.** Keep search normalization outside React and use cursor/index paths rather than full per-keystroke scans.
- [ ] **Step 5: Run targeted tests and verify GREEN.** Legacy records remain intact.
- [ ] **Step 6: Commit.** `git commit -m "feat: add history and result query repositories"`

## Task 3: History, Saved Results, Export, and Navigation Surfaces

**Files:**
- Create: `lib/export/artifact-export.mjs`
- Create: `components/history/RunHistory.jsx`
- Create: `components/results/SavedResults.jsx`
- Modify: `components/shell/AppShell.jsx`
- Modify: `components/shell/Sidebar.jsx`
- Modify: `components/shell/MobileDock.jsx`
- Modify: `components/command/CommandPaletteV5.jsx`
- Modify: `app/page.jsx`
- Create: `tests/artifact-export.test.mjs`
- Create: `tests/history-results-ui.test.mjs`
- Modify: `tests/command-palette.test.mjs`
- Modify: `tests/shell-v5.test.mjs`

**Interfaces:**
- `serializeArtifact({ kind, record, format }) -> string` where format is `markdown | txt | json`.
- History/Saved Results receive repositories from the runtime owner; they never open IndexedDB directly.
- `V5_DAILY_USE_COMPLETE` controls destination visibility.

- [ ] **Step 1: Write RED export tests.** Markdown includes prompt snapshot, variables, output, real metadata, timestamps; JSON contains stable schema identifiers; missing tokens/latency stay absent rather than zero-filled.
- [ ] **Step 2: Write RED UI/navigation tests.** History and Saved Results are distinct destinations, pagination/filter/search are exposed, Compare is absent in PR A, and release flag off preserves current navigation.
- [ ] **Step 3: Run targeted tests and verify RED.** `node --test tests/artifact-export.test.mjs tests/history-results-ui.test.mjs tests/command-palette.test.mjs tests/shell-v5.test.mjs`.
- [ ] **Step 4: Implement serializers/workspaces.** Add bulk selection/export/delete with explicit destructive confirmation; no swipe deletion.
- [ ] **Step 5: Wire `app/page.jsx` → `AppShell.jsx` → `Sidebar.jsx`/`MobileDock.jsx` and command palette behind the release gate.** Reuse one navigation request model; do not duplicate repository ownership in child cards.
- [ ] **Step 6: Run targeted tests and verify GREEN.** Flag-off fallback remains unchanged.
- [ ] **Step 7: Commit.** `git commit -m "feat: add history and saved results workspaces"`

## Task 4: Example Actions + Run Workspace Ergonomics + Recovery UX

**Files:**
- Modify: `components/prompt/PromptDetailV2.jsx`
- Modify: `components/prompt/PromptCardV5.jsx`
- Modify: `components/prompt/PromptQuickActionsSheet.jsx`
- Modify: `components/prompt/PromptLibraryV5.jsx`
- Modify: `components/prompt/RunWorkspace.jsx`
- Modify: `components/prompt/RunStatus.jsx`
- Create: `tests/daily-use-run-workspace.test.mjs`
- Modify: `tests/prompt-premium-experience.test.mjs`

**Interfaces:**
- `Try Example` sets session values from `prompt.exampleValues` only.
- `Clear Example` resets to canonical defaults/blank values using existing variable configuration rules.
- Run Workspace owns local `followingOutput`; auto-follow resumes only by explicit `Follow output` or a new run.
- `Ctrl/Cmd+S` saves only a terminal Run; `Esc` cannot silently abandon an active Run.

- [ ] **Step 1: Write RED tests for example actions.** Built-in object remains deeply unchanged after fill/clear; action hidden when no `exampleValues`.
- [ ] **Step 2: Write RED Run Workspace tests.** Cover auto-scroll stop/resume, `Ctrl/Cmd+S`, safe Esc behavior, Copy/Export/Retry Save after persistence failure, and session value preservation on close/return.
- [ ] **Step 3: Run targeted tests and verify RED.** `node --test tests/daily-use-run-workspace.test.mjs tests/prompt-premium-experience.test.mjs`.
- [ ] **Step 4: Implement example/quick actions with capability gating.** Do not expose Customize/Compare as working actions in PR A.
- [ ] **Step 5: Implement Run ergonomics and truthful persistence/error states.** Streaming may continue in memory after checkpoint failure; UI says `Not persisted` until repository write succeeds.
- [ ] **Step 6: Run targeted tests and verify GREEN.** Include reduced-motion/mobile assertions.
- [ ] **Step 7: Commit.** `git commit -m "feat: complete daily run workflow"`

## Task 5: PR A Full Regression / Draft PR Gate

- [ ] **Step 1: Run full tests.** `npm test`; zero failures and exact 100 built-in regression required.
- [ ] **Step 2: Run production build.** `npm run build`; OpenNext worker generation succeeds.
- [ ] **Step 3: Verify artifacts.** `test -f .open-next/worker.js && test -d .open-next/assets && test -f .open-next/.build/open-next.config.edge.mjs`.
- [ ] **Step 4: Run Wrangler dry-run.** `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`; no deployment.
- [ ] **Step 5: Whole-PR review.** Re-check Review Focus items 1–3 and feature-flag fallback; fix Important findings RED→GREEN.
- [ ] **Step 6: Open/update Draft PR A against `main`.** Title `Daily Use Complete: History, Results, Examples, Export`; stop before merge.

---

# PR B — Prompt Studio

> Start PR B only from the merged PR A `main` head. The master plan stays authoritative; no new design/spec cycle unless hidden complexity changes architecture.

## Task 6: Draft / Version Stores, Models, and Repositories

**Files:**
- Modify: `lib/run/indexeddb.mjs`
- Create: `lib/studio/draft-model.mjs`
- Create: `lib/studio/draft-repository.mjs`
- Create: `lib/studio/version-model.mjs`
- Create: `lib/studio/version-repository.mjs`
- Test: `tests/run-indexeddb.test.mjs`
- Create: `tests/studio-draft-repository.test.mjs`
- Create: `tests/studio-version-repository.test.mjs`

**Interfaces:**
- `createDraft(input) -> Draft` with `draftId`, `promptId`, `structured`, `rawPrompt`, `variableConfig`, `derivedFromPromptId`, `updatedAt`, `syncState`, `revision`.
- `DraftRepository.save(draft)`, `get(draftId)`, `getByPrompt(promptId)`, `listPage(query)`, `delete(draftId)`.
- `VersionRepository.createFromDraft(draft, { label, changeNote, status, parentVersionId }) -> Version` with monotonic `versionNumber` per prompt.
- `VersionRepository.archive(versionId)` preserves historical snapshot.
- `VersionRepository.restoreToDraft(versionId, draftRepository) -> Draft` never mutates the Version.

- [ ] **Step 1: Write RED DB-upgrade tests from the PR A schema.** Existing Runs/Results remain readable after Draft/Version stores/indexes are added.
- [ ] **Step 2: Write RED Draft tests.** Mutable save/autosave semantics, detached returned copies, recovery marker, revision preservation.
- [ ] **Step 3: Write RED Version tests.** Immutability, monotonic numbering, archive without historical breakage, restore-to-draft, no number reuse.
- [ ] **Step 4: Run targeted tests and verify RED.** `node --test tests/run-indexeddb.test.mjs tests/studio-draft-repository.test.mjs tests/studio-version-repository.test.mjs`.
- [ ] **Step 5: Implement models/repositories/schema upgrade.** No React/IndexedDB coupling.
- [ ] **Step 6: Run targeted tests and verify GREEN.**
- [ ] **Step 7: Commit.** `git commit -m "feat: add prompt draft and version repositories"`

## Task 7: Prompt Studio Builder + Built-in Customization

**Files:**
- Modify: `lib/ui/feature-flags.mjs`
- Create: `lib/studio/customize.mjs`
- Create: `components/studio/PromptStudio.jsx`
- Create: `components/studio/StructuredPromptEditor.jsx`
- Modify: `components/prompt/PromptDetailV2.jsx`
- Modify: `components/prompt/PromptQuickActionsSheet.jsx`
- Modify: `components/shell/AppShell.jsx`
- Modify: `components/shell/Sidebar.jsx`
- Modify: `components/shell/MobileDock.jsx`
- Modify: `app/page.jsx`
- Create: `tests/prompt-studio-builder.test.mjs`
- Modify: `tests/feature-flags.test.mjs`
- Modify: `tests/shell-v5.test.mjs`

**Interfaces:**
- Produces `V5_PROMPT_STUDIO` default false/strict true.
- `createDerivedDraft(builtInPrompt) -> Draft` creates a new user-owned identity and sets `derivedFromPromptId` to the built-in ID.
- Structured sections are exactly Role, Goal, Context, Inputs, Constraints, Output Format, Examples, Variables, Notes.
- Structured/Raw operate on one Draft; mode switching never forks state.

- [ ] **Step 1: Write RED feature/customization tests.** Built-in stays deeply unchanged; derived Draft has new ID and source reference.
- [ ] **Step 2: Write RED Builder tests.** Structured/Raw/Preview/Versions share one Draft, autosave is debounced, reload exposes `Recovered Draft`, autosave never creates a Version.
- [ ] **Step 3: Run targeted tests and verify RED.** `node --test tests/feature-flags.test.mjs tests/prompt-studio-builder.test.mjs tests/shell-v5.test.mjs`.
- [ ] **Step 4: Implement release flag, customization helper, Builder shell, and Draft autosave wiring.**
- [ ] **Step 5: Enable Prompt Studio destination/Customize only when gate is on.** Flag off keeps PR A behavior.
- [ ] **Step 6: Run targeted tests and verify GREEN.**
- [ ] **Step 7: Commit.** `git commit -m "feat: add prompt studio builder"`

## Task 8: Version UX + Restore / Stable / Experimental / Archived

**Files:**
- Create: `components/studio/VersionPanel.jsx`
- Modify: `components/studio/PromptStudio.jsx`
- Create: `tests/prompt-versioning-ui.test.mjs`

**Interfaces:**
- `Save Version` is the only UI action that calls `VersionRepository.createFromDraft`.
- Status values are `Stable`, `Experimental`, `Archived`.
- Restore loads immutable snapshot into Draft only; later Save creates the next version number.

- [ ] **Step 1: Write RED integration tests.** Cover explicit save, no autosave-version coupling, restore old Version → Draft → next monotonic Version, archived Version resolves historical references.
- [ ] **Step 2: Run targeted tests and verify RED.** `node --test tests/prompt-versioning-ui.test.mjs tests/studio-version-repository.test.mjs`.
- [ ] **Step 3: Implement Version panel/repository integration.** Hard-delete remains unavailable without dependency checks.
- [ ] **Step 4: Run targeted tests and verify GREEN.**
- [ ] **Step 5: Commit.** `git commit -m "feat: add prompt versioning workflow"`

## Task 9: Diff / Compare Engine and Workspace

**Files:**
- Create: `lib/studio/diff.mjs`
- Create: `components/studio/CompareWorkspace.jsx`
- Modify: `components/history/RunHistory.jsx`
- Modify: `components/results/SavedResults.jsx`
- Modify: `components/studio/VersionPanel.jsx`
- Create: `tests/studio-diff.test.mjs`
- Create: `tests/compare-workspace.test.mjs`

**Interfaces:**
- `buildComparison(left, right, { mode }) -> { promptDiff, variableDiff, metadataDiff, outputDiff, providerDiff }`.
- Accepted artifacts: Run, Saved Result, Version, Draft normalized through adapters before diffing.
- Modes: `side-by-side`, `unified`, `output-only`; mobile presentation maps to `A | B | Diff` without changing comparison data.

- [ ] **Step 1: Write RED pure diff tests.** Identical normalized inputs produce empty changes; added/removed/changed variables and prompt lines are deterministic.
- [ ] **Step 2: Write RED UI tests for all pairings.** Run↔Run, Result↔Result, Run↔Result, Version↔Version, Draft↔Version; no mutation.
- [ ] **Step 3: Run targeted tests and verify RED.** `node --test tests/studio-diff.test.mjs tests/compare-workspace.test.mjs`.
- [ ] **Step 4: Implement normalization/diff engine and Compare workspace.** No AI judging call.
- [ ] **Step 5: Wire Compare actions now that capability exists.** PR A surfaces expose it only under `V5_PROMPT_STUDIO`.
- [ ] **Step 6: Run targeted tests and verify GREEN.**
- [ ] **Step 7: Commit.** `git commit -m "feat: add prompt and result compare workspace"`

## Task 10: Deterministic Test Lab, Quality Center, Related Prompts, Packs

**Files:**
- Create: `lib/studio/test-lab.mjs`
- Create: `lib/studio/related-prompts.mjs`
- Create: `components/studio/PromptQualityCenter.jsx`
- Modify: `components/studio/PromptStudio.jsx`
- Modify: `components/prompt/PromptDetailV2.jsx`
- Modify: `components/prompt/PromptPacks.jsx`
- Create: `tests/prompt-test-lab.test.mjs`
- Create: `tests/related-prompts.test.mjs`
- Create: `tests/prompt-quality-center.test.mjs`

**Interfaces:**
- `runDeterministicPromptSuite({ prompt, draft?, exampleValues? }) -> { checks, passed, failed }`.
- Checks include placeholder/config consistency, required behavior, valid example rendering, optional blanks, Thai input, English input, long-input boundary, deterministic output-structure checks when declared.
- `findRelatedPrompts(prompt, catalog, { limit = 6 }) -> Prompt[]` uses only stable category/tags/source signals.
- Quality Center renders concrete findings from current validator/Test Lab; no invented percentage.

- [ ] **Step 1: Write RED Test Lab tests.** Include valid/invalid fixtures and prove no network/AI call is required.
- [ ] **Step 2: Write RED relationship/Pack tests.** Deterministic ranking, no clones, same prompt may be in multiple packs by ID.
- [ ] **Step 3: Write RED Quality Center tests.** Concrete checks only; no fake score.
- [ ] **Step 4: Run targeted tests and verify RED.** `node --test tests/prompt-test-lab.test.mjs tests/related-prompts.test.mjs tests/prompt-quality-center.test.mjs`.
- [ ] **Step 5: Implement pure modules and UI integration.** Optional AI evaluation stays out of this PR unless separately approved later.
- [ ] **Step 6: Run targeted tests and verify GREEN.**
- [ ] **Step 7: Commit.** `git commit -m "feat: add prompt test lab and quality center"`

## Task 11: PR B Full Regression / Draft PR Gate

- [ ] **Step 1: Run full tests.** `npm test`; zero failures, exactly 100 built-ins remain, immutability tests pass.
- [ ] **Step 2: Run `npm run build`.**
- [ ] **Step 3: Verify OpenNext artifacts.**
- [ ] **Step 4: Run Wrangler dry-run.**
- [ ] **Step 5: Whole-PR review.** Re-check Review Focus items 1 and 4 plus Draft/Version recovery/conflict behavior; fix Important findings RED→GREEN.
- [ ] **Step 6: Open/update Draft PR B against merged PR A `main`.** Title `Prompt Studio: Builder, Versioning, Compare, Test Lab`; stop before merge.

---

# PR C — Control Center

> Start PR C only from the merged PR B `main` head.

## Task 12: Real Analytics Selectors + Mission Control V2

**Files:**
- Modify: `lib/ui/feature-flags.mjs`
- Create: `lib/control/analytics-selectors.mjs`
- Create: `lib/control/activity.mjs`
- Create: `components/control/ControlCenter.jsx`
- Modify: `components/home/MissionControl.jsx`
- Modify: `app/page.jsx`
- Create: `tests/control-analytics.test.mjs`
- Create: `tests/control-center-ui.test.mjs`
- Modify: `tests/feature-flags.test.mjs`

**Interfaces:**
- Produces `V5_CONTROL_CENTER_V2` default false/strict true.
- `deriveControlMetrics({ runs, results, drafts, versions, syncMutations, now, window })` returns counts/series only from supplied persisted records.
- `buildActivityFeed(domainRecords) -> ActivityItem[]` newest-first/deterministic.
- Missing latency/token fields are excluded from averages/totals rather than treated as measured zero.

- [ ] **Step 1: Write RED feature/selector tests.** Runs Today/7d/30d, status breakdown, top prompts, saved rate, failure breakdown, draft-vs-version source usage, missing telemetry omission.
- [ ] **Step 2: Write RED UI tests.** No placeholder KPI cards; flag off preserves existing Mission Control; offline local data renders.
- [ ] **Step 3: Run targeted tests and verify RED.** `node --test tests/feature-flags.test.mjs tests/control-analytics.test.mjs tests/control-center-ui.test.mjs`.
- [ ] **Step 4: Implement pure selectors/activity normalizers and dashboard presentation.** Reuse existing analytics helpers only where semantics match; no duplicate event store.
- [ ] **Step 5: Run targeted tests and verify GREEN.**
- [ ] **Step 6: Commit.** `git commit -m "feat: add real control center analytics"`

## Task 13: Storage Center + Failure Center + Sync Health

**Files:**
- Create: `lib/control/storage.mjs`
- Create: `components/control/StorageSyncCenter.jsx`
- Modify: `lib/run/sync-repository.mjs`
- Modify: `lib/run/run-repository.mjs`
- Modify: `lib/run/result-repository.mjs`
- Create: `tests/storage-health.test.mjs`
- Create: `tests/sync-health.test.mjs`
- Create: `tests/failure-center.test.mjs`

**Interfaces:**
- `measureStorage({ storageManager, counts }) -> Promise<{ usage?, quota?, counts, available }>`; unsupported quota returns `available: false` and no guessed numbers.
- `SyncRepository.summary() -> Promise<{ pending, syncing, synced, conflicts, errors, lastSuccessfulSync? }>`.
- `Sync Now` may call a real cloud adapter only when existing cloud-sync capability/adapter is present; otherwise the action is disabled/unavailable and must not claim success.
- Failure Center consumes actual failed/interrupted Runs, sync errors/conflicts, and captured storage errors.

- [ ] **Step 1: Write RED storage tests.** Available quota vs unsupported API; no guessed capacity; explicit cleanup selection only.
- [ ] **Step 2: Write RED sync/failure tests.** Offline state does not block Run/Builder repositories; summary is repository-backed; Retry Failed/View Pending/View Conflicts map to real queue records; Sync Now is disabled without a real adapter.
- [ ] **Step 3: Run targeted tests and verify RED.** `node --test tests/storage-health.test.mjs tests/sync-health.test.mjs tests/failure-center.test.mjs`.
- [ ] **Step 4: Implement measurement adapters/repository summaries/UI.** No auto-prune and no fake `Synced` state.
- [ ] **Step 5: Run targeted tests and verify GREEN.**
- [ ] **Step 6: Commit.** `git commit -m "feat: add storage sync and failure centers"`

## Task 14: Backup / Restore Domain

**Files:**
- Create: `lib/control/backup.mjs`
- Create: `components/control/BackupRestorePanel.jsx`
- Modify: `components/control/StorageSyncCenter.jsx`
- Create: `tests/backup-restore.test.mjs`

**Interfaces:**
- `BACKUP_SCHEMA_VERSION` is an integer constant owned by this module.
- `buildBackupSnapshot({ customPrompts, drafts, versions, runs, results, packs, userMetadata, settings }) -> BackupSnapshot`.
- `validateBackupSnapshot(input) -> { ok, errors, summary }`.
- `planRestore({ backup, localState }) -> { creates, updates, conflicts, skippedBuiltIns, destructive }`.
- `applyRestore(plan, repositories) -> Promise<RestoreResult>` executes only after explicit UI confirmation.
- Built-in definitions are never imported as user-owned records; stable built-in IDs may be referenced.

- [ ] **Step 1: Write RED serialization/validation tests.** Corrupt JSON, unsupported schema, missing fields, built-in duplication attempts, valid round-trip.
- [ ] **Step 2: Write RED collision tests.** Mutable conflicts preserve both; immutable identical IDs deduplicate only when snapshots are identical; destructive replacements require plan flag/confirmation.
- [ ] **Step 3: Write RED transaction/failure tests.** Failed restore surfaces error and does not silently clear local data.
- [ ] **Step 4: Run targeted tests and verify RED.** `node --test tests/backup-restore.test.mjs`.
- [ ] **Step 5: Implement backup/restore domain and confirmation UI.** Cloud/Supabase stays outside restore core.
- [ ] **Step 6: Run targeted tests and verify GREEN.**
- [ ] **Step 7: Commit.** `git commit -m "feat: add backup and restore workflow"`

## Task 15: Final Navigation / Command Palette / Performance Hardening

**Files:**
- Modify: `components/command/CommandPaletteV5.jsx`
- Modify: `components/shell/AppShell.jsx`
- Modify: `components/shell/Sidebar.jsx`
- Modify: `components/shell/MobileDock.jsx`
- Modify: `app/page.jsx`
- Modify: query/repository modules from prior tasks only when failing measurement/tests require it
- Create: `tests/consolidated-navigation.test.mjs`
- Create: `tests/consolidated-performance.test.mjs`

**Interfaces:**
- Final destinations: Home/Mission Control, Prompt Library, Run History, Saved Results, Prompt Studio, Storage & Sync.
- Command actions: Run Prompt, Open History, Open Saved Results, New Prompt/Open Builder, Open Mission Control, View Failed Runs, Sync Now, Export Backup.
- Release/granular feature flags determine availability; unavailable actions never fake completion.

- [ ] **Step 1: Write RED navigation tests.** Desktop/mobile/command palette expose the same destination model according to flags and preserve fallback paths when flags are off.
- [ ] **Step 2: Write RED performance tests around query boundaries.** Assert bounded page sizes/cursors, debounce contract, no fabricated analytics event store, no background worker introduced.
- [ ] **Step 3: Run targeted tests and verify RED.** `node --test tests/consolidated-navigation.test.mjs tests/consolidated-performance.test.mjs`.
- [ ] **Step 4: Implement final routing/actions and measured hardening only.** No speculative worker/vector index.
- [ ] **Step 5: Run targeted tests and verify GREEN.** Include mobile 44px/safe-area and reduced-motion checks.
- [ ] **Step 6: Commit.** `git commit -m "feat: finalize prompt os control workflows"`

## Task 16: PR C Full Regression / Draft PR Gate

- [ ] **Step 1: Run full tests.** `npm test`; zero failures required.
- [ ] **Step 2: Run `npm run build`.** OpenNext build succeeds.
- [ ] **Step 3: Verify `.open-next` artifacts.**
- [ ] **Step 4: Run `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`.** No deployment.
- [ ] **Step 5: Whole-branch review.** Re-check all five Review Focus items, real-metric provenance, backup collision handling, offline behavior, and flag-off fallbacks. Fix Important findings RED→GREEN.
- [ ] **Step 6: Open/update Draft PR C against merged PR B `main`.** Title `Control Center: Real Analytics, Storage, Sync, Backup`; stop before merge.

---

# Execution / Branch Strategy

1. Master Spec + Master Plan live on `docs/consolidated-three-phase-roadmap` and contain documentation only.
2. After plan approval and one execution-method selection, create PR A implementation branch from current `main`.
3. Finish PR A completely, verify, open Draft PR, and stop before merge.
4. After the user explicitly says `merge`, merge PR A. Execution authorization remains valid for the next approved release; do not ask for a new design/plan/execution-method selection.
5. Create PR B implementation branch from merged PR A `main`, execute Tasks 6–11, and stop before merge.
6. After explicit PR B merge, create PR C from merged `main`, execute Tasks 12–16, and stop before merge.
7. Production deployment remains a separate explicit command after any merge.

# Final Acceptance Across All Three Releases

- Exactly 100 built-in prompts remain stable and executable.
- Daily workflow supports structured example → Run → History → Saved Result → search/export/recovery.
- Prompt Studio supports user-owned Drafts, immutable Versions, built-in customization by derivation, compare/diff, deterministic Test Lab, and concrete Quality findings.
- Control Center shows only real metrics and measurable storage/sync state.
- Backup validates before restore and preserves user data on conflicts.
- No cloud outage blocks local Prompt/Run/Builder use.
- All three release flags default off and preserve current behavior until intentionally enabled.
- Every PR has independent full-suite/build/dry-run evidence before merge.

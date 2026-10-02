# Prompt.OS Consolidated Three-Phase Design

Date: 2026-10-02
Status: Design specification awaiting user review
Base: `main` at `1eb97ccd66342c5b39509bb28dc5b476ed480ded`

## 1. Purpose

Prompt.OS already has a strong foundation: 100 executable built-in prompts, Thai Quality V2 explanations, Variables V2, Prompt Detail V2, Immersive Run, local-first IndexedDB persistence, immutable Run records, Saved Result snapshots, sync queue/conflict contracts, recovery, and a production-safe OpenAI execution boundary.

The next objective is not to create many small phases. The product should advance in three large, coherent releases so the user performs fewer approval/merge/deploy cycles without reducing engineering quality.

The three releases are:

1. **Daily Use Complete** — make prompt execution, examples, history, saved results, search, export, keyboard use, and error recovery feel complete for everyday work.
2. **Prompt Studio** — make Prompt.OS a real prompt IDE with builder, drafts, versioning, customization, diff/compare, test lab, and deterministic quality tooling.
3. **Control Center** — add real analytics, storage/sync health, failure operations, backup/restore, and cloud-readiness using actual local/domain records only.

This design intentionally reduces process repetition to one master design spec and one master implementation plan. Implementation remains split into three large PRs so rollback and merge boundaries remain safe.

## 2. Non-Negotiable Constraints

- Preserve all 100 built-in prompt IDs and current executable behavior.
- Built-in prompts are immutable templates. User customization creates a user-owned derived prompt; it never mutates the built-in record.
- Reuse the current `PromptDetailV2 -> RunWorkspace -> /api/ai/run` execution path.
- Reuse the existing IndexedDB repositories and extend them through repository/domain boundaries. React components must not call IndexedDB or Supabase directly.
- Local-first remains the default. Cloud failures must not block local work.
- Run terminal execution snapshots remain immutable.
- Saved Result snapshot content remains immutable; metadata can be edited through repository operations.
- No fabricated analytics, cloud status, token counts, latency, storage capacity, or quality scores.
- Feature flags remain default-off until intentionally enabled.
- Motion is presentation-only; reduced-motion disables optional motion. No particles, cursor trails, scanlines, heavy 3D tilt, or decorative continuous motion.
- Mobile controls must remain touch-safe and must not be covered by sticky controls.
- TDD RED -> GREEN for implementation changes.
- Full test suite, OpenNext production build, artifact verification, and Wrangler deploy dry-run must pass before each PR is called complete.
- Each PR stops before merge. Merge requires explicit user command.
- Production deployment requires a separate explicit user command.

## 3. Current Foundation to Reuse

### Run domain

Existing `lib/run` already provides:
- IndexedDB setup
- Run model
- Run repository
- Saved Result repository
- Session controller
- Checkpoint policy
- Crash/interrupted recovery
- Sync repository
- Conflict copy behavior

### Run Workspace

Existing `RunWorkspace` already provides:
- editable Variables
- editable session Prompt
- rendered prompt preview
- streaming Result
- Markdown/Raw result modes
- Run / Stop / Retry / Regenerate / Copy / Save Result
- `Ctrl/Cmd + Enter`
- mobile-safe full-screen layout

The next releases extend this workspace instead of replacing it.

### Prompt Library

Current catalog provides exactly 100 built-ins with Thai Quality V2 metadata. Existing Prompt Detail and variable UI remain the source surfaces for built-in prompts.

## 4. Release Strategy — Fewer Updates, Same Quality

Only three product PRs are planned after this master spec/plan:

### PR A — Daily Use Complete
One coherent release containing example-run autofill, History, Saved Results UI, search/filter, export, better error/recovery UX, Run Workspace ergonomics, and keyboard/quick actions.

### PR B — Prompt Studio
One coherent release containing Builder, drafts, versioning, Customize built-in, compare/diff, Prompt Test Lab, Quality Center, relationships, and prompt packs integration.

### PR C — Control Center
One coherent release containing Mission Control V2, real analytics, storage/sync health, failure center, backup/restore, and cloud adapter readiness.

No separate design/spec/plan is required for each of these three PRs after this master design and master implementation plan are approved. Each PR still receives its own final verification and explicit merge command.

## 5. Phase 1 — Daily Use Complete

### 5.1 Goal

A user should be able to discover a prompt, understand it, try a real example, run it, preserve the result, find it later, compare or export it, and recover from common execution/storage failures without leaving the normal workflow.

### 5.2 Example Run / Auto-Fill

Every built-in prompt already has Quality V2 example metadata. Add a deterministic example-value map derived from explicit structured example values, not free-text parsing at click time.

User actions:
- `ลองด้วยตัวอย่าง / Try Example`
- `กรอกเอง / Clear Example`

Behavior:
- Example action populates only session/input values.
- It never mutates the canonical built-in prompt.
- Required values must produce a valid rendered prompt.
- Example data must be testable for all 100 built-ins.
- If a prompt lacks a usable structured example after migration, the action is hidden rather than fabricated.

### 5.3 Run History

Every persisted Run appears in History, including:
- success
- failed
- stopped
- interrupted

History item fields:
- Prompt title
- run ID
- source type (`run`, `retry`, `regenerate`)
- status
- provider/model when real
- started/completed time
- latency/tokens only when returned by the provider
- output preview
- sync/persistence state
- saved/not-saved relation

Filters:
- status
- prompt
- provider/model
- date range
- saved/unsaved

Search fields:
- prompt title
- rendered prompt
- output
- Saved Result name when linked

History reads the existing Run repository; no duplicate telemetry/history database is introduced.

### 5.4 Saved Results Workspace

Saved Results is separate from History.

Supported metadata actions:
- Rename
- Pin / Unpin
- Tags
- Notes
- Open source Run
- Open source Prompt
- Duplicate as a new Saved Result
- Export
- Compare
- Delete Result metadata/artifact without deleting source Run

Snapshot content remains immutable.

### 5.5 Search and Pagination

Do not scan all IndexedDB records on every keystroke.

Use:
- normalized search fields
- IndexedDB indexes where useful
- deterministic text matching
- short debounce
- pagination/cursor loading

No embeddings/vector search in these three phases.

### 5.6 Export

Per-item and bulk export:
- Markdown
- TXT
- JSON

Markdown includes readable prompt snapshot, variables, output, metadata, and timestamps.

JSON preserves stable schema and identifiers for backup/import compatibility.

### 5.7 Better Run Workspace Ergonomics

Extend existing Run Workspace with:
- output auto-scroll while streaming
- auto-scroll stops when the user intentionally scrolls upward
- `Follow output` control restores following
- `Ctrl/Cmd + S` saves a terminal Result
- `Esc` closes only when safe; active runs require explicit Stop/Close behavior so an accidental Esc does not silently abandon work
- Result toolbar: Copy / Save / Retry / Regenerate / Export / Compare when available
- session state preserved when returning from Run to Prompt Detail

### 5.8 Quick Actions

Prompt card/detail quick actions:
- Run
- Try Example
- Favorite
- Customize (becomes fully functional in Phase 2)

No destructive swipe gestures.

### 5.9 Error and Recovery UX

Errors must preserve user work.

Examples:

AI execution unavailable:
- explain that AI execution is unavailable/configuration failed
- preserve prompt/variables
- Copy Prompt
- Retry when possible

IndexedDB start failure:
- block a new Run because every Run must enter History
- show local-storage failure
- provide Retry and storage guidance

Checkpoint/final-save failure after execution begins:
- keep output visible in memory
- clearly show `Not persisted`/persistence warning
- offer Copy / Export / Retry Save
- never claim `Saved locally` unless repository write succeeded

### 5.10 Phase 1 Acceptance Criteria

- All 100 built-ins can either produce a valid structured example or intentionally hide Example action.
- Every Run is discoverable in History after durable creation.
- Saved Results can be searched and exported.
- No source Run deletion cascades into Saved Result deletion.
- Streaming output remains available after Stop/Error.
- Auto-scroll respects manual user scroll.
- Keyboard actions work without stealing editable-field behavior.
- Mobile and reduced-motion regressions pass.

## 6. Phase 2 — Prompt Studio

### 6.1 Goal

Turn Prompt.OS from a high-quality prompt library into a prompt IDE where users can safely create, customize, test, compare, version, and restore prompts.

### 6.2 Prompt Builder

Structured sections:
- Role
- Goal
- Context
- Inputs
- Constraints
- Output Format
- Examples
- Variables
- Notes

Modes:
- Structured
- Raw
- Preview
- Versions

Both Structured and Raw views operate over one canonical Draft representation to avoid divergent sources of truth.

### 6.3 Draft Model

Drafts are mutable and autosaved to IndexedDB with debounce.

Draft fields include:
- prompt ID / draft ID
- title and metadata
- structured sections
- raw/canonical prompt text
- variable config
- derived-from metadata
- updated time
- sync state/revision

Crash recovery presents `Recovered Draft` rather than silently discarding changes.

Autosave does not create a Version.

### 6.4 Versioning

Only explicit `Save Version` creates an immutable Version snapshot.

Version metadata:
- monotonically increasing version number
- label
- change note
- status: Stable / Experimental / Archived
- prompt snapshot
- variable schema snapshot
- metadata snapshot
- parent version ID
- created time
- sync state/revision

Version numbers are never reused after archive/delete.

Restore behavior:
- restoring an old Version creates/updates the current Draft
- historical Versions remain unchanged
- a future Save creates a new version number

### 6.5 Customize Built-in

The 100 built-ins remain immutable.

`Customize` creates a new user-owned Prompt Draft with:
- new prompt ID
- `derivedFromPromptId`
- source built-in snapshot/reference metadata

The derived prompt can be edited/versioned normally.

Built-in updates in future releases must not overwrite user-owned derived prompts.

### 6.6 Prompt Diff and Compare

Compare combinations:
- Run vs Run
- Result vs Result
- Run vs Result
- Version vs Version
- Draft vs Version

Views:
- side-by-side desktop
- unified diff
- output-only for execution artifacts
- mobile tabs `A | B | Diff`

Diff dimensions:
- prompt text
- variables/schema
- metadata
- output
- provider metadata when real

### 6.7 Prompt Test Lab

Initial Test Lab is deterministic-first.

Tests include:
- placeholder/config consistency
- required input behavior
- valid example rendering
- empty optional fields
- Thai input
- English input
- long input boundary
- declared output-format structure checks where deterministic

Optional AI evaluation must be separate and clearly labeled; it may not silently become the source of truth.

### 6.8 Prompt Quality Center

Expose current deterministic validator findings as human-readable UI.

Do not invent percentage quality scores.

Show concrete checks, for example:
- Goal present
- Context present
- Variables declared
- Required help text present
- Output format specified
- Example available
- unresolved placeholders
- duplicate/conflicting instructions if deterministically detectable

### 6.9 Related Prompts and Packs

Use deterministic category/tags/source relationships first.

No embeddings.

Built-in and user-owned prompts can appear in Packs through prompt IDs only; Packs never clone prompt records.

### 6.10 Phase 2 Acceptance Criteria

- Built-ins cannot be mutated through Builder.
- Customize always creates a user-owned derived prompt.
- Draft autosave/recovery works.
- Save Version produces immutable snapshots.
- Restore never rewrites historical Versions.
- Version numbers are monotonic.
- Compare output is deterministic for identical inputs.
- Test Lab can validate prompt structure without AI.
- Archived Versions continue to resolve historical Run references.

## 7. Phase 3 — Control Center

### 7.1 Goal

Provide an operations dashboard based entirely on actual local/domain records, then prepare safe cloud synchronization and backup workflows without making cloud connectivity a requirement for normal use.

### 7.2 Mission Control V2

Dashboard sections:
- Runs Today / 7d / 30d
- status counts
- Saved Result count
- active/custom prompt count
- Draft count
- Version count
- Pending Sync
- Sync Errors
- Conflicts
- Storage usage when browser provides it
- recent real activity

No placeholder KPI cards.

### 7.3 Derived Analytics

Analytics are selectors/aggregations over existing repositories.

Examples:
- `countRunsByDate()`
- `statusBreakdown()`
- `mostUsedPrompts()`
- `averageLatency()` only over records that contain real latency
- `tokenUsage()` only over records that contain real token metadata
- `savedResultRate()`
- `failureBreakdown()`
- draft vs committed source usage

No duplicate analytics event database unless a later scale problem proves it necessary.

### 7.4 Activity and Failure Center

Activity stream uses real domain events/records:
- Run completed/failed/stopped/interrupted
- Result saved
- Version created
- Draft recovered
- sync completed/error/conflict

Failure Center groups:
- Failed Runs
- Interrupted Runs
- Sync Errors
- Storage Errors

Each item links to concrete detail and recovery actions.

### 7.5 Storage Center

Show only data that can be measured:
- Run count
- Saved Result count
- Draft/Version count
- pending queue count
- estimated IndexedDB/browser storage usage when available

If quota/capacity information is unavailable, display `Unavailable`, never a guessed limit.

Actions:
- Export Backup
- Review Largest Items
- Delete selected Runs
- Delete selected Saved Results
- cleanup by explicit date/status selection

No automatic pruning.

### 7.6 Backup / Restore

Backup JSON contains schema version and supported user-owned data:
- custom prompts/drafts
- versions
- runs
- saved results
- packs/favorites/user metadata
- settings that are safe to export

Restore flow:
1. parse/validate
2. show summary
3. detect collisions/revisions
4. preserve both on mutable conflicts
5. require explicit confirmation before destructive replacement
6. import transactionally where possible

Built-in prompt definitions are not duplicated as user-owned backup content; references use stable built-in IDs.

### 7.7 Sync Health and Cloud Boundary

Display repository-backed states only:
- local
- pending
- syncing
- synced
- conflict
- sync_error

Actions:
- Sync Now
- Retry Failed
- View Pending
- View Conflicts

Cloud sync must extend the existing queue/revision/conflict semantics. Local editing/execution continues when cloud is offline.

Production Supabase schema/migrations remain a separate explicit deployment/migration gate if required by the implementation plan; they may not be smuggled into UI work.

### 7.8 Performance

Use:
- IndexedDB indexes
- pagination
- memoized deterministic selectors
- bounded incremental aggregation when useful

Do not introduce background workers unless measurements show main-thread work is a real bottleneck.

### 7.9 Phase 3 Acceptance Criteria

- Every visible metric can be traced to real persisted records.
- Missing token/latency/quota values are omitted or shown unavailable.
- Dashboard remains usable offline.
- Storage cleanup is always explicit.
- Backup validates before import.
- Restore/conflicts preserve user data.
- Sync failure never blocks local Run/Builder workflows.

## 8. Navigation / Information Architecture

Primary destinations after all three releases:

- Home / Mission Control
- Prompt Library
- Run History
- Saved Results
- Prompt Studio
- Storage & Sync

Command Palette should expose the same destination model and important actions:
- Run Prompt
- Open History
- Open Saved Results
- New Prompt / Open Builder
- Open Mission Control
- View Failed Runs
- Sync Now
- Export Backup

Unavailable actions stay disabled/hidden according to feature flags; they never fake success.

## 9. Feature Flag Strategy

Avoid feature-flag explosion. Prefer a small release-level gate plus existing granular gates where already present.

New release-level flags:
- `V5_DAILY_USE_COMPLETE`
- `V5_PROMPT_STUDIO`
- `V5_CONTROL_CENTER_V2`

Existing flags such as execution, prompt detail, variables, mission control, sync, analytics, command palette, and prompt explainer remain supported.

All new release-level flags default `false`.

A release-level flag may gate navigation/surface availability, while lower-level existing flags continue to protect established capabilities.

## 10. Data Ownership Rules

### Built-in Prompt
System-owned immutable template.

### User Prompt / Draft
User-owned mutable working state.

### Prompt Version
Immutable committed snapshot.

### Run
Execution record. Mutable only while active; immutable execution content after terminal state.

### Saved Result
Immutable snapshot content; mutable organization metadata.

### Pack
Reference-only list of prompt IDs.

### Sync mutation
Durable queue item with explicit application/conflict state.

These ownership boundaries must be encoded in repository APIs and tests, not only documented in UI text.

## 11. Migration Strategy

Each PR must be forward-compatible and idempotent.

- Existing 100 built-ins remain stable.
- Existing Run/Saved Result IndexedDB records remain readable.
- New object stores/indexes use schema-version upgrades without destructive reset.
- Stored user metadata is preserved.
- New fields use safe defaults.
- Failed migrations surface errors and do not silently clear local data.
- Backup/export should be available before any later destructive migration is introduced.

## 12. Accessibility / Mobile / Motion

All three releases must preserve:
- keyboard focus visibility
- semantic headings/forms/dialogs
- accessible names for icon-only controls
- 44px-class touch targets on mobile actions
- safe-area-aware sticky controls
- no horizontal-only essential workflow on mobile
- reduced-motion paths with correctness independent of animation
- polite status announcements without streaming token spam in live regions

## 13. Testing and Verification

### TDD
Every functional task follows RED -> GREEN. A new behavior is not considered implemented until the failing test was observed and the production change makes it pass.

### Required test groups

Phase 1:
- structured examples
- history ordering/filter/search/pagination
- Saved Result independence
- export schemas
- auto-scroll/follow state
- keyboard actions
- error/persistence truth
- mobile/reduced motion

Phase 2:
- built-in immutability
- derived prompt creation
- draft autosave/recovery
- version immutability/numbering/restore
- diff correctness
- test lab checks
- quality findings
- archived historical references

Phase 3:
- analytics over real records only
- missing telemetry omission
- date-window aggregation
- storage availability fallback
- explicit cleanup
- backup validation/import
- conflict preserve-both
- offline sync behavior

### Before each PR is considered complete

- full `npm test`
- OpenNext production build
- verify `.open-next/worker.js`, assets, edge config
- Wrangler deploy dry-run
- whole-branch review against this spec and the master implementation plan
- PR body lists verification evidence

## 14. Rollback and Release Safety

Each of the three phases is a separate PR and merge boundary.

If a merged release has a UI regression:
- default-off/release-level flags provide first rollback path
- revert the phase merge commit if required
- local stored records must remain backward readable whenever feasible

No production deployment is implied by merge. Deployment happens only after explicit user command.

## 15. Out of Scope for These Three Releases

- public prompt marketplace
- multi-user real-time collaboration
- billing/subscription system
- agent/workflow orchestration
- scheduled prompt execution
- embeddings/vector search
- multi-provider execution beyond the current OpenAI path
- automatic production database migrations without a separately reviewed migration/deploy gate

These may be reconsidered after the three consolidated releases are stable.

## 16. Success Definition

At the end of the consolidated roadmap, Prompt.OS should operate as a local-first Prompt IDE:

1. A user can understand and try any built-in prompt quickly.
2. Every execution is recoverable/history-backed and important outputs can be curated/exported.
3. Users can customize built-ins without damaging them.
4. Users can build, version, test, restore, and compare prompts.
5. Mission Control reflects real usage/storage/sync state only.
6. The product remains usable offline for local workflows.
7. Three large release cycles replace many small deployment cycles without reducing TDD, CI, review, migration, rollback, accessibility, or data-integrity standards.

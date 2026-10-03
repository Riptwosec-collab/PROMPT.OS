# Prompt.OS Single-Release Design

Date: 2026-10-03
Status: Approved direction, superseding the prior three-PR release strategy
Base: `main` at `1eb97ccd66342c5b39509bb28dc5b476ed480ded`

## 1. Purpose

Prompt.OS will deliver the previously approved Daily Use Complete, Prompt Studio, and Control Center scope as **one product release and one pull request**, while retaining three internal implementation milestones. The goal is fewer user approval/merge/deploy cycles without reducing engineering quality.

Release flow:

`1 Master Spec -> 1 Master Plan -> 1 Native execution -> 1 Draft PR -> 1 explicit merge -> 1 explicit production deploy`

Internal milestones remain:

1. **Milestone A — Daily Use Complete**
2. **Milestone B — Prompt Studio**
3. **Milestone C — Control Center**

Milestones are engineering checkpoints only. They do not create separate PRs, merge gates, or deploys.

## 2. Non-Negotiable Constraints

- Preserve exactly 100 built-in prompt IDs and current executable behavior.
- Built-ins are immutable system templates.
- Customization creates user-owned derived prompts and never mutates built-ins.
- Reuse `PromptDetailV2 -> RunWorkspace -> /api/ai/run`; no parallel AI execution engine.
- Reuse and extend the current IndexedDB repository architecture; React does not access IndexedDB or Supabase directly.
- Local-first remains authoritative for normal work.
- Cloud/sync failure never blocks local Run, History, Result, or Builder workflows.
- Run terminal execution snapshots remain immutable.
- Saved Result snapshot content remains immutable; organization metadata may be edited through repository methods only.
- No fabricated analytics, token counts, latency, storage quota, quality score, cloud status, or sync success.
- Feature flags default false until intentionally enabled.
- No production Supabase DDL/migration is bundled into this release without a separate explicit migration approval.
- Motion is presentation-only; reduced-motion paths remain fully functional.
- Mobile controls are touch-safe and safe-area aware.
- Every functional task follows observed TDD RED -> GREEN.
- The final PR is not merge-ready until full tests, OpenNext build, artifact verification, Wrangler dry-run, migration checks, and whole-branch review pass.
- Merge requires explicit `merge` from the user.
- Production deployment requires an explicit separate deploy command.

## 3. Existing Foundation to Reuse

Prompt.OS already contains:

- 100 executable built-in prompts with Thai Quality V2 explanations
- Variables V2 and Prompt Detail V2
- Immersive Run Workspace
- `/api/ai/run` execution boundary
- IndexedDB Run and Saved Result repositories
- immutable Run model
- checkpoint and interrupted-run recovery
- sync queue/conflict primitives
- prompt packs and prompt quality validator
- analytics primitives under `lib/analytics`
- current shell/navigation and command palette

The release extends these systems rather than replacing them.

## 4. One-PR Release Strategy

One feature branch is created from current `main` and remains the implementation branch through all three milestones.

### Milestone checkpoints

Each milestone still has:

- RED -> GREEN task cycles
- focused commits
- targeted tests
- migration assertions where applicable
- accessibility/mobile checks
- feature-flag fallback tests
- an internal milestone regression run

However, no Draft PR is opened until all three milestones are complete. The only user integration gate is the final Draft PR.

### Final release gate

Before opening/finalizing the one Draft PR:

1. `npm test`
2. `npm run build`
3. verify OpenNext artifacts
4. `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`
5. migration/idempotency regression
6. exactly-100 built-in regression
7. whole-branch review
8. fix all Important findings with RED -> GREEN
9. open/update one Draft PR against `main`
10. stop before merge

## 5. Milestone A — Daily Use Complete

### Goal

Complete the everyday workflow:

`Discover -> Understand -> Try Example -> Run -> Save -> Find Later -> Export -> Recover`

### Structured Example Values

Built-ins may expose:

`exampleValues: Record<string, unknown>`

Rules:

- executable examples are structured data, not parsed from Thai prose
- `exampleInputTh` remains explanatory only
- prompts without a safe deterministic example hide the Try Example action
- applying/clearing examples changes session values only
- built-in objects remain unchanged
- deterministic validator verifies required variables and unresolved placeholders

### Run History

Every durable Run appears in History, including:

- success
- failed
- stopped
- interrupted

History supports:

- newest-first pagination
- status filter
- prompt filter
- provider/model filter
- date range
- saved/unsaved filter
- normalized text search over title/rendered prompt/output

History uses the existing Run repository; there is no duplicate telemetry database.

### Saved Results

Separate workspace from History.

Metadata actions:

- Rename
- Pin / Unpin
- Tags
- Notes
- Open source Run
- Open source Prompt
- Duplicate Result
- Export
- Delete Result

Deleting a Result never deletes its source Run. Deleting a Run never deletes an existing immutable Result snapshot.

### Export

Per-item and bulk formats:

- Markdown
- TXT
- JSON

JSON includes stable identifiers/schema data for later backup compatibility. Missing real provider metadata stays absent rather than being filled with fake zeroes.

### Run Workspace upgrades

- streaming auto-follow
- manual upward scroll disables auto-follow
- explicit `Follow output` restores it
- `Ctrl/Cmd + S` saves eligible terminal output
- `Esc` cannot silently abandon an active Run
- Copy / Save / Retry / Regenerate / Export
- persistence failure keeps visible in-memory output and exposes Copy / Export / Retry Save
- UI never claims `Saved locally` until repository persistence succeeds

### Quick actions

Milestone A exposes:

- Run
- Try Example
- Favorite

Compare and Customize are not exposed as working actions until Milestone B capability exists.

## 6. Milestone B — Prompt Studio

### Goal

Turn Prompt.OS into a prompt IDE for safe creation, customization, testing, comparison, and versioning.

### Canonical Draft

A Draft is mutable working state with one canonical representation shared by Structured and Raw modes.

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

Draft autosave uses IndexedDB with debounce. Autosave never creates a Version.

Crash/reload recovery surfaces a recovered Draft instead of silently discarding edits.

### Versioning

Only explicit `Save Version` creates an immutable Version.

Version fields include:

- version ID
- prompt ID
- monotonic version number
- label
- change note
- Stable / Experimental / Archived status
- prompt snapshot
- variable config snapshot
- metadata snapshot
- parent version ID
- timestamps
- revision/sync state

Version numbers are never reused. Restore copies historical content into the current Draft; it never rewrites an existing Version.

### Customize Built-in

`Customize` creates a new user-owned prompt/draft with:

- new prompt ID
- `derivedFromPromptId`
- source snapshot/reference metadata

The original built-in remains immutable.

### Compare / Diff

Supported pairs:

- Run vs Run
- Result vs Result
- Run vs Result
- Version vs Version
- Draft vs Version

Views:

- side-by-side desktop
- unified diff
- execution output-only
- mobile `A | B | Diff`

Compare is deterministic and does not call AI.

### Prompt Test Lab

Deterministic-first checks:

- placeholder/schema consistency
- required variables
- structured example rendering
- optional blanks
- Thai input
- English input
- long input boundary
- deterministic output-format assertions where possible

Any future AI evaluation is separate and clearly labeled.

### Quality Center

Displays concrete validator findings only, such as:

- goal present
- context present
- variables declared
- help text present
- output format present
- example available
- unresolved placeholders

No synthetic percentage quality score.

### Related Prompts / Packs

Relationships are deterministic using category, tags, and source references. No embeddings/vector search.

## 7. Milestone C — Control Center

### Goal

Provide operational visibility and backup/sync controls based only on real persisted records.

### Mission Control V2

Real metrics include:

- Runs Today / 7d / 30d
- status breakdown
- Saved Results
- active/custom prompts
- Drafts
- Versions
- Pending Sync
- Sync Errors
- Conflicts
- browser storage estimate when available
- recent persisted activity

No placeholder KPI values.

### Analytics

Derived from repositories with deterministic selectors:

- countRunsByDate
- statusBreakdown
- mostUsedPrompts
- averageLatency over records containing real latency only
- tokenUsage over real token metadata only
- savedResultRate
- failureBreakdown
- draft/version source usage

No duplicate analytics event store unless later measurement proves necessary.

### Failure Center

Groups:

- Failed Runs
- Interrupted Runs
- Sync Errors
- Storage Errors

Each item links to real data and recovery actions.

### Storage Center

Show measurable data only:

- Run count
- Result count
- Draft count
- Version count
- sync queue count
- estimated usage/quota if browser exposes it

If quota is unavailable, display `Unavailable`.

No automatic pruning.

### Backup / Restore

Backup JSON includes schema version and supported user-owned records:

- custom prompts/drafts
- versions
- runs
- results
- packs/favorites/user metadata
- export-safe settings

Built-in prompt definitions are referenced by stable IDs rather than copied into user-owned data.

Restore sequence:

1. parse and validate
2. summarize
3. detect collisions/revisions
4. preserve both on mutable conflicts
5. require explicit confirmation for destructive replacement
6. import transactionally where possible

Invalid backup data must not partially mutate local state.

### Sync Health

Display only repository-backed states:

- local
- pending
- syncing
- synced
- conflict
- sync_error

`Sync Now` is disabled/unavailable unless a real cloud adapter exists. No simulated sync success.

## 8. Data Ownership

- **Built-in Prompt:** immutable system-owned template
- **User Draft:** mutable working state
- **Prompt Version:** immutable committed snapshot
- **Run:** mutable only while active; immutable execution snapshot after terminal state
- **Saved Result:** immutable content snapshot with mutable organization metadata
- **Sync Mutation:** durable queue item with explicit state

Repository APIs and tests must enforce these rules.

## 9. IndexedDB Migration

Migration is additive, forward-compatible, and idempotent.

- current Run/Result records remain readable
- new Draft/Version/index stores are added through schema-version upgrade
- existing user metadata remains unchanged
- migration failure never triggers automatic database clearing
- rerunning/opening after successful migration does not duplicate records
- legacy records use safe defaults for new optional fields

## 10. Feature Flags

Use three release-capability flags, all default false:

- `V5_DAILY_USE_COMPLETE`
- `V5_PROMPT_STUDIO`
- `V5_CONTROL_CENTER_V2`

Existing granular flags remain supported. During the single PR, milestone-specific flags allow isolated testing and rollback even though all code lands together.

## 11. Accessibility / Mobile / Motion

- visible keyboard focus
- semantic forms/dialogs/headings
- accessible icon labels
- 44px-class mobile targets
- safe-area sticky controls
- no essential horizontal-only workflow on mobile
- correctness independent of animation
- reduced-motion support
- status announcements without streaming-token live-region spam

## 12. Final Acceptance Criteria

The one release is merge-ready only when:

- exactly 100 built-ins remain
- all built-in IDs are preserved
- existing Runs/Results survive DB migration
- examples are deterministic and non-mutating
- History/Results paginate/search correctly
- Builder cannot mutate built-ins
- Draft autosave/recovery works
- Versions are immutable and monotonic
- Compare/Test Lab are deterministic
- analytics use real data only
- missing metadata is never fabricated
- backup validates before restore
- conflict handling preserves user data
- sync/cloud failure does not block local work
- mobile/accessibility/reduced-motion checks pass
- full tests pass
- OpenNext build passes
- artifacts verify
- Wrangler dry-run passes
- whole-branch review has no unresolved Important findings
- one Draft PR is opened and left unmerged until explicit user approval

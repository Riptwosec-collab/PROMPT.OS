# Prompt.OS Phase 4 — Immersive Run Experience Design

Date: 2026-09-23
Status: Approved design awaiting user review before implementation planning
Base: `main` @ `3b0740655874d46068477ab385dca95638550336`

## 1. Purpose

Phase 4 upgrades Prompt.OS from a prompt library with a basic run action into a focused execution workspace with reliable local persistence, recoverable streaming output, deterministic run history records, and a clean boundary for later cloud sync.

The goal is to make running a prompt feel like a first-class product workflow while preserving the current security model, legacy fallbacks, feature-flag isolation, accessibility, and the existing 80 built-in prompts.

Phase 4 is the foundation for later phases:

- Phase 5: Run History, Saved Results, Compare, Search, Export
- Phase 6: Prompt Builder and Versioning
- Phase 7: Mission Control V2 and real analytics

## 2. Locked Decisions

The following decisions were approved during design review:

- Run experience: **Full-screen Run Mode**
- Persistence strategy: **Local-first + Cloud Sync boundary**
- Local source of truth: **IndexedDB**
- Every run is auto-saved to Run History
- `success`, `failed`, `stopped`, and crash-recovered `interrupted` runs are retained
- Partial output is preserved on stop, error, or interruption
- Retry and Regenerate always create a new run record
- Run Mode may edit prompt text and variables before execution
- Editing inside Run Mode does not create a Prompt Version automatically
- Conflict policy: **Preserve both / conflict copy**
- Result rendering: **Rich Markdown by default + Raw toggle**
- No automatic history pruning
- Every run belongs to History automatically; Saved Result is a separate explicit artifact
- Saved Results use immutable snapshots of prompt, variables, output, and execution metadata
- Current AI authentication behavior is not changed in Phase 4

## 3. Non-Negotiable Project Constraints

Phase 4 must preserve these existing project rules:

1. Feature flags default to `false`.
2. Legacy UI and execution paths remain available when Phase 4 flags are disabled.
3. Exactly 80 built-in prompts remain intact.
4. No fake telemetry, token counts, latency, model, provider, sync state, or cloud status.
5. Motion is presentation-only and never gates correctness or navigation.
6. Reduced-motion behavior remains supported.
7. No heavy 3D, particles, scanlines, or cursor trails.
8. Mobile controls remain reachable and touch-friendly.
9. No production Supabase DDL or schema migration is bundled implicitly into this phase.
10. No production deployment or merge occurs without separate explicit authorization.

## 4. Existing System Context

The current app already has:

- `/api/ai/run` streaming NDJSON responses from the server
- Prompt Detail V2 with variable validation and rendered prompt preview
- feature-flag infrastructure
- local prompt/workspace state
- existing sync revision and offline mutation concepts
- existing premium visual foundation from Phases 1–3

Phase 4 should extend these paths rather than create a parallel Prompt.OS implementation.

## 5. Architecture

Use a separated domain architecture rather than embedding execution, persistence, streaming, recovery, and rendering into one React component.

```text
Prompt Detail
    │
    ▼
Full-screen Run Workspace
    │
    ├── Run Session Controller
    │     ├── validate/render input
    │     ├── create run record
    │     ├── invoke /api/ai/run
    │     ├── parse stream
    │     ├── AbortController / Stop
    │     ├── retry/regenerate lineage
    │     └── finalize terminal state
    │
    ├── Repository Layer
    │     ├── RunRepository
    │     ├── ResultRepository contract
    │     └── SyncRepository contract
    │
    ├── IndexedDB
    │     ├── runs
    │     ├── savedResults
    │     ├── syncQueue
    │     └── metadata
    │
    └── Presentation
          ├── editable variables
          ├── editable prompt snapshot
          ├── streaming Markdown output
          ├── Raw output toggle
          └── run action bar
```

React components consume domain state and repository interfaces. They must not call IndexedDB or Supabase directly.

## 6. Run Session State Machine

The execution state machine is authoritative for active run behavior.

```text
idle
  ↓
preparing
  ↓
running
  ├── success
  ├── failed
  ├── stopped
  └── interrupted   (recovery only)
```

Terminal states are immutable for execution content:

- `success`
- `failed`
- `stopped`
- `interrupted`

A terminal run may later have mutable metadata in future phases, but its execution snapshot and output must not be rewritten in place.

## 7. Run Record Contract

A run record should contain at least:

```text
id
promptId
parentRunId
trigger                 run | retry | regenerate
sourceType              prompt | draft | version
sourceVersionId         nullable

status                   preparing | running | success | failed | stopped | interrupted

promptSnapshot
variablesSnapshot
renderedPrompt
output

provider                 real value only
model                    real value only
startedAt
completedAt
latencyMs                real value only
inputTokens              real value only
outputTokens             real value only
responseId               real value only
error                    nullable

syncState                local | pending | syncing | synced | conflict | sync_error
revision
createdAt
updatedAt
```

Missing upstream metadata remains absent/null. The UI must never synthesize values.

## 8. Run Creation and Execution Flow

### 8.1 New Run

1. Validate variables.
2. Render the effective prompt.
3. Attempt to create the local run record in IndexedDB with `status = preparing`.
4. Only after the local record exists, begin network execution.
5. Transition to `running`.
6. Stream output into in-memory state.
7. Periodically checkpoint output into IndexedDB.
8. Finalize to one terminal state.
9. Queue sync metadata as a secondary effect where applicable.

If the initial local record cannot be created, the execution must not start.

### 8.2 Stop

Stop uses `AbortController` or the equivalent cancellation primitive.

On Stop:

- preserve the latest output buffer
- flush output to local storage
- set `status = stopped`
- retain prompt and variable snapshots
- do not rewrite the record as success or failure

### 8.3 Failure

On stream/network/provider failure:

- preserve partial output
- flush the latest recoverable buffer
- set `status = failed`
- store the real error message when available
- do not discard entered variables or edited prompt text

### 8.4 Retry / Regenerate

Retry and Regenerate never overwrite the source run.

A new run gets:

- a new `id`
- `parentRunId` pointing to the previous run
- `trigger = retry` or `trigger = regenerate`
- a fresh prompt/variable snapshot reflecting the inputs used for that new execution

This preserves a complete audit trail.

## 9. Streaming Persistence

Do not write IndexedDB on every token or every stream delta.

Use bounded checkpointing:

```text
stream delta
   ↓
append to memory buffer
   ↓
checkpoint on interval / size threshold
   ↓
IndexedDB
```

Force a final flush when:

- user stops the run
- stream fails
- stream completes
- the active run controller is torn down
- the page is exiting when the platform permits a safe synchronous/final write path

The implementation plan may tune checkpoint interval and size thresholds based on tests, but the design requirement is bounded write frequency plus reliable terminal flush.

## 10. Crash Recovery

On app startup, detect stale records left in `preparing` or `running` when no active session exists.

Recovered stale runs become:

`status = interrupted`

They must retain:

- partial output
- snapshots
- timestamps
- provider/model metadata already received
- error/recovery note where appropriate

The UI should offer actions such as:

- Retry
- Save partial result
- Copy / Export partial output
- Delete

Do not relabel an interrupted session as `failed` or `stopped` because those states imply an observed terminal action.

## 11. IndexedDB Repository Layer

IndexedDB is the local source of truth for Phase 4 execution artifacts.

Conceptual repositories:

```text
RunRepository
  create(run)
  updateActive(id, patch)
  appendOutput(id, outputCheckpoint)
  finalize(id, terminalState)
  get(id)
  list(query)
  recoverInterrupted()

ResultRepository
  saveFromRun(runId, metadata)
  get(id)
  list(query)

SyncRepository
  enqueue(mutation)
  listPending()
  markApplied(id)
  markConflict(id, details)
  markError(id, error)
```

The implementation may use one IndexedDB database with multiple object stores, but consumers interact through repositories rather than raw object stores.

## 12. Saved Result Contract

A Saved Result is a separate artifact created only by explicit user action.

It should contain at least:

```text
resultId
sourceRunId
name
promptSnapshot
variablesSnapshot
outputSnapshot
metadataSnapshot
pinned
createdAt
updatedAt
syncState
revision
```

Snapshot content is immutable. Future metadata such as name, pin state, notes, or tags may change without rewriting the original prompt/variables/output snapshot.

Deleting a source run in a later phase must not make an existing Saved Result unreadable.

## 13. Storage Failure Policy

### 13.1 Before execution

If IndexedDB cannot create the run record:

- do not start the network request
- show an explicit local-save failure
- expose recovery actions such as Retry, Storage Usage, Cleanup, or Export when available

### 13.2 During execution

If a checkpoint fails after execution has started:

- do not falsely claim the run is saved
- keep the latest output in memory
- show a persistent but non-blocking warning
- retry persistence at the next checkpoint and terminal flush
- allow Copy/Export of the current output before the user leaves

The UI must distinguish `visible in memory` from `persisted locally`.

## 14. Sync Boundary

Cloud sync is not the primary write path.

The ordering is:

```text
Domain action
  ↓
IndexedDB commit
  ↓
UI reflects committed local state
  ↓
Sync mutation queued
  ↓
Cloud adapter later attempts sync
```

A cloud failure must not block local editing, local history, or local Saved Result access.

Phase 4 prepares the queue/contracts and sync states but does not require production Supabase schema changes.

## 15. Sync States

Allowed sync states:

- `local`
- `pending`
- `syncing`
- `synced`
- `conflict`
- `sync_error`

Only real repository/cloud state may drive these labels.

Do not infer `synced` from network availability alone.

## 16. Conflict Strategy

Use **Preserve Both**.

If local pending changes are based on an older cloud revision:

1. retain the local record or metadata change as a conflict copy
2. pull the current cloud state
3. expose both versions for later user resolution
4. never silently overwrite local data

Conflict copies should retain metadata such as:

```text
conflictOf
conflictDetectedAt
sourceRevision
```

Immutable run/output/version snapshots naturally reduce conflict frequency. Conflicts are expected mainly around mutable metadata.

## 17. Full-screen Run Workspace UX

### Desktop

```text
┌─────────────────────────────────────────────────────┐
│ ← Prompt Name       Running ●     Model      Close │
├──────────────────┬──────────────────────────────────┤
│ VARIABLES        │ RESULT                           │
│ editable inputs  │ streaming Markdown              │
│                  │                                  │
│ PROMPT           │ Raw toggle                       │
│ editable text    │                                  │
├──────────────────┴──────────────────────────────────┤
│ Run   Stop   Retry   Copy   Save Result             │
└─────────────────────────────────────────────────────┘
```

### Mobile

Use a single-column workflow:

1. Variables
2. Prompt
3. Result
4. Sticky bottom actions

The bottom bar must not cover interactive content or result text.

## 18. Run Workspace Behavior

The user may edit:

- variable values
- prompt text used for the next run

Those edits are session/draft inputs only. They do not automatically create a Prompt Version.

Closing Run Workspace returns the user to the originating Prompt Detail context where practical, preserving entered values according to the existing ownership model.

Keyboard shortcut:

- `Ctrl + Enter` or `Cmd + Enter` triggers Run when focus/validation rules allow it
- shortcuts must respect editable fields and must not collide with browser/system behavior

## 19. Result Rendering

Default view: Rich Markdown.

Support at minimum:

- headings
- paragraphs
- lists
- tables
- code blocks
- inline code
- links with safe handling

A Raw toggle exposes the original text output.

Markdown rendering must not mutate or reinterpret the stored raw output. Stored output remains the canonical execution result.

## 20. Visual and Motion Rules

Reuse the existing premium glass/motion system.

Allowed:

- restrained status transitions
- subtle execution progress treatment
- small success/failure state changes
- smooth workspace entry/exit

Not allowed:

- continuous particle fields
- scanlines
- cursor trails
- heavy 3D tilt
- motion that delays Run, Stop, Retry, Copy, or Save

`prefers-reduced-motion` disables non-essential motion.

## 21. Feature Flag

Add a dedicated Phase 4 gate, conceptually:

`V5_IMMERSIVE_RUN`

Requirements:

- default `false`
- explicit `true` only
- when disabled, the existing run path remains unchanged
- enabling Phase 4 must not require enabling unrelated future phases

Additional flags may be introduced only where rollback isolation provides real value.

## 22. Authentication and Provider Scope

Phase 4 does not redesign authentication.

The existing `/api/ai/run` authorization behavior remains authoritative.

Phase 4 also does not add new provider implementations unless required by a separate approved scope. The UI may display provider/model only when those values are real and supplied by the current execution path.

## 23. History Retention Policy

Phase 4 does not auto-delete history.

No run is silently pruned because of age or count.

Future Storage Management may expose:

- storage usage
- export
- cleanup by filters/date/status
- explicit deletion

Any cleanup remains user-initiated.

## 24. Error and Recovery UX

The UI should distinguish these states clearly:

- Running
- Saving locally
- Saved locally
- Waiting to sync
- Sync failed
- Local save warning
- Interrupted run recovered

Do not show cloud status as a decorative badge unless backed by actual state.

Error messages must preserve the user's ability to copy, retry, or recover partial output.

## 25. Accessibility

Required:

- complete keyboard navigation
- visible focus states
- accessible status text, not color-only meaning
- dialogs/workspaces expose correct landmark/label semantics
- Stop remains reachable during active execution
- mobile tap targets remain touch-friendly
- reduced-motion support
- streaming updates should avoid excessively noisy screen-reader announcements

## 26. Testing Strategy

Implementation must use TDD and include regression coverage for at least:

### Domain / state
- valid state transitions
- invalid transition rejection
- success finalization
- failure finalization
- stop finalization
- crash recovery to `interrupted`
- Retry/Regenerate create new IDs
- prior terminal runs remain immutable

### Persistence
- create before network execution
- checkpointed partial output
- final flush on stop/error/success
- storage failure before Run blocks execution
- storage failure during Run does not falsely report Saved
- stale active-run recovery

### Saved Results contract
- explicit Save only
- immutable snapshots
- full prompt/variables/output metadata snapshot

### Sync contracts
- queue mutation creation
- duplicate queue protection
- sync state transitions
- preserve-both conflict behavior
- cloud failure does not block local use

### UI
- Full-screen Run entry/exit
- `Ctrl/Cmd + Enter`
- Stop availability while running
- Markdown/Raw toggle
- partial output visible on failure/stop
- mobile sticky actions
- reduced motion
- focus restoration

### Regressions
- existing Prompt Detail behavior
- Variables V2 validation/rendering
- feature flags default false
- exactly 80 built-in prompts
- legacy run behavior when Phase 4 flag is disabled

## 27. Rollout and Safety

Implementation should land in a dedicated Phase 4 branch and PR.

The PR must remain unmerged until separately authorized.

Before any merge claim:

- full test suite passes
- production build passes
- Cloudflare/OpenNext artifact verification passes where applicable
- Wrangler remains dry-run only unless separately authorized
- scope audit confirms no production Supabase DDL/provider/billing changes

## 28. Explicit Non-Goals for Phase 4

Phase 4 does not include:

- production cloud schema rollout
- full Run History management UI
- advanced search over run records
- compare mode
- bulk export
- Prompt Builder
- Prompt Versioning
- Mission Control analytics
- multi-user collaboration
- billing
- vector search or embeddings
- scheduled/agentic prompt execution

These are intentionally deferred to Phases 5–7 or later approved work.

## 29. Success Criteria

Phase 4 is successful when:

1. A user can enter Full-screen Run Mode from the supported prompt flow.
2. Every execution is represented by a durable local run record before network execution begins.
3. Streaming output appears live and is checkpointed without writing IndexedDB on every token.
4. Stop, failure, and interruption preserve recoverable partial output.
5. Retry/Regenerate produce new linked runs rather than overwriting history.
6. Saved Result creation produces a complete immutable snapshot.
7. Cloud failure never causes local run data loss or blocks local browsing/editing.
8. Conflict handling never silently overwrites local data.
9. The feature can be disabled cleanly with its feature flag.
10. Existing Prompt.OS regressions, accessibility expectations, and the 80 built-in prompt catalog remain intact.

## 30. Next Gate

After the user reviews and approves this written spec, the next allowed step is to create the detailed Phase 4 implementation plan using the project planning workflow.

Implementation must not begin from this design document alone.

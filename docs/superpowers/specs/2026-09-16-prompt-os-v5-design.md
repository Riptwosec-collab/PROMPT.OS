# Prompt.OS V5 Design

Date: 2026-09-16
Status: Proposed for implementation
Repository: `Riptwosec-collab/PROMPT.OS`

## 1. Purpose

Prompt.OS V5 upgrades the existing Prompt.OS application from a single large prompt-management screen into a modular AI prompt operating system. The design preserves the current prompt library, the 30 newly added catalog prompts, TH/EN language support, versions, trash, Cloudflare deployment, Supabase authentication, and OpenAI execution while adding the approved V5 capabilities:

- Cloud-first automatic synchronization
- Prompt Evaluation Lab
- AI Improve Prompt
- Workspace V2
- Global Command Palette
- Variables V2
- Cost & Usage Center
- A new Liquid Glass + Futuristic HUD visual system

V5 is an incremental evolution of the current application, not a rewrite.

## 2. Approved Product Decisions

### 2.1 Architecture

Use a modular architecture. `components/PromptOS.jsx` becomes an app-level orchestration shell instead of continuing to own most domain logic and UI.

Target module boundaries:

```text
components/
  shell/
  prompts/
  workspace/
  evaluation/
  analytics/
  command/
  sync/

lib/
  sync/
  evaluation/
  variables/
  analytics/
  workspace/
  ai/
```

Each subsystem should expose a small public interface and keep implementation details internal.

### 2.2 Cloud Model

Supabase is the source of truth for authenticated users. Local browser storage is a cache, offline workspace, and recovery safety net.

Cloud-first does not mean silent destructive overwrite. The sync engine must combine:

- cloud authority
- local snapshots before overwrite
- revision checking
- offline operation queueing
- recovery history
- realtime invalidation/update events

### 2.3 Visual Direction

Use a hybrid of Apple-style Liquid Glass and Prompt.OS futuristic HUD styling:

- dark layered navy/black background
- translucent glass surfaces
- cyan as the primary HUD accent
- violet as the secondary accent
- subtle ambient grid and glow
- restrained animation
- clear typography and contrast
- reduced-motion support

The design must feel premium and futuristic without sacrificing readability or GPU performance.

## 3. Current-State Constraints

The current app has a single client entry point that dynamically loads `PromptOS.jsx` and wraps it in `LanguageRuntime`. The current `PromptOS.jsx` owns database normalization, prompt upgrades, versions, builder state, analytics, prompt health, collections, variables, and most UI behavior.

Current cloud state is stored as one JSONB document per authenticated user in `public.prompt_os_state`, with explicit RLS ownership policies. The browser client provides manual push and pull operations.

V5 must preserve compatibility with this state long enough to migrate safely.

## 4. Application Shell

### 4.1 Desktop Layout

```text
+------------------------------------------------------------+
| PROMPT.OS V5 | Workspace | Command | TH/EN | Cloud | User |
+--------------+---------------------------------------------+
| Home         |                                             |
| Library      |                                             |
| Workspaces   |                Active Page                  |
| Lab          |                                             |
| Improve      |                                             |
| Analytics    |                                             |
| Cloud        |                                             |
| Trash        |                                             |
| Settings     |                                             |
+--------------+---------------------------------------------+
| Cloud status | revision | pending changes | app version    |
+------------------------------------------------------------+
```

The sidebar can collapse to an icon rail and should remember the user's choice.

### 4.2 Mobile Layout

Do not shrink the desktop three-column layout. Use a mobile-native structure:

- bottom glass dock: Home / Library / New / Lab / More
- inspectors and settings as bottom sheets
- one primary content column
- sticky context actions where needed

### 4.3 App-Level Status

The shell owns a shared status model:

```text
IDLE
LOADING
READY
SYNCING
OFFLINE
ERROR
RECOVERING
```

Cloud UI examples:

```text
CLOUD LIVE
SYNCING...
OFFLINE
SYNC FAILED
RECOVERED
```

## 5. Home: Mission Control

The Home page becomes a command center rather than a prompt list.

Primary areas:

- Quick Launch: recent, favorite, and pinned prompts
- Cloud Pulse: connection, revision, pending changes, last sync
- AI Usage: runs, tokens, estimated cost
- Prompt Health: prompts needing improvement
- Recent Activity
- Evaluation Pulse
- Workspace Overview

Primary calls to action:

- New Prompt
- Command Palette

The ambient background may respond subtly to pointer movement on desktop, but must pause or reduce when hidden or when reduced motion is requested.

## 6. Library V5

The Library must remain usable with 1,000+ prompts.

### 6.1 Views

- Grid
- Compact List

### 6.2 Filters

- All
- Favorites
- Pinned
- Archived
- Workspace
- Folder
- Tags
- Prompt health
- Provider/model usage
- Cost threshold
- Modified date

### 6.3 Search Fields

Search indexes:

- title
- description
- tags
- workspace
- folder
- prompt body
- variables

Search results should be normalized and debounced instead of rescanning arbitrary objects on every keystroke.

### 6.4 Bulk Actions

- move workspace/folder
- add/remove tag
- favorite
- pin
- archive
- soft delete

Permanent delete remains a destructive action with two confirmations.

## 7. Workspace V2

### 7.1 Hierarchy

```text
Workspace
  -> Folder
     -> Prompt
```

A prompt belongs to one primary workspace and may belong to a folder. Smart collections and saved views are query-based and do not duplicate prompt data.

### 7.2 Workspace Operations

- create, rename, reorder workspace
- create, rename, reorder folder
- drag prompt between folders/workspaces
- archive workspace/folder where supported
- saved filters
- bulk move

### 7.3 Smart Views

Examples:

- Frequently Used
- Modified This Week
- Health < 4
- Cost > configured threshold

## 8. Prompt Detail and Inspector

Desktop uses three logical regions:

```text
Info | Prompt Editor | Inspector
```

Info includes title, workspace, folder, tags, compatible models, and metadata.

Inspector includes prompt health, version, run count, cost, and recent execution metadata.

Primary actions:

```text
RUN | IMPROVE | COPY | TEST | VERSION | MORE
```

## 9. Variables V2

### 9.1 Variable Schema

A prompt variable is no longer only a detected placeholder. It can carry structured configuration:

```json
{
  "topic": {
    "type": "text",
    "required": true,
    "label": "หัวข้อ",
    "placeholder": "เช่น Cloud Security"
  },
  "language": {
    "type": "select",
    "options": ["Thai", "English"],
    "default": "Thai"
  }
}
```

### 9.2 Supported Types

- text
- textarea
- number
- select
- multi-select
- toggle
- date
- URL

### 9.3 Supported Configuration

- required
- default
- label
- placeholder
- options
- validation metadata where appropriate

### 9.4 Rendering

The runtime generates a form from the variable schema. Empty values preserve the original `{{variable}}` placeholder unless a field explicitly defines replacement behavior.

## 10. AI Improve Prompt

AI Improve never silently replaces the current prompt.

Flow:

```text
Analyze
-> Generate suggestion
-> Show Original vs Improved
-> Show diff
-> User chooses action
```

Actions:

- Discard
- Copy
- Save as New Version

Evaluation areas include:

- role
- context
- explicit task
- requirements
- constraints
- output format
- examples
- variable usage

The existing prompt-health concept remains useful as a deterministic heuristic layer and should be extracted from the monolith into a reusable module.

## 11. Evaluation Lab

### 11.1 Core Concepts

- Evaluation Suite
- Test Case
- Candidate Prompt Version
- Evaluation Run
- Result
- Rubric

### 11.2 User Flow

1. Create or select an evaluation suite.
2. Add test cases.
3. Select two or more candidate prompt versions.
4. Configure evaluation rubric.
5. Review estimated call count, token usage, and estimated cost.
6. Run evaluation.
7. Inspect raw outputs and metrics.

### 11.3 Rubric Examples

- Accuracy
- Completeness
- Structure
- Tone
- Constraint compliance

The application must not invent an overall winner without a configured evaluation method. It may display measured metrics and rubric scores according to user-defined criteria.

### 11.4 Pre-Run Estimate

Before batch execution, display:

- number of test cases
- number of candidates
- number of model calls
- estimated tokens
- estimated cost

If the run crosses the user's budget warning threshold, show a warning. A hard block happens only when the user has enabled a Hard Budget Limit.

## 12. Cost & Usage Center

### 12.1 Raw Usage Event

Each AI run records:

```text
provider
model
prompt_id
prompt_version_id
evaluation_run_id
input_tokens
output_tokens
latency_ms
estimated_cost
status
error_code
created_at
```

### 12.2 Dashboard Metrics

- runs
- input/output tokens
- estimated cost
- latency
- error rate
- provider/model distribution
- most expensive prompts
- daily/monthly trends

Filters:

- Today
- 7 days
- 30 days
- Custom
- Provider
- Model
- Workspace
- Prompt

### 12.3 Pricing Snapshots

Pricing is versioned:

```text
provider
model
input_price
output_price
effective_from
```

A historical run keeps the pricing snapshot used at the time. Historical cost is not silently recalculated when provider pricing changes.

The UI labels this metric as `Estimated Cost`.

### 12.4 Aggregates

Do not rebuild the entire dashboard from raw events on every render. Maintain or query aggregates such as:

- daily_runs
- daily_tokens
- daily_cost
- model_usage
- prompt_usage

Raw events remain available for drill-down.

## 13. Command Palette

Shortcut:

```text
Ctrl/Cmd + K
```

The palette combines navigation, commands, and prompt search.

Initial commands:

- New Prompt
- Search Library
- Improve Current Prompt
- Open Evaluation Lab
- Force Cloud Sync
- Switch Workspace
- Switch Language
- Open Trash

Typing a prompt title and pressing Enter should open it directly.

### 13.1 Keyboard Shortcuts

Initial set:

```text
Ctrl/Cmd + K   Command Palette
N              New Prompt
/              Search
R              Run Current Prompt
E              Edit
C              Copy
F              Favorite
Ctrl/Cmd + S   Save
Esc            Close Panel/Modal
?              Keyboard Shortcuts
```

Non-modifier shortcuts must not interfere with normal typing inside inputs, editors, textareas, or select controls.

## 14. Cloud-First Sync Architecture

### 14.1 Authority

For authenticated users, Supabase is authoritative.

Local storage serves as:

- immediate write cache
- offline cache
- offline mutation queue
- recovery snapshot storage where needed

### 14.2 Revision Model

Do not use client timestamps alone to determine authority.

Example:

```text
Cloud revision: 184
Local base revision: 184
User edits
Local mutation pending
Sync checks revision
If 184 == 184 -> write -> cloud revision 185
```

If another client advances cloud revision first:

```text
Local base: 184
Cloud: 185
```

Then:

1. Snapshot unsynced local state.
2. Pull cloud revision 185.
3. Apply cloud as authoritative state.
4. Preserve local unsynced work in recovery history.
5. Notify the user that recovery data exists.

### 14.3 Autosave

- local save: immediate
- cloud save: debounced, target roughly 800-1500 ms after the last relevant edit

UI states:

```text
EDITING
SAVING...
SAVED
```

### 14.4 Offline Queue

Queue item shape:

```json
{
  "operation": "update_prompt",
  "entityId": "...",
  "baseRevision": 185,
  "createdAt": "..."
}
```

When connectivity returns:

1. Fetch current cloud revision.
2. Validate queued operations against base revision.
3. Apply safe operations.
4. Preserve rejected/stale operations in recovery history.
5. Clear only successful operations.

### 14.5 Realtime

Use Supabase Postgres Changes for authenticated, RLS-protected user data where appropriate.

V5 should subscribe only to data required for the active user/session and should avoid treating Realtime as a replacement for revision checking.

### 14.6 Delete Model

Normal delete is soft delete:

```text
deleted_at = timestamp
```

This improves trash/restore behavior and avoids relying on DELETE-event filtering.

Permanent purge is allowed only from explicit destructive flows such as Empty Trash or Delete Permanently.

## 15. Supabase V5 Data Model

The target model is normalized enough to support workspaces, versions, evaluation, usage, sync, and backups.

```text
auth.users
  -> prompt_os_user_settings
  -> prompt_os_workspaces
       -> prompt_os_folders
            -> prompt_os_prompts
                 -> prompt_os_prompt_versions
  -> prompt_os_evaluation_suites
       -> prompt_os_evaluation_cases
       -> prompt_os_evaluation_runs
            -> prompt_os_evaluation_results
  -> prompt_os_usage_events
  -> prompt_os_snapshots
  -> prompt_os_sync_meta
```

### 15.1 Prompt Record

Core fields include:

```text
id
user_id
workspace_id
folder_id
title
description
favorite
pinned
archived_at
deleted_at
current_version_id
created_at
updated_at
```

### 15.2 Prompt Version

Core fields include:

```text
id
prompt_id
version
body
variable_schema JSONB
change_note
created_at
```

### 15.3 Sync Metadata

Track at minimum:

- user ownership
- cloud revision
- migration version
- last successful sync
- schema version

### 15.4 Snapshots

Snapshot fields:

```text
id
user_id
reason
schema_version
revision
payload
created_at
```

Keep the latest 20 snapshots per user in the initial V5 release unless production usage indicates another retention policy is needed.

Snapshots are created before:

- cloud overwrite
- import
- bulk delete
- empty trash
- schema migration
- restore operation

## 16. Supabase Security Requirements

Every user-owned table exposed through the Data API must:

- explicitly grant only required privileges
- enable RLS
- use ownership policies tied to `auth.uid()`
- use both `USING` and `WITH CHECK` for UPDATE policies

Typical ownership pattern:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

Frontend code must use only a Supabase publishable/anon-compatible public key. Service-role or secret keys must never be shipped to the browser.

After schema changes:

- run Supabase Security Advisor
- run Supabase Performance Advisor
- verify user A cannot read or modify user B data
- verify unauthenticated access is rejected where required

## 17. V4 -> V5 Migration

Migration is non-destructive.

Flow:

```text
Detect whether V5 data exists
-> Read legacy prompt_os_state when needed
-> Create legacy snapshot
-> Import into normalized V5 tables
-> Verify counts and relationships
-> Mark migration complete
```

Do not delete `prompt_os_state` during V5.0. Keep it as a fallback until the migration has been proven in production.

Verification includes:

- prompt count
- version count
- current version references
- workspace/folder references
- variables
- favorites/pins
- trash state
- catalog prompts

If verification fails, abort migration completion and keep V4 data untouched.

## 18. Backup and Recovery Center

The Cloud & Backups screen provides:

- current sync state
- cloud revision
- pending changes
- last successful sync
- backup history
- preview snapshot
- restore snapshot

Restoring over current cloud state is destructive and requires two confirmations. A fresh snapshot is created before restore.

## 19. Error Handling

### 19.1 App Boundary

Provide an app-level error boundary and module-level fallbacks.

Example module failure UI:

```text
MODULE ERROR
Evaluation Lab could not load.
[Retry] [Return Home] [Copy Diagnostic]
```

Diagnostics must never display access tokens, API keys, or secrets.

### 19.2 AI Run Failure

Failed runs remain visible in history and record:

```text
status = failed
error_code
error_message
provider
model
created_at
```

Actions:

- Retry
- Copy Error
- Open Details

## 20. Performance Requirements

### 20.1 Lazy Modules

Lazy-load heavy modules such as:

- Evaluation Lab
- Analytics
- Backup History

### 20.2 Client Performance

- memoize derived analytics
- debounce global search
- debounce cloud writes
- virtualize or paginate long prompt lists
- avoid recomputing prompt health on unrelated renders
- cancel stale AI operations when possible
- reduce/pause animation when page is hidden

### 20.3 Scale Target

The initial design should remain responsive with approximately:

- 1,000+ prompts
- several thousand prompt versions
- several thousand usage events

This is a design target, not a substitute for benchmarking.

## 21. Accessibility Requirements

- full keyboard navigation for primary flows
- visible focus states
- semantic buttons and controls
- `aria-label` where visual labels are insufficient
- modal focus trapping
- Escape-to-close where appropriate
- readable contrast
- status includes text/icon, not color alone
- `prefers-reduced-motion` support
- mobile touch targets sized appropriately

## 22. Visual System

### 22.1 Tokens

Use CSS design tokens instead of scattering hard-coded color values through components.

Conceptual tokens:

```text
background: near-black / deep navy
glass: translucent navy
primary accent: cyan
secondary accent: violet
success: emerald
warning: amber
danger: red
```

### 22.2 Glass Use

Use glass treatment on:

- app shell
- top bar
- sidebar/dock
- cards
- modals
- floating panels

Avoid multiple nested blur layers on every element.

### 22.3 Motion

Use:

- subtle page transitions
- active-state glow
- low-cost transform/opacity hover effects
- sync pulse
- modal depth/scale

Avoid continuous heavy animation across all cards.

## 23. Internationalization

All new V5 surfaces must ship with TH/EN support at the same time.

Do not create English-only V5 modules that depend on a later translation pass.

The V5 work may continue to use the current runtime translation strategy during migration, but newly extracted components should increasingly favor explicit semantic message keys so user-generated text is never confused with UI text.

## 24. Feature Flags and Rollout

Initial feature flags:

```text
V5_WORKSPACE
V5_SYNC
V5_EVALUATION
V5_ANALYTICS
```

These flags allow code to merge without exposing incomplete subsystems.

### 24.1 Rollout Phases

Phase 1:
- V5 Shell
- Visual System
- Command Palette

Phase 2:
- Workspace V2
- Variables V2

Phase 3:
- Cloud-first Sync
- Backups
- V4 migration path

Phase 4:
- AI Improve
- Evaluation Lab

Phase 5:
- Cost & Usage Center

Phase 6:
- Performance tuning
- Accessibility polish
- Mobile polish

All phases must follow the same V5 architecture from the beginning.

## 25. Destructive Action Rules

Two-step confirmation is mandatory for:

- permanent delete
- empty trash
- restore snapshot over current cloud data
- bulk permanent delete

Large destructive operations create a snapshot before execution.

Soft-delete operations do not need the same permanent-delete wording because they are recoverable from Trash.

## 26. Testing Strategy

### 26.1 Unit Tests

Cover:

- sync revision decisions
- offline queue
- variable schema rendering and validation
- workspace movement/reordering
- cost calculation
- evaluation scoring
- command palette command resolution
- prompt health extraction

### 26.2 Data Contract Tests

Cover:

- V4 -> V5 migration
- snapshot creation/restore
- soft delete/restore
- cloud revision mismatch
- recovery path for unsynced local changes

### 26.3 Security Tests

Verify:

- user A cannot read user B rows
- user A cannot update user B rows
- unauthenticated users cannot access protected V5 tables
- update policies enforce ownership in both `USING` and `WITH CHECK`

### 26.4 UI/Accessibility Tests

Cover:

- TH/EN coverage for V5 UI
- keyboard navigation
- command palette shortcuts
- modal focus and Escape behavior
- reduced motion
- mobile layout smoke tests

### 26.5 Build Verification

Before merge:

```text
npm test
OpenNext Cloudflare build
verify .open-next/worker.js
verify .open-next/assets
wrangler deploy --dry-run
```

### 26.6 Definition of Done

A V5 subsystem is complete only when all relevant checks pass:

- unit tests
- migration/data contract tests
- RLS/security tests
- TH/EN coverage
- keyboard accessibility
- mobile layout
- offline scenario where relevant
- cloud revision scenario where relevant
- application tests
- OpenNext build
- Wrangler dry run

## 27. Non-Goals for V5.0

The following are explicitly out of scope unless separately approved:

- full rewrite to a different frontend framework
- real-time multi-user collaborative editing of the same prompt
- organization/team RBAC beyond single-user ownership
- public prompt marketplace
- billing/subscriptions
- automatic permanent deletion of old legacy V4 state
- model-provider expansion beyond work separately approved for the AI execution layer

## 28. Implementation Principles

1. Preserve existing data before improving structure.
2. Keep subsystem boundaries small and testable.
3. Prefer deterministic state transitions over timestamp guessing.
4. Never silently destroy local unsynced work.
5. Never let visual effects compromise readability or interaction speed.
6. Ship TH/EN support with every new surface.
7. Keep security and RLS verification part of feature completion, not a later cleanup.
8. Use feature flags to stage incomplete subsystems safely.

## 29. Success Criteria

Prompt.OS V5 succeeds when a signed-in user can:

- organize prompts into scalable workspaces and folders
- use typed prompt variables
- find commands and prompts instantly from the command palette
- edit offline without losing work
- return online and synchronize safely with a cloud-authoritative state
- inspect and recover backups
- improve prompts without overwriting originals
- evaluate prompt versions against explicit test cases and rubrics
- understand token usage, latency, failures, and estimated cost
- use the application comfortably in Thai or English
- use the application across desktop, tablet, and mobile with a consistent premium visual system

while all existing V4 prompt data remains recoverable through the migration period.
# Prompt.OS V5 Complete Upgrade Design

Date: 2026-09-17
Status: Approved design, pending implementation plan
Base branch: `main`
Base commit: `332f96e8bfa73303a5e571caae0f554d1b14b6e7`

## 1. Purpose

Upgrade Prompt.OS from a prompt library with 80 built-in prompts and partial V5 foundations into a modular prompt operating environment that supports discovery, structured prompt execution, prompt improvement, evaluation, analytics, workspaces, cloud synchronization, and sequential workflows.

The rollout must be incremental, reversible, backward-compatible, and safe for the existing prompt catalog and user state.

## 2. Approved Product Decisions

The following decisions are locked for this scope:

1. Use phased rollout rather than a big-bang replacement.
2. Keep the current Legacy Library available as a temporary fallback until V5 meets retirement criteria.
3. OpenAI remains the only live AI provider during this rollout.
4. Claude and Gemini receive provider adapters, settings, and UI readiness, but remain disabled until separately configured and enabled.
5. Supabase schema and migrations are prepared in the repository but are not applied to production during implementation without an explicit later command.
6. Workflow V1 is sequential only.
7. Multi-call operations use a Cost Guard with estimates, warnings, and optional user-enabled hard limits.
8. Feature implementation is split across multiple reviewable pull requests.
9. Merge and production deployment are separate actions; neither is automatic.

## 3. Current Constraints

The current repository already contains:

- 80 built-in prompts: 30 existing prompts plus 50 researched production-ready prompts.
- Thai and English prompt metadata.
- Variable metadata for researched prompts.
- `LanguageRuntime` localization support.
- `/api/ai/run` for OpenAI streaming execution.
- V5 feature flag foundations.
- Cloud sync and shell-related components in partial form.
- A large `components/PromptOS.jsx` monolith that should be reduced gradually rather than rewritten wholesale.

The design must preserve user-created prompts and mutable user state including favorites, pinned status, ratings, collections, variables, versions, results, run history, and timestamps where currently present.

## 4. Non-Goals

The following are intentionally out of scope for this rollout:

- Live Claude API execution.
- Live Gemini API execution.
- Prompt marketplace.
- Team collaboration, RBAC, or shared workspaces.
- Real-time multi-user editing.
- Cloud file storage.
- Branching or parallel workflow execution.
- Native mobile applications.
- Automatic application of production Supabase migrations.
- Automatic production deployment.

These must remain possible future additions without requiring a redesign of the execution or data boundaries defined here.

## 5. Architecture Overview

Prompt.OS V5 is organized around five service boundaries:

1. Prompt and workspace data services.
2. Search and discovery services.
3. Unified execution and provider services.
4. Evaluation, telemetry, analytics, and cost services.
5. Local-first synchronization and workflow services.

High-level flow:

```text
Home / Library / Workspace / Command Palette
                    |
              Prompt Detail
                    |
             Variables V2
                    |
            Execution Engine
                    |
      +-------------+-------------+
      |             |             |
   Prompt        Improve      Evaluation
      |                           |
      +-------------+-------------+
                    |
               Cost Guard
                    |
             Provider Layer
          +---------+---------+
        OpenAI    Claude     Gemini
         LIVE     READY      READY
                    |
                Telemetry
                    |
          Analytics / History

Workspace / Prompts / Versions / Workflows / Evaluations / Settings
                    |
           Local-first Sync Engine
                    |
                 Supabase

Legacy Library shares the same local data state and remains a fallback
until V5 retirement criteria are satisfied.
```

## 6. Modularization Strategy

Do not rewrite `PromptOS.jsx` in one pass. Extract only boundaries required by each phase.

Target organization:

```text
components/
  prompt/
    PromptDetailV2
    PromptVariableForm
    PromptHealth
    PromptSearch
    PromptPacks
  workspace/
    WorkspaceSidebar
    FolderTree
    SmartCollections
  command/
    CommandPalette
  improve/
    ImprovePanel
    PromptDiff
  evaluation/
    EvaluationLab
    TestCaseEditor
    EvaluationResults
  workflow/
    WorkflowBuilder
    WorkflowRunner
    WorkflowRunDetail
  analytics/
    UsageDashboard
    CostGuard

lib/
  search/
  execution/
  providers/
  improve/
  evaluation/
  workflow/
  telemetry/
  sync/
  workspace/
```

The exact file names may follow repository conventions, but boundaries should remain equivalent.

## 7. Prompt Data Model V2

Prompt records extend the existing model without breaking legacy data.

Representative shape:

```text
Prompt
  id
  name
  displayTitle
  displayTitleTh
  description
  descriptionTh
  category
  categoryTh
  subcategory
  tags[]
  collections[]
  workspaceId
  folderId
  prompt
  variables{}
  variableConfig{}
  usageGuideEn
  usageGuideTh
  sampleInput
  exampleOutput
  favorite
  pinned
  rating
  runs
  copyCount
  lastUsedAt
  versions[]
  healthScore
  catalogManaged
  createdAt
  updatedAt
  deletedAt
  schemaVersion
```

Rules:

- Catalog-managed updates must not overwrite mutable user state.
- A prompt remains globally discoverable even when assigned to a workspace or folder.
- Moving a prompt must not duplicate it.
- Version history must remain intact across migrations.
- `deletedAt` is the default deletion mechanism for sync-aware entities.

## 8. Variables V2

Prompt variables become typed structured inputs rather than requiring users to edit placeholders directly.

Supported field types:

- `text`
- `textarea`
- `number`
- `select`
- `multi-select`
- `boolean`
- `date`
- `url`
- `code`
- `language`
- `file`

Each variable supports:

- name
- localized label
- type
- required flag
- default value
- options where applicable
- validation rules where applicable

Requirements:

- Required fields block execution when missing.
- Optional fields do not block execution.
- `language` defaults to Thai where the catalog defines it.
- File variables remain local-only by default and are not silently synced.
- Rendered prompt preview clearly identifies unresolved required placeholders.

### Variable Presets

Users may save named presets per prompt. Presets prefill variable values without modifying the prompt template.

## 9. Prompt Detail V2

Desktop uses a responsive three-region layout:

1. Prompt metadata and health.
2. Structured input form.
3. Rendered prompt, execution status, and result.

Primary actions:

- Run
- Improve
- Copy
- Favorite
- Pin
- More

Secondary actions under More:

- Edit
- Duplicate
- Move to Folder
- Add to Pack
- Version History
- Evaluation
- Archive

Mobile uses stacked or tabbed sections:

- Overview
- Inputs
- Preview
- Result

The UI must preserve entered variables if execution fails.

## 10. Prompt Health V2

Prompt Health is computed locally before any AI call.

Scoring categories:

- Structure
- Context
- Variables
- Constraints
- Output format
- Reliability / missing-data handling

The UI shows category-level detail and specific improvement opportunities. It must not present an unexplained opaque score.

## 11. Search V2

Search operates over a local weighted index suitable for the current catalog scale.

Suggested ranking weights:

```text
Prompt title       10
Thai title         10
Prompt name         9
Tags                8
Category            7
Subcategory         7
Description         5
Variables           4
Prompt content      2
Usage guide         1
```

Searchable sources include:

- English and Thai titles.
- Descriptions.
- Category and subcategory.
- Tags.
- Variable names and labels.
- Prompt body.
- Usage guidance.
- Collections and packs.

Filters include:

- Favorites
- Recent
- Popular
- Category
- Difficulty
- Source
- Has Variables

Target search response for the current 80-prompt catalog is under 100 ms on a normal client device.

## 12. Smart Collections and Prompt Packs

### Smart Collections

Computed dynamically from state:

- Favorites
- Pinned
- Recently Used
- Most Used
- Recently Added
- Advanced
- Has Variables
- Quick Prompts

### Prompt Packs

Prompt Packs are curated groups and differ from folders.

Initial examples:

- Network Engineer Pack
- Research Pack
- Developer Pack
- Productivity Pack

A prompt may belong to multiple packs without duplication.

## 13. Workspace and Folder V2

A workspace contains folders that reference prompts rather than clone them.

Representative hierarchy:

```text
My Workspace
  Network
    Troubleshooting
    Cisco
    Change Plans
  Development
    Code Review
    API
    Database
  Personal
    Finance
    Learning
```

Workspace sharing is not part of this rollout.

## 14. Command Palette

Global shortcut:

- `Ctrl+K` on Windows/Linux.
- `Cmd+K` on macOS.

The palette searches and navigates:

- Prompts
- Folders
- Workspaces
- Packs
- Workflows
- Settings
- Application commands

Supported actions include open, run, copy, pin, create prompt, create folder, open Evaluation Lab, create workflow, sync now, and open analytics.

Additional shortcuts:

- `Ctrl/Cmd+Enter`: run current prompt.
- `Ctrl/Cmd+S`: save.
- `Ctrl/Cmd+Shift+C`: copy rendered prompt.
- `Esc`: close dialog or stop the relevant modal action.

Command Palette must be fully keyboard accessible.

## 15. Unified Execution Engine

All AI calls from Prompt Run, AI Improve, Evaluation, and Workflow pass through one execution boundary.

Flow:

```text
Request
  -> Validation
  -> Cost Guard
  -> Provider Adapter
  -> Streaming / Completion
  -> Normalized Result
  -> Telemetry
```

Representative run record:

```text
ExecutionRun
  id
  type: prompt | improve | evaluation | workflow
  promptId
  promptVersion
  provider
  model
  input
  renderedPrompt
  status
  startedAt
  finishedAt
  latencyMs
  inputTokens
  outputTokens
  estimatedCost
  actualCost
  error
```

Statuses:

- queued
- running
- completed
- failed
- cancelled

Normal prompt execution should stream where supported.

## 16. Provider Layer

Common provider contract:

```text
run({
  model,
  messages,
  temperature,
  maxTokens,
  stream
})
```

Provider states during this rollout:

- OpenAI: enabled and live.
- Claude: adapter-ready, disabled.
- Gemini: adapter-ready, disabled.

Requirements:

- No silent fallback to another provider.
- Missing provider configuration produces a visible actionable error.
- Provider secrets never enter the browser bundle.

## 17. Retry and Cancellation

Automatic retry is limited to transient failures such as:

- HTTP 429.
- HTTP 502/503.
- Network timeouts.

Maximum automatic retries: 2, using exponential backoff.

Do not automatically retry invalid requests, missing keys, unsupported models, or context overflow.

Cancellation preserves completed output where practical and records run status as `cancelled`.

## 18. AI Improve V2

AI Improve compares the current prompt with an improved proposal.

Selectable goals include:

- Clarity
- Reliability
- Better variables
- Better output format
- Shorter prompt
- Lower token use
- Stronger reasoning structure

Output includes:

- Improved prompt.
- Structured list of changes.
- Any relevant variable changes.

Actions:

- Discard
- Copy
- Save as Draft
- Save as New Version

AI Improve never overwrites the current version automatically.

It may use prompt text, variable configuration, output format, usage guide, and local health report. It must not send unrelated workspace data or secrets.

## 19. Evaluation Lab V2

Evaluation compares prompt versions or prompt variants over saved test cases.

Modes:

### Manual

Users rate outputs themselves.

### Rule-Based

Examples:

- Required sections present.
- Valid JSON.
- Required keyword present.
- Forbidden text absent.
- Maximum length.

### AI Judge

A model evaluates output against a user-visible rubric.

AI Judge results must be labeled as AI-generated evaluation and are not ground truth.

Metrics may include:

- Completeness
- Structure
- Instruction adherence
- Rubric-defined quality
- Latency
- Input tokens
- Output tokens
- Estimated cost
- Error rate

Evaluation suites are reusable regression suites that can run against new prompt versions.

## 20. Cost Guard

Single normal prompt runs do not require additional confirmation.

Multi-call actions such as Evaluation and Workflow show a pre-run estimate:

- Number of API calls.
- Estimated input tokens.
- Estimated output tokens.
- Estimated total cost.

Budget settings:

- Monthly warning threshold.
- Warning percentage.
- Optional hard limit, disabled by default.

Warnings do not block execution. Hard limits block new calls only when explicitly enabled by the user.

Context overflow must never be handled by silent truncation of important input. The UI reports the context estimate and asks the user to reduce input when required.

## 21. Telemetry and Analytics

Usage telemetry stores operational metadata by default rather than full prompt/output content.

Usage event fields:

- promptId
- feature
- provider
- model
- inputTokens
- outputTokens
- latency
- cost
- status
- timestamp

Execution result storage is separate from analytics events.

Dashboard metrics include:

- Run count.
- Token usage.
- Estimated cost.
- Average latency.
- Success rate.
- Feature breakdown.
- Prompt breakdown.
- Model breakdown.
- Daily, weekly, and monthly trends.
- Most expensive runs.
- Budget status.

If billing reconciliation is unavailable, cost must be labeled `Estimated Cost`, not actual cost.

Analytics write failures must not cause successful AI runs to fail.

## 22. Sequential Workflow V1

Workflow V1 runs steps in order only.

Example:

```text
Workflow Input
  -> Deep Research
  -> Fact Checker
  -> Decision Memo Builder
  -> Final Output
```

Each step supports:

- Prompt and prompt version.
- Model.
- Variables.
- Input mapping.
- Output alias.
- Retry policy.
- Continue-on-failure setting.

Default `continueOnFailure` is false.

Input sources:

- Workflow input.
- Previous step output.
- A specific earlier step.
- Static text.
- Workflow variable.

Workflow runner capabilities:

- Show per-step state.
- Stop current workflow.
- Preserve completed steps.
- Retry failed step without re-running completed prior steps.
- Edit failed-step input before retry.
- Track tokens, cost, latency, and status per step.
- Save run history and workflow version.

Workflow execution always passes through the shared Execution Engine and Cost Guard.

## 23. Local-First Cloud Sync

Client-side state is authoritative for immediate UX; synchronization happens asynchronously.

Flow:

```text
Local mutation
  -> save locally
  -> enqueue sync operation
  -> background sync
  -> Supabase
```

Visible states:

- Synced
- Syncing
- Offline with queued changes
- Conflict
- Backend not configured

Cloud UI must never claim `Synced` when the backend or schema is unavailable.

### Sync Scope

Sync-eligible data:

- Prompts
- Prompt versions
- Favorites
- Pinned state
- Folders
- Workspaces
- Collections
- Variable presets
- Prompt packs
- Workflows
- Evaluation suites
- Settings

Usage telemetry may sync through a separate event path.

### Excluded by Default

Do not sync automatically:

- API keys.
- Provider secrets.
- Temporary local files.
- Raw credentials.

## 24. Sync Conflict Handling

Concurrent edits must not silently overwrite each other.

Conflict UI offers:

- Keep Local
- Keep Cloud
- Save Both

Prompt conflicts should provide a diff view where feasible.

Prompt versions are immutable after creation. New edits create new versions, reducing conflict risk and improving rollback safety.

## 25. Deletion and Recovery

Sync-aware entities use soft deletion with `deletedAt` before hard deletion.

Manual backup functions:

- Export Backup
- Import Backup

Risky local migrations create a recovery snapshot before replacement.

## 26. Supabase Repository Schema

Repository migrations prepare tables approximately equivalent to:

```text
workspaces
folders
prompts
prompt_versions
prompt_variable_presets
prompt_packs
prompt_pack_items
workflows
workflow_steps
evaluation_suites
evaluation_cases
execution_runs
usage_events
sync_operations
```

Migrations are split by concern and phase, for example:

```text
001_workspace.sql
002_prompt_versions.sql
003_evaluation.sql
004_usage_events.sql
005_workflows.sql
006_sync.sql
```

Exact numbering must follow current migration history.

Production application of these migrations is outside implementation authorization for this scope.

## 27. Database Hardening Requirements

Before production application, migrations must be reviewed for:

- Foreign keys.
- `ON DELETE` behavior.
- RLS.
- Ownership.
- Browser grants.
- Usage-event immutability.
- Nullable foreign key behavior.

Usage events should allow normal insertion but restrict arbitrary browser-side update and delete unless explicitly required.

Cloud-owned records must be scoped to `user_id` under RLS.

## 28. Security Boundaries

### Secrets

The browser bundle must never contain:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

AI execution remains browser -> Prompt.OS server API -> provider.

### Prompt / Data Boundary

User-provided content and previous workflow outputs are treated as data, not privileged runtime policy.

Execution composition should maintain distinct boundaries between:

- System policy.
- Runtime instruction.
- Prompt template.
- User variables.

Workflow step output must not be allowed to replace system-level execution policy.

### File Variables

File variables are local-only by default and clearly labeled as not synced.

## 29. Migration Strategy

Local migrations are versioned and idempotent.

Process:

```text
Read old state
  -> detect schema version
  -> migrate missing fields into a copy
  -> validate migrated copy
  -> persist only if valid
  -> set schemaVersion
```

On validation failure, preserve the old state.

Catalog migration must retain mutable user state and all 80 built-in prompts.

## 30. Legacy Library Strategy

Legacy Library remains reachable during rollout and uses the same underlying local data state.

This avoids divergent stores such as `legacyPrompts` and `v5Prompts`.

When a V5 module is unstable, its feature flag can be disabled while Legacy remains usable.

Legacy is removed only through a later dedicated PR after retirement criteria are met.

## 31. Feature Flags

Feature flags are separated by subsystem rather than one global V5 switch.

Representative flags:

```text
V5_SEARCH
V5_PROMPT_DETAIL
V5_VARIABLES
V5_PROMPT_HEALTH
V5_SMART_COLLECTIONS
V5_EXECUTION_ENGINE
V5_AI_IMPROVE
V5_EVALUATION
V5_COST_GUARD
V5_PROVIDER_SELECTOR
V5_COMMAND_PALETTE
V5_WORKSPACE
V5_CLOUD_SYNC
V5_USAGE_ANALYTICS
V5_WORKFLOW
```

The exact flag registry may consolidate closely coupled flags where required, but rollback must remain granular by subsystem.

## 32. Rollout Phases

### Phase 0 — Foundation

- Extract shared services needed by later phases.
- Reduce `PromptOS.jsx` responsibility without changing behavior unnecessarily.
- Establish feature flags and shared data interfaces.

Gate: existing regression suite passes before feature work proceeds.

### Phase 1 — Core Experience

- Search V2.
- Prompt Detail V2.
- Variables V2 UI.
- Prompt Health V2.
- Smart Collections.
- Recent / Most Used.
- Prompt Packs.
- Workspace foundation.

### Phase 2 — AI Tools

- Unified Execution Engine.
- OpenAI provider adapter.
- Disabled-ready Claude adapter.
- Disabled-ready Gemini adapter.
- AI Improve V2.
- Evaluation Lab V2.
- Cost Guard.
- Telemetry foundation.

### Phase 3 — Power UX

- Command Palette.
- Keyboard shortcuts.
- Workspace and folder full UX.
- Prompt Packs integration.

### Phase 4 — Cloud, Analytics, Workflow

- Local-first Sync Engine.
- Offline queue.
- Conflict handling.
- Backup/export/import.
- Usage and Cost Analytics.
- Budget Dashboard.
- Sequential Workflow Builder and Runner.
- Workflow history and versions.

Supabase repository migrations may be completed here, but production DB remains untouched.

### Phase 5 — Stabilization

- Cross-feature regression.
- Desktop and mobile validation.
- Thai and English validation.
- Online and offline validation.
- Migration and backup recovery validation.
- Legacy compatibility validation.

## 33. Testing Strategy

### Unit Tests

Cover:

- Search ranking and Thai/English matching.
- Prompt Health scoring.
- Variable validation.
- Cost calculations.
- Workflow input mapping.
- Local migrations.
- Smart Collections.

### Integration Tests

Cover:

- Execution Engine.
- Provider adapter normalization.
- Cancellation and retry policy.
- Sync queue.
- Conflict detection.
- Evaluation modes.
- Analytics aggregation.
- Workflow sequencing and retry.

### UI Regression Tests

Cover at least:

- Prompt Detail V2.
- Command Palette.
- Workspace and folders.
- Evaluation Lab.
- Workflow Runner.
- Legacy fallback navigation.

### Catalog Regression Tests

Require:

- Exactly 80 built-in prompts unless an explicitly approved catalog change occurs.
- Unique prompt IDs / names as appropriate.
- Thai and English metadata preservation.
- Catalog migration preserving mutable user state.

## 34. CI Gate

Each implementation PR must run the repository's verified CI path, including at minimum:

- Test suite.
- Production build.
- OpenNext worker build where currently used.
- Wrangler dry-run / bundle validation where currently used.

No phase is considered ready when its required CI checks are failing.

## 35. Performance and Accessibility

### Performance

Heavy feature modules such as Evaluation Lab, Analytics, and Workflow Builder should be lazy-loaded.

Do not make initial Home loading depend on every V5 subsystem.

### Accessibility

Require:

- Keyboard navigation.
- Visible focus state.
- Proper labels.
- Modal focus management.
- Escape handling.
- Loading and disabled states.
- Usable contrast in the existing dark UI.

Workflow mobile UX uses an ordered step list rather than desktop-only drag-and-drop canvas interaction.

## 36. Error Recovery Principles

User work must survive recoverable failures.

Examples:

- AI provider failure preserves variables and prompt state.
- Sync failure preserves local state and queues retry.
- Analytics failure does not fail the AI result.
- Workflow failure preserves completed step results.
- Migration failure preserves previous storage.

## 37. Pull Request Strategy

Expected implementation sequence is approximately:

1. Foundation.
2. Search + Prompt Detail.
3. Variables + Prompt Health.
4. Workspace + Command Palette.
5. Execution Engine + provider layer.
6. AI Improve.
7. Evaluation Lab.
8. Analytics + Cost Guard.
9. Workflow.
10. Cloud Sync + migrations.
11. Stabilization.

The implementation plan may combine tightly related changes or split high-risk areas further, but PRs must remain reviewable and independently reversible.

Implementation PRs are created from the latest `main`, not from the design branch unless the design has first been merged or cherry-picked as appropriate.

## 38. Merge and Deployment Policy

Implementation work proceeds through feature branches and pull requests.

A completed PR is reported for review. It is not merged without explicit merge authorization.

Merging into `main` is not treated as proof of production deployment.

Production deployment is a separate action and requires verification of the repository's current deployment mechanism plus explicit authorization when an external deployment action is needed.

## 39. Acceptance Criteria

The complete approved upgrade is considered implemented when the repository contains working, tested versions of all of the following:

### Core

- Search V2.
- Prompt Detail V2.
- Variables V2.
- Prompt Health V2.
- Prompt Packs.
- Smart Collections.
- Recent / Most Used.

### Organization

- Workspace.
- Folders.
- Command Palette.

### AI

- Unified Execution Engine.
- Live OpenAI provider.
- Disabled-ready Claude adapter.
- Disabled-ready Gemini adapter.
- AI Improve.

### Evaluation

- A/B evaluation.
- Reusable test suites.
- Rule evaluator.
- AI Judge with provenance and AI-generated labeling.
- Evaluation history.

### Cost and Analytics

- Token tracking.
- Latency tracking.
- Estimated cost tracking.
- Budget warning.
- Optional hard limit.
- Analytics dashboard.

### Cloud

- Local-first sync engine.
- Offline queue.
- Conflict resolution.
- Backup export/import.
- Supabase migrations prepared in repository.
- Production database still unchanged unless separately authorized.

### Workflow

- Sequential Workflow Builder.
- Input mapping.
- Stop.
- Retry failed step.
- Cost estimate.
- Run history.
- Workflow versioning.

### Compatibility

- Existing 80 built-in prompts preserved.
- User mutable state preserved.
- Thai and English behavior preserved.
- Legacy fallback preserved until retirement.
- Feature-level rollback remains available.

## 40. Legacy Retirement Criteria

Legacy Library may be removed only after all of the following are true:

- V5 reads and renders all existing prompt records correctly.
- Editing in V5 does not corrupt Legacy-visible data.
- Favorites, pinning, variables, versions, and results are preserved.
- Search V2 works in Thai and English.
- Prompt execution is stable.
- Workspace and folder flows are stable.
- Backup and recovery are verified.
- Local migration rollback/recovery is verified.
- No blocker regressions remain.

Legacy removal must be a dedicated later change and is not included automatically in this implementation scope.

## 41. Design Review Checklist

This design intentionally contains no unresolved placeholders or deferred architecture decisions required for implementation.

Confirmed:

- Rollout strategy defined.
- Legacy fallback defined.
- Provider scope defined.
- Supabase production boundary defined.
- Workflow execution model defined.
- Cost policy defined.
- Data ownership and migration rules defined.
- Security boundaries defined.
- Testing and CI gates defined.
- Merge and deployment authorization boundaries defined.

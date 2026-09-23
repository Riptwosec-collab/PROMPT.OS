# Prompt.OS Phase 4 — Immersive Run Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-screen, local-first prompt execution workspace where every execution is durably recorded before network work starts, streaming output is recoverable, Retry/Regenerate create immutable history, Saved Results are explicit snapshot artifacts, and later cloud sync can be added without coupling UI to Supabase.

**Architecture:** Keep the existing `/api/ai/run` + `streamAiRun()` transport as the single AI execution path. Add a separate Run domain (`lib/run/*`) for immutable run records, IndexedDB repositories, checkpoint/recovery policy, sync queue contracts, and Saved Result snapshots. `PromptLibraryV5` owns navigation between Library/Detail/Run Workspace; `PromptDetailV2` and premium card quick actions only open the workspace. The Run Workspace uses a controller hook that writes the local run first, then starts the existing stream, checkpoints bounded output, finalizes terminal state, and never lets cloud availability determine local correctness.

**Tech Stack:** Next.js 16.3.5, React 19.3.0, Motion 13.4.0, Tailwind CSS 4.3.3, existing OpenAI 7.15.0 NDJSON streaming transport, browser IndexedDB, Node `node:test`. Add `react-markdown@10.1.0`, `remark-gfm@4.0.1`, `prism-react-renderer@2.4.1`, and dev dependency `fake-indexeddb@6.2.5`.

**Spec:** `docs/superpowers/specs/2026-09-23-prompt-os-phase-4-immersive-run-design.md`

## Global Constraints

- `V5_IMMERSIVE_RUN` defaults to `false` and uses the existing strict explicit-`true` feature flag parser.
- Existing `V5_EXECUTION_ENGINE` remains the authority for whether real AI execution is allowed.
- Legacy PromptOS and the current Prompt Detail run path remain intact when Phase 4 is disabled.
- Exactly 80 built-in prompts must remain unchanged.
- Reuse `streamAiRun({ provider, model, prompt, signal, onDelta, onMeta })`; do not create a second `/api/ai/run` client.
- OpenAI remains the only implemented execution provider in this phase.
- Current auth behavior is unchanged.
- IndexedDB is the Phase 4 local source of truth for Runs, Saved Results, runtime metadata, and sync mutations.
- Create a separate IndexedDB database for runtime artifacts; do not migrate or rewrite the existing localStorage prompt/workspace payload.
- No production Supabase DDL, schema migration, provider implementation, billing logic, or production deployment.
- No fabricated provider/model/token/latency/cost/sync status. Missing metadata stays absent.
- Stop, failure, and interruption preserve partial output.
- Retry and Regenerate always create new run IDs; terminal execution snapshots are immutable.
- No automatic history pruning or silent conflict overwrite.
- Reduced motion and keyboard/mobile accessibility are mandatory.
- No particles, scanlines, cursor trails, or heavy 3D motion.
- TDD RED → GREEN for every task; each task ends with a focused commit.

## Review Focus

1. **IndexedDB unavailable/quota failure before Run:** the network request must not start, and the UI must report that the run was not saved.
2. **Multi-tab recovery:** a fresh heartbeat owned by another tab must never be reclassified as `interrupted`; only stale leases are recoverable.
3. **Abort/completion race:** once a run reaches a terminal state, a late abort/error callback must not rewrite `success` into `stopped`/`failed`.
4. **Hostile Markdown:** raw HTML, `javascript:` URLs, and unsafe links must not execute; raw stored output remains unchanged.
5. **Large streaming output:** repository writes must be checkpointed by time/size rather than one write per delta, and terminal finalization must attempt a final flush.

---

## File Structure

### Create

- `lib/run/model.mjs` — canonical run statuses, constructors, transition guards, immutable terminal semantics, telemetry normalization, Retry/Regenerate input builders.
- `lib/run/checkpoint.mjs` — pure bounded checkpoint policy constants/helpers.
- `lib/run/indexeddb.mjs` — versioned `prompt-os-runtime` IndexedDB open/upgrade/transaction helpers.
- `lib/run/run-repository.mjs` — Run CRUD constrained by active-vs-terminal invariants.
- `lib/run/result-repository.mjs` — explicit Saved Result snapshot creation/read APIs.
- `lib/run/sync-repository.mjs` — IndexedDB-backed local mutation queue + sync state writes.
- `lib/run/conflicts.mjs` — preserve-both conflict-copy helper.
- `lib/run/recovery.mjs` — active lease heartbeat/staleness rules.
- `components/prompt/useImmersiveRun.js` — Run Session Controller hook using `streamAiRun`, repositories, AbortController, checkpointing, heartbeat and storage-warning state.
- `components/prompt/RunWorkspace.jsx` — full-screen desktop/mobile execution surface.
- `components/prompt/RunResult.jsx` — Rich Markdown/Raw result renderer with safe links and syntax highlighting.
- `components/prompt/RunStatus.jsx` — semantic execution/persistence/sync status labels.
- `tests/run-model.test.mjs`
- `tests/run-checkpoint.test.mjs`
- `tests/run-indexeddb.test.mjs`
- `tests/run-repository.test.mjs`
- `tests/run-recovery.test.mjs`
- `tests/saved-result.test.mjs`
- `tests/run-sync-contract.test.mjs`
- `tests/immersive-run-controller.test.mjs`
- `tests/immersive-run-ui-contract.test.mjs`
- `tests/run-markdown-contract.test.mjs`

### Modify

- `package.json` — add the four approved dependencies only.
- `lib/ui/feature-flags.mjs` — add `V5_IMMERSIVE_RUN`.
- `.env.example` — document `NEXT_PUBLIC_V5_IMMERSIVE_RUN=false`.
- `tests/feature-flags.test.mjs` — preserve exact flag-array regression and strict parsing.
- `app/page.jsx` — derive execution/immersive booleans and pass them to Library.
- `components/prompt/PromptLibraryV5.jsx` — own Run Workspace navigation/origin focus and card/detail entry points.
- `components/prompt/PromptDetailV2.jsx` — open Run Workspace with validated current prompt/variable snapshot when immersive mode is enabled; preserve legacy `onRun` behavior otherwise.
- `components/prompt/PromptCardV5.jsx` — existing `onRun(prompt)` stays the quick-action contract; no transport logic is added here.
- `lib/i18n/catalog-th.mjs` — Phase 4 visible copy.
- `tests/i18n-coverage.test.mjs` — Phase 4 translation coverage.
- `tests/v5-prompt-detail-ui.test.mjs` — regression for legacy detail behavior plus immersive gate.
- `tests/neo-premium-interactions.test.mjs` — ensure card Run remains callback-driven and no new pointer regressions.
- `app/globals.css` — workspace layout, Markdown styling, sticky mobile action bar, reduced-motion rules.

---

### Task 1: Canonical Run Model and Checkpoint Policy

**Files:**
- Create: `lib/run/model.mjs`
- Create: `lib/run/checkpoint.mjs`
- Create: `tests/run-model.test.mjs`
- Create: `tests/run-checkpoint.test.mjs`

**Interfaces:**
- Produces `RUN_STATUS`, `TERMINAL_RUN_STATUSES`, `SYNC_STATE`.
- Produces `createRunRecord(input)`, `applyRunEvent(run, event)`, `isTerminalRun(run)`, `normalizeRunMeta(meta)`, `buildRetryInput(run)`, `buildRegenerateInput({ sourceRun, promptSnapshot, variablesSnapshot, renderedPrompt })`.
- Produces `CHECKPOINT_INTERVAL_MS = 750`, `CHECKPOINT_CHAR_THRESHOLD = 4096`, `shouldCheckpoint({ lastCheckpointAt, now, persistedLength, outputLength })`.
- Later tasks rely on terminal records rejecting execution-content mutation and metadata being real-only.

- [ ] **Step 1: Write failing lifecycle and immutability tests.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRunRecord, applyRunEvent, buildRetryInput, buildRegenerateInput,
} from '../lib/run/model.mjs';

test('terminal runs preserve partial output and cannot be rewritten by a late event', () => {
  let run = createRunRecord({
    id: 'r1', promptId: 'p1', promptSnapshot: 'hello', variablesSnapshot: {},
    renderedPrompt: 'hello', ownerSessionId: 'tab-a', now: 1000,
  });
  run = applyRunEvent(run, { type: 'start', at: 1001 });
  run = applyRunEvent(run, { type: 'delta', output: 'partial', at: 1002 });
  run = applyRunEvent(run, { type: 'success', output: 'done', meta: { inputTokens: 2 }, at: 1003 });
  const lateAbort = applyRunEvent(run, { type: 'stop', output: 'done', at: 1004 });
  assert.equal(lateAbort.status, 'success');
  assert.equal(lateAbort.output, 'done');
  assert.equal(lateAbort.inputTokens, 2);
});

test('retry reuses exact source snapshots while regenerate uses current workspace inputs', () => {
  const source = { id: 'r1', promptId: 'p1', promptSnapshot: 'old', variablesSnapshot: { x: '1' }, renderedPrompt: 'old 1' };
  assert.deepEqual(buildRetryInput(source), {
    parentRunId: 'r1', trigger: 'retry', promptId: 'p1', promptSnapshot: 'old',
    variablesSnapshot: { x: '1' }, renderedPrompt: 'old 1',
  });
  assert.equal(buildRegenerateInput({ sourceRun: source, promptSnapshot: 'new', variablesSnapshot: { x: '2' }, renderedPrompt: 'new 2' }).renderedPrompt, 'new 2');
});
```

- [ ] **Step 2: Run RED.**

```bash
node --test tests/run-model.test.mjs tests/run-checkpoint.test.mjs
```

Expected: FAIL because `lib/run/model.mjs` and `lib/run/checkpoint.mjs` do not exist.

- [ ] **Step 3: Implement the model with explicit transition guards.**

```js
export const RUN_STATUS = Object.freeze({
  PREPARING: 'preparing', RUNNING: 'running', SUCCESS: 'success',
  FAILED: 'failed', STOPPED: 'stopped', INTERRUPTED: 'interrupted',
});
export const TERMINAL_RUN_STATUSES = new Set(['success', 'failed', 'stopped', 'interrupted']);
export const SYNC_STATE = Object.freeze({
  LOCAL: 'local', PENDING: 'pending', SYNCING: 'syncing',
  SYNCED: 'synced', CONFLICT: 'conflict', SYNC_ERROR: 'sync_error',
});

export function isTerminalRun(run) {
  return TERMINAL_RUN_STATUSES.has(run?.status);
}

export function applyRunEvent(run, event) {
  if (isTerminalRun(run)) return { ...run };
  if (event.type === 'start' && run.status === 'preparing') return { ...run, status: 'running', updatedAt: event.at };
  if (event.type === 'delta' && run.status === 'running') return { ...run, output: String(event.output ?? run.output), updatedAt: event.at };
  if (['success', 'failed', 'stopped', 'interrupted'].includes(event.type)) {
    return { ...run, status: event.type, output: String(event.output ?? run.output ?? ''), completedAt: event.at, updatedAt: event.at, ...normalizeRunMeta(event.meta) };
  }
  return { ...run };
}
```

Implement `normalizeRunMeta()` with an allow-list for `provider`, `model`, `latencyMs`, `inputTokens`, `outputTokens`, `responseId`; finite numeric fields only and no `cost` key.

- [ ] **Step 4: Implement bounded checkpoint policy.**

```js
export const CHECKPOINT_INTERVAL_MS = 750;
export const CHECKPOINT_CHAR_THRESHOLD = 4096;
export function shouldCheckpoint({ lastCheckpointAt, now, persistedLength, outputLength }) {
  return (now - lastCheckpointAt) >= CHECKPOINT_INTERVAL_MS
    || (outputLength - persistedLength) >= CHECKPOINT_CHAR_THRESHOLD;
}
```

Add tests that 100 rapid deltas below both thresholds cause zero checkpoint decisions, while elapsed time or 4096 new characters triggers one.

- [ ] **Step 5: Run GREEN.**

```bash
node --test tests/run-model.test.mjs tests/run-checkpoint.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add lib/run/model.mjs lib/run/checkpoint.mjs tests/run-model.test.mjs tests/run-checkpoint.test.mjs
git commit -m "feat: define immersive run domain model"
```

---

### Task 2: Versioned IndexedDB Runtime Database

**Files:**
- Modify: `package.json`
- Create: `lib/run/indexeddb.mjs`
- Create: `tests/run-indexeddb.test.mjs`

**Interfaces:**
- Consumes browser `indexedDB` or injected `indexedDBImpl`.
- Produces `RUNTIME_DB_NAME = 'prompt-os-runtime'`, `RUNTIME_DB_VERSION = 1`, `openRuntimeDb({ indexedDBImpl = globalThis.indexedDB } = {})`, `withStore(db, storeName, mode, fn)`.
- Creates object stores `runs`, `savedResults`, `syncQueue`, `runtimeMeta` without touching localStorage prompt/workspace state.

- [ ] **Step 1: Add test-only IndexedDB dependency.**

Set `devDependencies.fake-indexeddb` to `6.2.5` in `package.json`; do not change existing dependency versions.

- [ ] **Step 2: Write RED database tests using `fake-indexeddb`.**

```js
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { openRuntimeDb } from '../lib/run/indexeddb.mjs';

test('runtime DB creates only Phase 4 stores and required indexes', async () => {
  const db = await openRuntimeDb();
  assert.deepEqual([...db.objectStoreNames], ['runs', 'runtimeMeta', 'savedResults', 'syncQueue']);
  const tx = db.transaction('runs', 'readonly');
  const indexes = [...tx.objectStore('runs').indexNames];
  assert.ok(indexes.includes('by-created-at'));
  assert.ok(indexes.includes('by-prompt-id'));
  assert.ok(indexes.includes('by-status'));
  db.close();
});
```

Add a test where `indexedDBImpl.open()` throws/rejects and `openRuntimeDb()` rejects instead of silently resetting data.

- [ ] **Step 3: Run RED.**

```bash
node --test tests/run-indexeddb.test.mjs
```

Expected: FAIL because the module does not exist.

- [ ] **Step 4: Implement the database upgrade.**

Create stores with key paths:

```text
runs:         keyPath `id`; indexes `by-created-at`, `by-prompt-id`, `by-status`
savedResults: keyPath `resultId`; indexes `by-created-at`, `by-source-run-id`
syncQueue:    keyPath `id`; indexes `by-created-at`, `by-state`
runtimeMeta:  keyPath `key`
```

`onupgradeneeded` must add missing stores/indexes only; never call `deleteDatabase()` or drop stores as fallback.

- [ ] **Step 5: Run GREEN.**

```bash
node --test tests/run-indexeddb.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add package.json lib/run/indexeddb.mjs tests/run-indexeddb.test.mjs
git commit -m "feat: add versioned runtime indexeddb"
```

---

### Task 3: Run, Saved Result, Sync Queue, and Conflict Repositories

**Files:**
- Create: `lib/run/run-repository.mjs`
- Create: `lib/run/result-repository.mjs`
- Create: `lib/run/sync-repository.mjs`
- Create: `lib/run/conflicts.mjs`
- Create: `tests/run-repository.test.mjs`
- Create: `tests/saved-result.test.mjs`
- Create: `tests/run-sync-contract.test.mjs`

**Interfaces:**
- `createRunRepository({ db, now = Date.now })` → `{ create, get, list, checkpoint, heartbeat, finalize, recoverableActive }`.
- `createResultRepository({ db, idFactory = crypto.randomUUID, now = Date.now })` → `{ saveFromRun, get, list }`.
- `createSyncRepository({ db })` → `{ enqueue, listPending, markSyncing, markApplied, markError, markConflict }`.
- `createConflictCopy({ localRecord, cloudRecord, now, idFactory })` returns a preserved local copy carrying `conflictOf`, `conflictDetectedAt`, and `sourceRevision`.

- [ ] **Step 1: Write RED RunRepository tests.**

```js
test('finalize makes execution content immutable', async () => {
  const repo = createRunRepository({ db });
  await repo.create(runPreparing);
  await repo.finalize('r1', { status: 'success', output: 'final', completedAt: 2000 });
  await assert.rejects(
    () => repo.checkpoint('r1', { output: 'rewritten', updatedAt: 3000 }),
    /terminal run/i,
  );
  assert.equal((await repo.get('r1')).output, 'final');
});
```

Add tests for chronological list ordering, prompt/status index filtering, heartbeat updates only on non-terminal records, and storage transaction failure propagation.

- [ ] **Step 2: Write RED Saved Result tests.**

```js
test('saveFromRun stores an independent immutable snapshot', async () => {
  const saved = await resultRepo.saveFromRun(sourceRun, { name: 'Keep me' });
  sourceRun.output = 'mutated later';
  assert.equal((await resultRepo.get(saved.resultId)).outputSnapshot, 'original output');
  assert.deepEqual((await resultRepo.get(saved.resultId)).variablesSnapshot, { topic: 'network' });
});
```

- [ ] **Step 3: Write RED sync/conflict tests.** Assert duplicate queue IDs replace/dedupe, errors become `sync_error`, and a revision conflict creates a second local copy instead of overwriting either input.

- [ ] **Step 4: Run RED.**

```bash
node --test tests/run-repository.test.mjs tests/saved-result.test.mjs tests/run-sync-contract.test.mjs
```

- [ ] **Step 5: Implement repositories with structured cloning at boundaries.** Never return live mutable object references from persistence helpers. `finalize()` must perform one readwrite transaction that writes output + terminal status + completion metadata together.

- [ ] **Step 6: Implement preserve-both conflict helper.**

```js
export function createConflictCopy({ localRecord, cloudRecord, now, idFactory }) {
  return {
    ...structuredClone(localRecord),
    id: idFactory(),
    syncState: 'conflict',
    conflictOf: cloudRecord.id,
    conflictDetectedAt: new Date(now()).toISOString(),
    sourceRevision: localRecord.revision ?? 0,
  };
}
```

For Saved Result IDs, use `resultId` instead of `id` through an explicit key field parameter; do not guess the entity key.

- [ ] **Step 7: Run GREEN.**

```bash
node --test tests/run-repository.test.mjs tests/saved-result.test.mjs tests/run-sync-contract.test.mjs
```

- [ ] **Step 8: Commit.**

```bash
git add lib/run/run-repository.mjs lib/run/result-repository.mjs lib/run/sync-repository.mjs lib/run/conflicts.mjs tests/run-repository.test.mjs tests/saved-result.test.mjs tests/run-sync-contract.test.mjs
git commit -m "feat: add local run and result repositories"
```

---

### Task 4: Lease Recovery and Run Session Controller

**Files:**
- Create: `lib/run/recovery.mjs`
- Create: `components/prompt/useImmersiveRun.js`
- Create: `tests/run-recovery.test.mjs`
- Create: `tests/immersive-run-controller.test.mjs`

**Interfaces:**
- `RUN_LEASE_HEARTBEAT_MS = 5000`.
- `RUN_LEASE_STALE_MS = 20000`.
- `isLeaseStale({ heartbeatAt, now, staleMs = RUN_LEASE_STALE_MS })`.
- `recoverInterruptedRuns({ repository, now })` only finalizes stale `preparing`/`running` records.
- `useImmersiveRun({ runRepository, resultRepository, syncRepository, runner = streamAiRun, now = Date.now, idFactory = crypto.randomUUID, sessionId })` returns `{ session, start, stop, retry, regenerate, saveResult, persistence, reset }`.

- [ ] **Step 1: Write RED lease tests.**

```js
test('fresh lease owned by another tab is not interrupted', async () => {
  const repo = fakeRepository([{ id: 'r1', status: 'running', ownerSessionId: 'other-tab', heartbeatAt: 95_000 }]);
  await recoverInterruptedRuns({ repository: repo, now: () => 100_000 });
  assert.equal(repo.finalized.length, 0);
});

test('stale active lease is finalized as interrupted with partial output', async () => {
  const repo = fakeRepository([{ id: 'r1', status: 'running', output: 'partial', heartbeatAt: 70_000 }]);
  await recoverInterruptedRuns({ repository: repo, now: () => 100_000 });
  assert.equal(repo.finalized[0].status, 'interrupted');
  assert.equal(repo.finalized[0].output, 'partial');
});
```

- [ ] **Step 2: Write RED controller tests with dependency injection.** Core cases:
  - repository `create()` rejection means `runner` call count stays `0`;
  - deltas update in-memory output but checkpoint writes are bounded;
  - Stop aborts and finalizes `stopped` with partial output;
  - provider error finalizes `failed` with partial output;
  - success stores real `meta` only;
  - late AbortError after success cannot rewrite terminal state;
  - Retry uses exact source snapshots;
  - Regenerate uses current workspace inputs and creates a new ID.

- [ ] **Step 3: Run RED.**

```bash
node --test tests/run-recovery.test.mjs tests/immersive-run-controller.test.mjs
```

- [ ] **Step 4: Implement recovery helpers and controller.** Controller ordering must be:

```text
validate supplied execution input
→ repository.create(preparing)
→ set local session preparing
→ runner(...)
→ start heartbeat every 5s while active
→ onDelta: update memory, checkpoint only when policy says yes
→ onMeta: retain allowed real metadata
→ success/stop/failure: force final checkpoint/finalize
→ enqueue sync mutation after local terminal commit
```

Use one `AbortController` per run and a `finalizedRef`/run token so callbacks from an obsolete run cannot mutate the new run.

- [ ] **Step 5: Implement mid-stream storage warning semantics.** If checkpoint fails after execution starts, set `persistence = { state: 'warning', message }`, keep streaming in memory, and retry on the next checkpoint/finalization. Never set `Saved locally` until a repository write succeeds.

- [ ] **Step 6: Add best-effort lifecycle flush.** Register `visibilitychange`/`pagehide` only to call the same bounded `checkpointNow()` path. Do not rely on the event for correctness and do not use blocking/synchronous network calls.

- [ ] **Step 7: Run GREEN.**

```bash
node --test tests/run-recovery.test.mjs tests/immersive-run-controller.test.mjs tests/run-model.test.mjs tests/run-checkpoint.test.mjs
```

- [ ] **Step 8: Commit.**

```bash
git add lib/run/recovery.mjs components/prompt/useImmersiveRun.js tests/run-recovery.test.mjs tests/immersive-run-controller.test.mjs
git commit -m "feat: add recoverable run session controller"
```

---

### Task 5: Safe Rich Markdown Result and Full-screen Run Workspace

**Files:**
- Modify: `package.json`
- Create: `components/prompt/RunResult.jsx`
- Create: `components/prompt/RunStatus.jsx`
- Create: `components/prompt/RunWorkspace.jsx`
- Create: `tests/run-markdown-contract.test.mjs`
- Create: `tests/immersive-run-ui-contract.test.mjs`
- Modify: `app/globals.css`

**Interfaces:**
- Add runtime dependencies exactly: `react-markdown@10.1.0`, `remark-gfm@4.0.1`, `prism-react-renderer@2.4.1`.
- `<RunResult output mode onModeChange />` supports `markdown | raw`.
- `<RunStatus status persistence syncState />` renders only real semantic states.
- `<RunWorkspace prompt initialValues initialRenderedPrompt onClose ...repositories />` owns editable session prompt/variables and delegates execution to `useImmersiveRun`.

- [ ] **Step 1: Write RED Markdown security/source tests.** Assert:
  - `react-markdown` + `remark-gfm` are used;
  - `rehypeRaw` and `dangerouslySetInnerHTML` are absent;
  - custom link rendering rejects protocols other than `http:`, `https:`, and `mailto:`;
  - Raw view renders the exact stored string;
  - fenced code blocks route through `prism-react-renderer` when a language is present.

- [ ] **Step 2: Write RED Run Workspace contract tests.** Assert the source contains:
  - full-screen landmark/container;
  - Variables, editable Prompt, Result regions;
  - Run, Stop, Retry, Regenerate, Copy, Save Result;
  - Markdown/Raw toggle;
  - `Ctrl`/`Meta` + Enter handling;
  - `aria-live="polite"` status region but no token-by-token live region;
  - sticky mobile actions and safe-area usage;
  - reduced-motion branch.

- [ ] **Step 3: Run RED.**

```bash
node --test tests/run-markdown-contract.test.mjs tests/immersive-run-ui-contract.test.mjs
```

- [ ] **Step 4: Implement safe Markdown renderer.** Example URL transform:

```js
function safeHref(href = '') {
  try {
    const url = new URL(href, 'https://prompt-os.local');
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return '';
    return href;
  } catch {
    return '';
  }
}
```

Do not enable raw HTML parsing. External `http(s)` anchors use `target="_blank" rel="noreferrer noopener"`.

- [ ] **Step 5: Implement `RunWorkspace.jsx`.** Desktop uses two primary columns: left Inputs/Prompt, right Result. Mobile order is Variables → Prompt → Result with a sticky action bar padded by `env(safe-area-inset-bottom)`. Run-mode prompt edits live only in workspace state and do not call `patchPrompt()`.

- [ ] **Step 6: Implement execution actions.** `Run` uses current workspace values; `Retry` invokes exact source-run snapshot; `Regenerate` invokes current workspace state; `Save Result` calls `resultRepository.saveFromRun()` only for an existing run and reports local persistence result explicitly.

- [ ] **Step 7: Add restrained CSS.** Use transform/opacity for entry/status motion; no continuous glow loops. Under `prefers-reduced-motion`, remove non-essential transitions/animations. Add bottom padding so mobile actions never cover result content.

- [ ] **Step 8: Run GREEN.**

```bash
node --test tests/run-markdown-contract.test.mjs tests/immersive-run-ui-contract.test.mjs
```

- [ ] **Step 9: Commit.**

```bash
git add package.json components/prompt/RunResult.jsx components/prompt/RunStatus.jsx components/prompt/RunWorkspace.jsx tests/run-markdown-contract.test.mjs tests/immersive-run-ui-contract.test.mjs app/globals.css
git commit -m "feat: add full-screen immersive run workspace"
```

---

### Task 6: Feature-gated Library/Detail/Card Integration

**Files:**
- Modify: `lib/ui/feature-flags.mjs`
- Modify: `.env.example`
- Modify: `tests/feature-flags.test.mjs`
- Modify: `app/page.jsx`
- Modify: `components/prompt/PromptLibraryV5.jsx`
- Modify: `components/prompt/PromptDetailV2.jsx`
- Modify: `components/prompt/PromptCardV5.jsx` only if needed to preserve existing callback signature; do not add transport logic.
- Modify: `tests/v5-prompt-detail-ui.test.mjs`
- Modify: `tests/neo-premium-interactions.test.mjs`
- Modify: `tests/immersive-run-ui-contract.test.mjs`

**Interfaces:**
- `PromptLibraryV5` gains `executionEnabled=false`, `immersiveRunEnabled=false`.
- Library owns `runWorkspaceState` and origin focus refs.
- `openRunWorkspace(prompt, seed)` sets a local Run Workspace route/state; `closeRunWorkspace()` returns to Detail when launched from Detail, otherwise Library/card origin.
- `PromptDetailV2` gets `immersiveRunEnabled` and `onOpenRunWorkspace`; when immersive execution is enabled it validates/render current values, then opens the workspace instead of invoking transport itself.
- Existing `onRun` callback path remains for the flag-off case.

- [ ] **Step 1: Extend RED feature flag test.** Add `V5_IMMERSIVE_RUN` to `EXPECTED_FLAGS`; assert default false, `' true '` true, `'1'` and `'yes'` false.

- [ ] **Step 2: Add RED integration source tests.** Require both `V5_EXECUTION_ENGINE` and `V5_IMMERSIVE_RUN` to flow `app/page.jsx → PromptLibraryV5 → PromptDetailV2/RunWorkspace`. Assert no second direct `fetch('/api/ai/run')` appears in components.

- [ ] **Step 3: Run RED.**

```bash
node --test tests/feature-flags.test.mjs tests/v5-prompt-detail-ui.test.mjs tests/neo-premium-interactions.test.mjs tests/immersive-run-ui-contract.test.mjs
```

- [ ] **Step 4: Add the flag and env documentation.** Add `V5_IMMERSIVE_RUN` to `V5_FLAG_NAMES`, environment mapping, and `.env.example` with default false.

- [ ] **Step 5: Wire app-level booleans.**

```js
const v5ExecutionEnabled = Boolean(V5_FEATURE_FLAGS.V5_EXECUTION_ENGINE);
const v5ImmersiveRunEnabled = Boolean(V5_FEATURE_FLAGS.V5_IMMERSIVE_RUN);
```

Pass both to `PromptLibraryV5`. Do not make `V5_IMMERSIVE_RUN` implicitly enable `V5_EXECUTION_ENGINE`.

- [ ] **Step 6: Make Library own the Run Workspace route.** Card `onRun(prompt)` opens Run Workspace with prompt defaults. Detail `onOpenRunWorkspace({ prompt, values, renderedPrompt })` opens it with the exact validated values/rendered text. Store origin (`card` or `detail`) and restore focus on close.

- [ ] **Step 7: Preserve legacy Detail execution.** In `PromptDetailV2`, keep the existing `onRun` try/catch path unchanged when immersive mode is disabled. When immersive mode is enabled, validation errors still block opening the workspace and entered values remain owned by Detail until workspace is opened.

- [ ] **Step 8: Run GREEN regressions.**

```bash
node --test tests/feature-flags.test.mjs tests/v5-prompt-detail-ui.test.mjs tests/neo-premium-interactions.test.mjs tests/immersive-run-ui-contract.test.mjs tests/variables-v2.test.mjs tests/shared-prompt-transition.test.mjs
```

- [ ] **Step 9: Commit.**

```bash
git add lib/ui/feature-flags.mjs .env.example tests/feature-flags.test.mjs app/page.jsx components/prompt/PromptLibraryV5.jsx components/prompt/PromptDetailV2.jsx components/prompt/PromptCardV5.jsx tests/v5-prompt-detail-ui.test.mjs tests/neo-premium-interactions.test.mjs tests/immersive-run-ui-contract.test.mjs
git commit -m "feat: gate immersive run into prompt flows"
```

---

### Task 7: Localization, Accessibility, Recovery Entry, and Persistence Status

**Files:**
- Modify: `lib/i18n/catalog-th.mjs`
- Modify: `tests/i18n-coverage.test.mjs`
- Modify: `components/prompt/RunWorkspace.jsx`
- Modify: `components/prompt/RunStatus.jsx`
- Modify: `components/prompt/PromptLibraryV5.jsx`
- Modify: `tests/immersive-run-ui-contract.test.mjs`
- Modify: `tests/run-recovery.test.mjs`

**Interfaces:**
- Visible labels include: Preparing, Running, Success, Failed, Stopped, Interrupted, Saving locally, Saved locally, Local save warning, Local only, Waiting to sync, Syncing, Synced, Conflict, Sync failed, Retry, Regenerate, Save Result, Markdown, Raw, Copy, Copied, Close Run, Interrupted run recovered.
- Recovery scan runs once after runtime DB hydration and exposes recovered stale runs without blocking Library use.

- [ ] **Step 1: Add RED i18n coverage.** Extend `tests/i18n-coverage.test.mjs` with every visible Phase 4 string above and Thai mappings.

- [ ] **Step 2: Add RED accessibility/recovery assertions.** Require:
  - Run Workspace `aria-label`/heading relationship;
  - visible focus styles on close/run/stop actions;
  - status meaning is textual, not color-only;
  - Stop remains enabled/reachable during active execution;
  - streaming output itself is not `aria-live`;
  - recovery scan invokes stale-lease logic, not a blanket `running → interrupted` conversion.

- [ ] **Step 3: Run RED.**

```bash
node --test tests/i18n-coverage.test.mjs tests/immersive-run-ui-contract.test.mjs tests/run-recovery.test.mjs
```

- [ ] **Step 4: Add Thai catalog entries and semantic status UI.** Do not invent cloud status; render sync labels only from persisted `syncState`.

- [ ] **Step 5: Wire recovery notification.** After IndexedDB opens, call `recoverInterruptedRuns()` once. If stale runs were recovered, expose a non-blocking message/action that can open the latest recovered record. Fresh leases from another tab remain untouched.

- [ ] **Step 6: Verify keyboard policy.** `Ctrl/Cmd + Enter` runs from inputs/prompt textarea only when validation allows; `Escape` closes Run Workspace only when no destructive confirmation is active. Do not steal `Ctrl/Cmd + Enter` from nested code editors that explicitly call `stopPropagation()`.

- [ ] **Step 7: Run GREEN.**

```bash
node --test tests/i18n-coverage.test.mjs tests/immersive-run-ui-contract.test.mjs tests/run-recovery.test.mjs
```

- [ ] **Step 8: Commit.**

```bash
git add lib/i18n/catalog-th.mjs tests/i18n-coverage.test.mjs components/prompt/RunWorkspace.jsx components/prompt/RunStatus.jsx components/prompt/PromptLibraryV5.jsx tests/immersive-run-ui-contract.test.mjs tests/run-recovery.test.mjs
git commit -m "feat: harden immersive run recovery and accessibility"
```

---

### Task 8: Cross-layer Failure Hardening and Regression Coverage

**Files:**
- Modify: `tests/immersive-run-controller.test.mjs`
- Modify: `tests/run-indexeddb.test.mjs`
- Modify: `tests/run-repository.test.mjs`
- Modify: `tests/run-markdown-contract.test.mjs`
- Modify: `tests/immersive-run-ui-contract.test.mjs`
- Modify: `tests/v5-review-regressions.test.mjs`
- Modify implementation files only where the new tests expose gaps.

**Interfaces:** No new public API unless a failing test proves one is required.

- [ ] **Step 1: Add the five Review Focus tests explicitly.**
  1. DB open/create failure → runner never called.
  2. Fresh other-tab lease → no interruption.
  3. Success then late abort/error → success remains terminal.
  4. Markdown raw HTML/`javascript:` link → no executable output.
  5. 1000 tiny deltas in <750ms/<4096-char windows → writes remain bounded; terminal flush persists final output.

- [ ] **Step 2: Add storage-warning recovery test.** Simulate checkpoint failure followed by successful finalization; UI/controller must clear warning only after a successful persistence operation. Simulate finalization failure too; visible output stays copyable and state must not claim `Saved locally`.

- [ ] **Step 3: Add catalog/legacy scope regression.** Extend `tests/v5-review-regressions.test.mjs` to assert:

```js
assert.match(page, /if \(!v5ShellEnabled\)/);
assert.match(page, /<PromptOS \/>/);
assert.doesNotMatch(runWorkspaceSource, /fetch\s*\(\s*['"]\/api\/ai\/run/);
```

Keep existing `tests/prompt-catalog.test.mjs` as the authoritative exactly-80 regression.

- [ ] **Step 4: Run targeted RED/GREEN loop until all hardening tests pass.**

```bash
node --test tests/run-model.test.mjs tests/run-checkpoint.test.mjs tests/run-indexeddb.test.mjs tests/run-repository.test.mjs tests/run-recovery.test.mjs tests/saved-result.test.mjs tests/run-sync-contract.test.mjs tests/immersive-run-controller.test.mjs tests/run-markdown-contract.test.mjs tests/immersive-run-ui-contract.test.mjs tests/v5-review-regressions.test.mjs tests/prompt-catalog.test.mjs
```

- [ ] **Step 5: Commit.**

```bash
git add tests lib/run components/prompt app/globals.css
git commit -m "test: harden immersive run failure boundaries"
```

---

### Task 9: Full Verification, Scope Audit, and Phase 4 Draft PR

**Files:**
- No product changes expected.
- Update plan/execution notes only if verification uncovers a documented exception.

**Interfaces:** Verification evidence must correspond to the exact final head SHA that goes into the PR.

- [ ] **Step 1: Run the complete test suite.**

```bash
npm test
```

Expected: all tests pass, including the exactly-80 built-in prompt regression.

- [ ] **Step 2: Run production/OpenNext build.**

```bash
npm run build
```

Expected: exit code 0.

- [ ] **Step 3: Verify Cloudflare artifacts.**

```bash
test -f .open-next/worker.js
test -d .open-next/assets
test -f .open-next/.build/open-next.config.edge.mjs
```

Expected: all commands exit 0.

- [ ] **Step 4: Run Wrangler dry-run only.**

```bash
rm -rf .wrangler-dry-run
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

Expected: dry-run succeeds; no production deployment occurs.

- [ ] **Step 5: Audit changed files from the Phase 4 implementation merge base.**

```bash
git diff --name-only "$(git merge-base main HEAD)"...HEAD
```

Confirm:
- no `supabase/*.sql` or production DDL changed;
- no new provider implementation;
- no billing changes;
- no production secrets/config;
- no built-in prompt catalog content changes;
- `/api/ai/run` is not duplicated by another client/route;
- feature flag defaults remain false.

- [ ] **Step 6: Search forbidden UX/architecture patterns.**

```bash
grep -RniE 'particle|scanline|cursor-trail|rotateX|rotateY|Estimated Cost' components/prompt lib/run app/globals.css || true
grep -RniE "fetch\(['\"]\/api\/ai\/run" components lib/run || true
```

The only direct execution fetch remains inside existing `lib/ai/run-stream.mjs`; false positives in negative tests are acceptable and must be reviewed manually.

- [ ] **Step 7: Create a Phase 4 implementation PR as Draft and stop.** PR body must record:
  - base/head SHA;
  - exact test pass count;
  - build result;
  - artifact checks;
  - Wrangler dry-run result;
  - exactly 80 prompts preserved;
  - no production Supabase/provider/billing/deploy changes;
  - explicit note: **Do not merge without separate user `merge` authorization.**

- [ ] **Step 8: Do not merge or deploy.** Wait for a separate explicit user instruction.

---

## Dependency Order

```text
Task 1 Run model/checkpoint
   ↓
Task 2 IndexedDB
   ↓
Task 3 repositories/sync contracts
   ↓
Task 4 run controller/recovery
   ↓
Task 5 full-screen UI/Markdown
   ↓
Task 6 feature-gated integration
   ↓
Task 7 i18n/accessibility/recovery UX
   ↓
Task 8 hardening
   ↓
Task 9 verification + Draft PR
```

## Self-review Results

- **Spec coverage:** Full-screen Run, local-first IndexedDB, auto-saved History records, partial-output recovery, Retry/Regenerate lineage, explicit Saved Results, preserve-both conflicts, Markdown/Raw rendering, no auto-prune, feature gating, unchanged auth/provider scope, accessibility and verification gates are all mapped to tasks.
- **Scope boundary:** Full History management/search/compare/export UI remains Phase 5; Prompt Builder/versioning remains Phase 6; Mission Control analytics remains Phase 7.
- **Type consistency:** `id` is the Run key; `resultId` is the Saved Result key; `parentRunId`, `promptSnapshot`, `variablesSnapshot`, `renderedPrompt`, `output`, `syncState`, `revision`, `ownerSessionId`, and `heartbeatAt` are used consistently across model/repository/controller tasks.
- **Placeholder scan:** No TBD/TODO/“implement later” steps remain.
- **Review Focus coverage:** all five failure modes are assigned explicit tests in Tasks 2, 4, 5, and 8.

## Execution Gate

Implementation begins only after the user reviews this plan and chooses an execution approach. The implementation branch must start from the approved spec/plan state and follow the task order above. Merge and production deploy remain separate approvals.

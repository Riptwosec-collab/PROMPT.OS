# Prompt.OS V5 Visual Phase 4 Immersive Run Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present existing OpenAI streaming execution as an immersive, stateful Run experience with execution pulse, conditional live telemetry, stop/retry/error/completion states, safe auto-scroll, and mobile floating controls without creating another provider/request path.

**Architecture:** Keep `/api/ai/run` and `streamAiRun()` as the only real execution transport. Add a pure run-state reducer plus a client hook that adapts `streamAiRun` callbacks and AbortController into UI state; `PromptDetailV2` renders an `ImmersiveRunPanel` only when both the existing `V5_EXECUTION_ENGINE` capability and new `V5_IMMERSIVE_RUN` presentation flag are enabled. Telemetry is rendered only from real `meta` events emitted by the route.

**Tech Stack:** Next 16.3.5, React 19.3.0, Tailwind 4.3.3, Motion for React, existing OpenAI 7.15.0 streaming route, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-18-prompt-os-v5-visual-motion-system-design.md`

## Global Constraints

- Visual Foundation must be merged; Premium Prompt Experience should be merged before final UI integration.
- Add `V5_IMMERSIVE_RUN`, default false.
- Existing `V5_EXECUTION_ENGINE` remains the authority for whether real execution is allowed.
- Reuse `streamAiRun({ provider, model, prompt, signal, onDelta, onMeta })`; do not call `/api/ai/run` from a second implementation.
- OpenAI is the only implemented provider in this scope.
- Current server meta can provide provider, model, latencyMs, inputTokens, outputTokens, responseId. It does not provide cost; the UI must omit cost rather than estimate it.
- Stopping or failure preserves variables, rendered prompt, and already streamed output.
- Single prompt Run has no mandatory cost confirmation.
- No Supabase production DDL, billing enforcement, new provider, or production deployment.

---

## File Structure

**Create**
- `lib/ai/run-state.mjs` — pure explicit state machine and telemetry normalization.
- `lib/ai/scroll-follow.mjs` — pure near-bottom decision helper.
- `components/prompt/usePromptRun.js` — client hook adapting existing stream transport to the state machine.
- `components/prompt/ExecutionPulse.jsx`
- `components/prompt/RunTelemetry.jsx`
- `components/prompt/ImmersiveRunPanel.jsx`
- `tests/run-state.test.mjs`
- `tests/scroll-follow.test.mjs`
- `tests/immersive-run-ui-contract.test.mjs`

**Modify**
- `lib/ui/feature-flags.mjs`
- `tests/feature-flags.test.mjs`
- `app/page.jsx`
- `components/prompt/PromptLibraryV5.jsx`
- `components/prompt/PromptDetailV2.jsx`
- `lib/i18n/catalog-th.mjs`
- `tests/i18n-coverage.test.mjs`
- `app/globals.css`

## Task 1: Explicit Run State Machine and Telemetry Normalization

**Interfaces:**
- `RUN_STATUS = { IDLE, PREPARING, RUNNING, STREAMING, COMPLETED, FAILED, STOPPED }`.
- `createRunState() -> { status:'idle', output:'', meta:{}, error:'', startedAt:null }`.
- `reduceRunState(state, event)` supports `prepare`, `start`, `delta`, `meta`, `complete`, `fail`, `stop`, `reset`.
- `normalizeRunMeta(meta)` returns only known supplied fields: `provider`, `model`, `latencyMs`, `inputTokens`, `outputTokens`, `responseId`; it never creates a `cost` key.
- A `delta` received after start transitions to `streaming` and appends to existing output.
- `fail` and `stop` preserve existing output/meta.

- [ ] **Step 1: Write RED reducer tests** in `tests/run-state.test.mjs`:

```js
test('stop and failure preserve streamed output and real telemetry', () => {
  let state = createRunState();
  state = reduceRunState(state, { type: 'prepare', startedAt: 1 });
  state = reduceRunState(state, { type: 'start' });
  state = reduceRunState(state, { type: 'delta', delta: 'hello' });
  state = reduceRunState(state, { type: 'meta', meta: { provider: 'OpenAI', inputTokens: 4 } });
  const stopped = reduceRunState(state, { type: 'stop' });
  assert.equal(stopped.status, 'stopped');
  assert.equal(stopped.output, 'hello');
  assert.equal(stopped.meta.inputTokens, 4);
  assert.equal('cost' in stopped.meta, false);
});
```

Add tests for full lifecycle, retry/reset, and failure preserving output.
- [ ] **Step 2: Run RED.** `node --test tests/run-state.test.mjs`.
- [ ] **Step 3: Implement `lib/ai/run-state.mjs`.** Make the reducer immutable; ignore empty deltas; sanitize numeric telemetry with `Number.isFinite`; never derive cost.
- [ ] **Step 4: Run GREEN.** `node --test tests/run-state.test.mjs`.
- [ ] **Step 5: Commit.** `git add lib/ai/run-state.mjs tests/run-state.test.mjs && git commit -m "feat: add immersive run state machine"`.

## Task 2: Scroll-Follow Policy and Streaming Hook

**Interfaces:**
- `shouldFollowLatest({ scrollTop, clientHeight, scrollHeight, threshold=96 }) -> boolean`.
- `usePromptRun({ runner=streamAiRun, provider='openai', model })` returns `{ state, run, stop, reset }`.
- `run({ prompt })` creates one AbortController, dispatches prepare/start, calls `runner`, dispatches delta/meta callbacks, and completes only after `runner` resolves.
- `stop()` aborts the active controller and marks stopped; abort errors are not shown as failures.
- A new `run()` aborts any still-active prior controller before starting the new execution.

- [ ] **Step 1: Write RED scroll tests** in `tests/scroll-follow.test.mjs` for at-bottom, within 96px, and user-scrolled-away cases.
- [ ] **Step 2: Run RED.** `node --test tests/scroll-follow.test.mjs`.
- [ ] **Step 3: Implement `lib/ai/scroll-follow.mjs`.** Use `scrollHeight - (scrollTop + clientHeight) <= threshold` with finite-number guards.
- [ ] **Step 4: Add source-contract assertions** to `tests/immersive-run-ui-contract.test.mjs` that `usePromptRun.js` imports `streamAiRun`, uses `AbortController`, and does not call `fetch(`/api/ai/run`)` directly.
- [ ] **Step 5: Run RED contract test.** `node --test tests/immersive-run-ui-contract.test.mjs`.
- [ ] **Step 6: Implement `usePromptRun.js`.** Use `useReducer(reduceRunState, undefined, createRunState)` and controller refs. Treat `error.name === 'AbortError'` as stopped; all other errors dispatch `fail` with a human-readable message.
- [ ] **Step 7: Run GREEN.** `node --test tests/scroll-follow.test.mjs tests/immersive-run-ui-contract.test.mjs`.
- [ ] **Step 8: Commit.** `git add lib/ai/scroll-follow.mjs components/prompt/usePromptRun.js tests/scroll-follow.test.mjs tests/immersive-run-ui-contract.test.mjs && git commit -m "feat: adapt streaming run state"`.

## Task 3: Execution Pulse and Real Telemetry UI

**Interfaces:**
- `<ExecutionPulse status reducedMotion />` maps preparing/running/streaming/completed/failed/stopped to distinct semantic labels plus a small visual pulse; no generic spinner.
- `<RunTelemetry meta />` shows only keys actually present. Total tokens may be displayed only when at least one real token count exists and equals `(inputTokens || 0) + (outputTokens || 0)`.
- Cost is never rendered because current transport supplies no cost.

- [ ] **Step 1: Extend RED UI contract** to assert `ExecutionPulse` contains the approved state labels and `RunTelemetry` checks property presence/finite values before rendering latency/tokens. Assert no `$`, `Estimated Cost`, or hard-coded `cost` display occurs.
- [ ] **Step 2: Run RED.** `node --test tests/immersive-run-ui-contract.test.mjs`.
- [ ] **Step 3: Implement `ExecutionPulse.jsx`.** Use CSS/Motion opacity/scale/wave bars; reduced motion renders a static state dot and text.
- [ ] **Step 4: Implement `RunTelemetry.jsx`.** Render provider/model as mono labels, latency as `N ms`, input/output/total tokens as integers, response ID optionally as a truncated technical label. No estimates.
- [ ] **Step 5: Add CSS** for pulse/waveform using transform/opacity only; stop animation in `prefers-reduced-motion`.
- [ ] **Step 6: Run GREEN.** `node --test tests/immersive-run-ui-contract.test.mjs`.
- [ ] **Step 7: Commit.** `git add components/prompt/ExecutionPulse.jsx components/prompt/RunTelemetry.jsx app/globals.css tests/immersive-run-ui-contract.test.mjs && git commit -m "feat: add execution pulse and telemetry"`.

## Task 4: Immersive Streaming Output, Stop, Retry, and Jump-to-Latest

**Interfaces:**
- `<ImmersiveRunPanel state onStop onRetry onEdit reducedMotion />`.
- Active state shows Stop; failed shows Retry/Edit Prompt; stopped shows Run Again/Edit Prompt; completed shows Copy/Run Again and optional callbacks for Save Result/Improve/Compare/Add to Workflow only when those callbacks exist.
- Output container tracks whether the user is near the bottom via `shouldFollowLatest`; only then does a delta auto-scroll.
- When follow mode is false and output grows, show `Jump to latest`.
- `aria-live="polite"` announces status changes, not every streamed token/chunk.

- [ ] **Step 1: Add RED source-contract tests** for `Jump to latest`, `aria-live="polite"`, Stop/Retry/Run Again actions, and preservation of output on failed/stopped state.
- [ ] **Step 2: Run RED.** `node --test tests/immersive-run-ui-contract.test.mjs`.
- [ ] **Step 3: Implement `ImmersiveRunPanel.jsx`.** Use a scroll ref plus scroll event to update a single `following` boolean; on output changes call `scrollTo({ top: scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' })` only when following is true.
- [ ] **Step 4: Stream chunks without per-character animation.** Render `state.output` as normal selectable text/pre-wrap; animate only the output surface/chunk container opacity, not each character.
- [ ] **Step 5: Implement action states.** Copy uses clipboard with local `Copy -> Copied` feedback; callbacks that are absent are omitted, not rendered as fake working buttons.
- [ ] **Step 6: Run GREEN.** `node --test tests/immersive-run-ui-contract.test.mjs tests/scroll-follow.test.mjs tests/run-state.test.mjs`.
- [ ] **Step 7: Commit.** `git add components/prompt/ImmersiveRunPanel.jsx tests/immersive-run-ui-contract.test.mjs && git commit -m "feat: add immersive streaming run panel"`.

## Task 5: Gate Immersive Run Into Prompt Detail Using Existing Execution Transport

**Interfaces:**
- Add `V5_IMMERSIVE_RUN`, default false.
- `PromptLibraryV5` receives `executionEnabled=false`, `immersiveRunEnabled=false` and passes them to detail.
- `PromptDetailV2` immersive mode is active only when `executionEnabled && immersiveRunEnabled`.
- In immersive mode, validation/rendering remains exactly the existing Variables V2 path; after validation `usePromptRun().run({ prompt: rendered.text })` executes the existing transport.
- When immersive mode is false, the existing `onRun` callback/fallback behavior remains unchanged.

- [ ] **Step 1: Extend `tests/feature-flags.test.mjs`** with `V5_IMMERSIVE_RUN` and strict default-off behavior.
- [ ] **Step 2: Add RED integration assertions** to `tests/immersive-run-ui-contract.test.mjs` for both `V5_EXECUTION_ENGINE` and `V5_IMMERSIVE_RUN`, plus an explicit logical conjunction in the detail path.
- [ ] **Step 3: Run RED.** `node --test tests/feature-flags.test.mjs tests/immersive-run-ui-contract.test.mjs tests/v5-prompt-detail-ui.test.mjs`.
- [ ] **Step 4: Add the flag** in `lib/ui/feature-flags.mjs`; wire booleans through `app/page.jsx` -> `PromptLibraryV5` -> `PromptDetailV2`.
- [ ] **Step 5: Integrate `usePromptRun` in `PromptDetailV2`.** Keep `values`, `fieldErrors`, rendered prompt, favorite/pin/copy, and Prompt Health behavior. On immersive Run, validate first, then call run with `rendered.text`. Stop does not clear values or rendered text.
- [ ] **Step 6: Use real model/provider defaults.** Pass provider `openai`; omit model when prompt has no explicit model so existing server validation/default remains authoritative (`gpt-5.6` currently). Do not add Claude/Gemini UI as enabled providers.
- [ ] **Step 7: Run GREEN regressions.** `node --test tests/feature-flags.test.mjs tests/immersive-run-ui-contract.test.mjs tests/v5-prompt-detail-ui.test.mjs tests/variables-v2.test.mjs`.
- [ ] **Step 8: Commit.** `git add lib/ui/feature-flags.mjs tests/feature-flags.test.mjs app/page.jsx components/prompt/PromptLibraryV5.jsx components/prompt/PromptDetailV2.jsx tests/immersive-run-ui-contract.test.mjs && git commit -m "feat: integrate immersive prompt execution"`.

## Task 6: Mobile Run Island, Localization, and Phase Verification

- [ ] **Step 1: Add responsive presentation.** On mobile, active Run control is a fixed/floating glass status island above `env(safe-area-inset-bottom)` and above the existing dock; desktop keeps the execution rail inside Prompt Detail. Do not cover output content; add bottom padding equal to dock + run island height.
- [ ] **Step 2: Add Thai translations** for Preparing, Running, Streaming, Completed, Failed, Stopped, Stop, Retry, Run Again, Jump to latest, Copy, Copied, Edit Prompt, input/output token labels, latency, provider, and model.
- [ ] **Step 3: Extend `tests/i18n-coverage.test.mjs`** for those visible strings.
- [ ] **Step 4: Run targeted tests.** `node --test tests/run-state.test.mjs tests/scroll-follow.test.mjs tests/immersive-run-ui-contract.test.mjs tests/i18n-coverage.test.mjs tests/v5-prompt-detail-ui.test.mjs`.
- [ ] **Step 5: Run full suite.** `npm test`; confirm exactly 80 built-in prompts and all Legacy/Variables/Health/Search/Workspace regressions pass.
- [ ] **Step 6: Build and artifact checks.** `npm run build && test -f .open-next/worker.js && test -d .open-next/assets && test -f .open-next/.build/open-next.config.edge.mjs`.
- [ ] **Step 7: Cloudflare dry-run.** `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`.
- [ ] **Step 8: Scope audit.** `git diff --name-only "$(git merge-base main HEAD)"...HEAD`; confirm `/api/ai/run` and provider code were not duplicated, no Supabase migration was added, and no production secret/config/deployment action occurred.
- [ ] **Step 9: Open Phase 4 PR and stop before merge.** Record exact tests/build/dry-run evidence and require a separate explicit `merge` authorization. Production deployment remains a separate approval.

# Prompt.OS V5 Phase 2 AI Tools and Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a unified execution engine, provider adapters, AI Improve V2, Evaluation Lab V2, Cost Guard, and telemetry while keeping OpenAI as the only live provider.

**Architecture:** Route Prompt Run, Improve, Evaluation, and later Workflow through one normalized execution boundary. Provider adapters isolate vendor details. Cost/telemetry are cross-cutting services invoked by the execution engine, not duplicated in feature code.

**Tech Stack:** Next 16.3.5, React 19.3.0, OpenAI 7.15.0, Node test runner, NDJSON streaming utilities already present in `lib/ai`.

**Spec:** `docs/superpowers/specs/2026-09-17-prompt-os-v5-complete-upgrade-design.md`

## Global Constraints
- OpenAI is live.
- Claude and Gemini are adapter-ready but disabled and must not make network calls.
- Provider secrets stay server-side.
- Normal one-shot prompt runs do not require confirmation.
- Multi-call Evaluation requires Cost Guard confirmation.
- AI Improve never overwrites the current prompt version automatically.
- AI Judge output is explicitly labeled AI-generated evaluation.
- No production Supabase changes.

---

## File Structure

**Create**
- `lib/execution/request.mjs`
- `lib/execution/run.mjs`
- `lib/execution/retry-policy.mjs`
- `lib/providers/registry.mjs`
- `lib/providers/openai.mjs`
- `lib/providers/anthropic.mjs`
- `lib/providers/gemini.mjs`
- `lib/analytics/cost-guard.mjs`
- `lib/analytics/telemetry.mjs`
- `lib/evaluation/rules.mjs`
- `lib/evaluation/judge.mjs`
- `lib/evaluation/suite.mjs`
- `components/improve/ImprovePanel.jsx`
- `components/improve/PromptDiff.jsx`
- `components/evaluation/EvaluationLab.jsx`
- `components/evaluation/TestCaseEditor.jsx`
- `components/evaluation/EvaluationResults.jsx`
- `components/analytics/CostGuard.jsx`
- `tests/execution-engine.test.mjs`
- `tests/provider-registry.test.mjs`
- `tests/cost-guard.test.mjs`
- `tests/evaluation-v2.test.mjs`

**Modify**
- `app/api/ai/run/route.*` according to the current route file extension.
- `lib/ai/run-stream.mjs`
- `lib/ai/validate-run-request.mjs`
- `lib/ai/improve-prompt.mjs`
- `components/PromptOS.jsx`
- `tests/ai-improve.test.mjs`
- `tests/evaluation-model.test.mjs`
- `tests/analytics-aggregate.test.mjs`

## Task 1: Normalize Execution Requests

**Interfaces:**
- `createExecutionRequest(input)` -> normalized request.
- Allowed `type`: `prompt | improve | evaluation | workflow`.
- Allowed status lifecycle: `queued -> running -> completed|failed|cancelled`.

- [ ] Write failing tests for required fields, type validation, prompt/version metadata, and non-mutation.
- [ ] Run `node --test tests/execution-engine.test.mjs` and confirm RED.
- [ ] Implement request normalization in `lib/execution/request.mjs`.
- [ ] Re-run and confirm GREEN.
- [ ] Commit `feat: add normalized execution requests`.

## Task 2: Provider Registry and Disabled Adapters

**Interfaces:**
- `getProvider(name)`.
- `listProviders()` returns OpenAI enabled, Anthropic disabled, Gemini disabled.
- Each provider exposes `run(request, context)` and `enabled`.

- [ ] Write failing registry tests proving disabled providers reject execution before any provider client/network invocation.
- [ ] Confirm RED.
- [ ] Implement `registry.mjs`, OpenAI adapter wrapping existing streaming helpers, and disabled adapters that return explicit configuration errors.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add provider adapter registry`.

## Task 3: Retry and Cancellation Policy

**Interfaces:**
- `isRetryableError(error)`.
- `runWithRetry(operation, { maxRetries: 2, signal })`.

- [ ] Write tests for 429/502/503/timeouts retrying, invalid request/missing key/context overflow not retrying, and AbortSignal cancellation.
- [ ] Confirm RED.
- [ ] Implement exponential backoff with at most 2 retries and abort-aware waiting.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add execution retry and cancellation policy`.

## Task 4: Unified Execution Engine

**Interfaces:**
- `executeRun(request, context)` returns normalized result containing status, latency, usage, estimatedCost, provider/model, and error when present.

- [ ] Add failing tests proving all execution types use provider registry and telemetry hooks.
- [ ] Confirm RED.
- [ ] Implement validation -> Cost Guard -> provider -> normalized result -> telemetry pipeline.
- [ ] Keep existing `/api/ai/run` streaming response contract compatible for Legacy.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add unified execution engine`.

## Task 5: Cost Guard

**Interfaces:**
- `estimateRunCost({ calls, inputTokens, outputTokens, model })`.
- `evaluateBudget({ monthlySpend, warningThreshold, hardLimit, estimate })`.

- [ ] Write failing tests for single-run no-confirm, multi-call estimate, warning-only behavior, disabled hard limit, and enabled hard-limit blocking.
- [ ] Confirm RED.
- [ ] Implement pure cost/budget functions; cost without provider billing reconciliation is always labeled estimated.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add v5 cost guard`.

## Task 6: Telemetry

**Interfaces:**
- `createUsageEvent(run)` stores operational metadata only: promptId, feature, provider, model, tokens, latency, cost, status, timestamp.
- `recordUsage(event, sink)` must be failure-tolerant.

- [ ] Add failing tests proving prompt/output full content is absent and telemetry sink failure does not convert successful run to failure.
- [ ] Confirm RED.
- [ ] Implement telemetry module and wire execution engine.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add execution telemetry`.

## Task 7: AI Improve V2

**Files:**
- Modify: `lib/ai/improve-prompt.mjs`
- Create: `components/improve/ImprovePanel.jsx`, `components/improve/PromptDiff.jsx`

- [ ] Extend `tests/ai-improve.test.mjs` with goals, structured changes, variable suggestions, no-secret/unrelated-workspace payload, and save-as-new-version semantics.
- [ ] Confirm RED.
- [ ] Update improve request builder to use execution engine and exact allowed context: prompt text, variable config, output format, usage guide, health report.
- [ ] Implement side-by-side Original/Improved UI with Discard, Copy, Save Draft, Save as New Version.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add ai improve v2`.

## Task 8: Rule-Based Evaluation

**Interfaces:**
- `evaluateRules(output, rules)` supporting required sections, valid JSON, required keyword, forbidden text, maximum length.

- [ ] Write failing rule tests.
- [ ] Confirm RED.
- [ ] Implement deterministic evaluators in `lib/evaluation/rules.mjs`.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add rule based evaluation`.

## Task 9: Evaluation Suites and AI Judge

**Interfaces:**
- `createEvaluationSuite`, `runEvaluationSuite`.
- `judgeEvaluation` returns score details plus `aiGenerated: true`, provider/model/rubric provenance.

- [ ] Write failing tests for A/B isolation, reusable cases, provenance, and call-count calculation.
- [ ] Confirm RED.
- [ ] Implement suite model and judge execution through unified engine.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add evaluation suites and ai judge`.

## Task 10: Evaluation Lab UI

**Files:**
- Create: `components/evaluation/EvaluationLab.jsx`, `TestCaseEditor.jsx`, `EvaluationResults.jsx`, `components/analytics/CostGuard.jsx`
- Modify: `components/PromptOS.jsx`

- [ ] Add structural UI tests for A/B selectors, cases, manual/rule/AI Judge mode, estimate confirmation, result table, history entry, and AI-generated label.
- [ ] Confirm RED.
- [ ] Implement gated UI and preserve prompt variable state when evaluation fails.
- [ ] Confirm GREEN.
- [ ] Commit `feat: add evaluation lab v2 ui`.

## Task 11: Full Verification

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Verify Claude/Gemini execution paths remain disabled.
- [ ] Verify no secret names/values are serialized to client execution state.
- [ ] Verify Legacy `/api/ai/run` behavior remains compatible.
- [ ] Commit `test: verify v5 ai and evaluation phase`.
- [ ] Open Phase 2 PR and stop before merge until explicit authorization.

# Prompt.OS V5 Phase 4 AI Improve & Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI Improve and an Evaluation Lab that compares prompt versions against explicit user-defined rubrics without silently replacing prompts or inventing winners.

**Architecture:** Reuse the existing authenticated OpenAI execution path. Put request validation, rubric scoring, call-count estimation, and result normalization in pure modules. UI only orchestrates these modules and persists selected outputs as new versions/results.

**Tech Stack:** OpenAI Responses API, existing Supabase auth token verification, React 19.3, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-prompt-os-v5-design.md`

## Global Constraints

- AI Improve may only offer Discard, Copy, and Save as New Version.
- Evaluation results display raw outputs and measured metrics.
- No overall winner unless a configured rubric/aggregation method produces it.
- Batch runs must show call count, estimated tokens, and estimated cost before execution.
- Reuse existing auth requirements and server-side API key handling.

---

### Task 1: Prompt improvement contract

**Files:**
- Create: `lib/ai/improve-prompt.mjs`
- Create: `app/api/ai/improve/route.js`
- Test: `tests/ai-improve.test.mjs`

**Interfaces:**
- `buildImproveInput({ prompt, health, language })` -> structured OpenAI input string
- `parseImproveResponse(text)` -> `{ improvedPrompt, rationale, checks }`.

- [ ] **Step 1: Write failing tests**

```js
const input = buildImproveInput({ prompt: 'Write about {{topic}}', health: { score: 2, max: 6 }, language: 'th' });
assert.match(input, /preserve.*\{\{topic\}\}/i);
assert.match(input, /role|context|constraints|output format/i);
```

`parseImproveResponse` must reject payloads without a non-empty `improvedPrompt`.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/ai-improve.test.mjs
```

- [ ] **Step 3: Implement helper and route**

The route follows the same bearer-token verification pattern as `app/api/ai/run/route.js`, rejects missing `OPENAI_API_KEY`, calls OpenAI server-side, and returns JSON rather than streaming because the result must be parsed atomically.

Expected JSON contract:

```json
{
  "improvedPrompt": "...",
  "rationale": ["..."],
  "checks": { "role": true, "context": true, "constraints": true, "outputFormat": true }
}
```

- [ ] **Step 4: Run focused tests**

```bash
node --test tests/ai-improve.test.mjs tests/ai-auth.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/improve-prompt.mjs app/api/ai/improve/route.js tests/ai-improve.test.mjs
git commit -m "feat: add authenticated AI prompt improvement API"
```

### Task 2: Improvement comparison UI

**Files:**
- Create: `components/prompts/ImprovePanel.jsx`
- Create: `lib/prompts/diff.mjs`
- Modify: `components/PromptOS.jsx`
- Modify: `lib/i18n/runtime.mjs`
- Test: `tests/improve-panel-contract.test.mjs`

**Interfaces:**
- `diffPromptText(before, after)` -> line records compatible with existing diff display concepts.
- `ImprovePanel({ prompt, onSaveVersion, onClose })`.

- [ ] **Step 1: Add failing tests**

Assert the component contains Original, AI Improved, Show Diff, Discard, Copy, Save as New Version and does not expose `Replace Current`.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/improve-panel-contract.test.mjs
```

- [ ] **Step 3: Implement UI**

On Save as New Version, call the existing version-creation path with a change note such as `AI Improve` and keep the previous current version in history.

- [ ] **Step 4: Run tests**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add components/prompts/ImprovePanel.jsx lib/prompts/diff.mjs components/PromptOS.jsx lib/i18n/runtime.mjs tests/improve-panel-contract.test.mjs
git commit -m "feat: add safe AI improve comparison workflow"
```

### Task 3: Evaluation domain and estimates

**Files:**
- Create: `lib/evaluation/model.mjs`
- Create: `lib/evaluation/estimate.mjs`
- Create: `lib/evaluation/scoring.mjs`
- Test: `tests/evaluation-model.test.mjs`

**Interfaces:**
- `normalizeEvaluationSuite(raw)`
- `estimateEvaluationRun({ cases, candidates, estimatedTokensPerCall, price })`
- `aggregateRubricScores(results, rubric)` -> metric summary, optional aggregate only when rubric defines weights.

- [ ] **Step 1: Write failing tests**

```js
const estimate = estimateEvaluationRun({ cases: [{}, {}, {}], candidates: [{}, {}], estimatedTokensPerCall: 1000, price: { per1000Tokens: 0.002 } });
assert.equal(estimate.calls, 6);
assert.equal(estimate.estimatedTokens, 6000);
assert.equal(estimate.estimatedCost, 0.012);
```

Add a scoring test proving that an unweighted rubric returns metric summaries without a winner field.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/evaluation-model.test.mjs
```

- [ ] **Step 3: Implement pure evaluation modules**

Suite shape includes `{ id, name, cases, candidateVersionIds, rubric }`. Rubric criteria include `{ id, label, weight? }`. Aggregation only computes a weighted total when all required weights/method are explicitly configured.

- [ ] **Step 4: Verify focused tests**

```bash
node --test tests/evaluation-model.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add lib/evaluation tests/evaluation-model.test.mjs
git commit -m "feat: add evaluation domain and pre-run estimates"
```

### Task 4: Evaluation execution and Lab UI

**Files:**
- Create: `app/api/ai/evaluate/route.js`
- Create: `components/evaluation/EvaluationLab.jsx`
- Create: `components/evaluation/TestCaseEditor.jsx`
- Create: `components/evaluation/RubricEditor.jsx`
- Create: `components/evaluation/Scoreboard.jsx`
- Modify: `components/PromptOS.jsx`
- Test: `tests/evaluation-api-contract.test.mjs`
- Test: `tests/evaluation-ui-contract.test.mjs`

**Interfaces:**
- POST `/api/ai/evaluate` consumes `{ renderedPrompt, rubric, model }` and returns `{ output, rubricScores, usage }` for one candidate/case pair.
- Client batch scheduler executes pairs sequentially or with a small fixed concurrency of 2 to avoid bursty requests.

- [ ] **Step 1: Add failing API/UI contract tests**

Assert auth reuse, OpenAI key server-side only, raw output presence, usage metadata, rubric display, and pre-run confirmation.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/evaluation-api-contract.test.mjs tests/evaluation-ui-contract.test.mjs
```

- [ ] **Step 3: Implement route and Lab**

The route instructs the model to return rubric scores as strict JSON plus an answer body. The server validates criterion IDs and clamps numeric scores to the configured scale. UI stores each pair result independently so partial failures are visible and retryable.

- [ ] **Step 4: Verify Phase 4**

```bash
npm test
npm run build
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

- [ ] **Step 5: Commit**

```bash
git add app/api/ai/evaluate components/evaluation components/PromptOS.jsx tests/evaluation-api-contract.test.mjs tests/evaluation-ui-contract.test.mjs
git commit -m "feat: add Prompt Evaluation Lab"
```
# Prompt.OS V5 Phase 5 Analytics & Cost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable usage telemetry, versioned pricing snapshots, budget alerts, aggregates, and the Cost & Usage Center.

**Architecture:** Treat every completed or failed AI execution as an immutable usage event. Compute cost from a versioned pricing table at event creation time and persist the resulting estimate so historical events never change when prices change. Build dashboard summaries from bounded date ranges and aggregate helpers rather than reducing the full history on every render.

**Tech Stack:** Existing OpenAI usage metadata, Supabase V5 usage tables, React 19.3, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-prompt-os-v5-design.md`

## Global Constraints

- Label all monetary metrics `Estimated Cost`.
- Store pricing version/effective date used by each event.
- Failed runs remain visible with status and error code.
- Budget warning never blocks unless `hardLimitEnabled` is true.
- Historical usage rows are immutable except administrative cleanup.

---

### Task 1: Pricing and usage event model

**Files:**
- Create: `lib/analytics/pricing.mjs`
- Create: `lib/analytics/usage-event.mjs`
- Test: `tests/usage-cost.test.mjs`

**Interfaces:**
- `findPricingSnapshot(pricingRows, provider, model, at)`
- `estimateRunCost({ inputTokens, outputTokens, pricing })`
- `createUsageEvent(meta)` -> normalized immutable event.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateRunCost } from '../lib/analytics/pricing.mjs';

test('cost uses separate input and output rates', () => {
  const cost = estimateRunCost({
    inputTokens: 1000,
    outputTokens: 500,
    pricing: { inputPerMillion: 2, outputPerMillion: 8 },
  });
  assert.equal(cost, 0.006);
});
```

Add a date-selection test proving a historical event chooses the pricing row whose `effectiveFrom` is the latest value not after the event timestamp.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/usage-cost.test.mjs
```

- [ ] **Step 3: Implement pricing helpers**

Normalize estimated cost to a finite non-negative number and round only for display, not storage. `createUsageEvent` stores `pricingEffectiveFrom`, `estimatedCost`, provider, model, prompt/version IDs, evaluation run ID, token counts, latency, status, error code, and timestamp.

- [ ] **Step 4: Verify focused tests**

```bash
node --test tests/usage-cost.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add lib/analytics tests/usage-cost.test.mjs
git commit -m "feat: add pricing snapshots and usage event model"
```

### Task 2: Aggregation and budget logic

**Files:**
- Create: `lib/analytics/aggregate.mjs`
- Create: `lib/analytics/budget.mjs`
- Test: `tests/analytics-aggregate.test.mjs`

**Interfaces:**
- `aggregateUsage(events, { from, to })` -> totals plus provider/model/prompt buckets.
- `evaluateBudget({ spent, limit, warningPercent, hardLimitEnabled, nextEstimatedCost })` -> `{ state, projected, shouldWarn, shouldBlock }`.

- [ ] **Step 1: Write failing tests**

```js
const budget = evaluateBudget({ spent: 8, limit: 10, warningPercent: 80, hardLimitEnabled: false, nextEstimatedCost: 3 });
assert.equal(budget.shouldWarn, true);
assert.equal(budget.shouldBlock, false);

const hard = evaluateBudget({ spent: 9.5, limit: 10, warningPercent: 80, hardLimitEnabled: true, nextEstimatedCost: 1 });
assert.equal(hard.shouldBlock, true);
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/analytics-aggregate.test.mjs
```

- [ ] **Step 3: Implement bounded aggregation**

`aggregateUsage` ignores events outside the requested window and returns:

```js
{
  runs, inputTokens, outputTokens, estimatedCost, averageLatencyMs, errorRate,
  byProvider: {}, byModel: {}, byPrompt: {}, byDay: {}
}
```

- [ ] **Step 4: Verify focused tests**

```bash
node --test tests/analytics-aggregate.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/aggregate.mjs lib/analytics/budget.mjs tests/analytics-aggregate.test.mjs
git commit -m "feat: add usage aggregation and budget rules"
```

### Task 3: Capture usage from AI runs

**Files:**
- Modify: `lib/ai/run-stream.mjs`
- Modify: `components/PromptOS.jsx`
- Modify: `components/evaluation/EvaluationLab.jsx`
- Create: `lib/cloud/usage-client.js`
- Test: `tests/usage-capture-contract.test.mjs`

**Interfaces:**
- `recordUsageEvent(event)` persists through the authenticated Supabase client when Cloud V5 is available and mirrors the event to local cache when offline.

- [ ] **Step 1: Add failing contract tests**

Assert that normal AI runs and evaluation runs both pass `inputTokens`, `outputTokens`, `latencyMs`, provider, model, status, and prompt/version IDs into `recordUsageEvent`.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/usage-capture-contract.test.mjs
```

- [ ] **Step 3: Wire usage capture**

On stream meta, create a successful event. On terminal error, create a failed event with any known partial metadata. Do not double-record one run; assign a run/event ID before execution and use it as the deduplication key.

- [ ] **Step 4: Verify tests**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/run-stream.mjs lib/cloud/usage-client.js components/PromptOS.jsx components/evaluation/EvaluationLab.jsx tests/usage-capture-contract.test.mjs
git commit -m "feat: capture AI usage telemetry"
```

### Task 4: Cost & Usage Center UI

**Files:**
- Create: `components/analytics/UsageDashboard.jsx`
- Create: `components/analytics/UsageFilters.jsx`
- Create: `components/analytics/BudgetCard.jsx`
- Create: `components/analytics/UsageTrend.jsx`
- Modify: `components/PromptOS.jsx`
- Modify: `lib/i18n/runtime.mjs`
- Test: `tests/analytics-ui-contract.test.mjs`

**Interfaces:**
- `UsageDashboard({ events, pricing, budget, filters, onFiltersChange, onBudgetChange })`.

- [ ] **Step 1: Add failing source-contract test**

Assert labels for Runs, Tokens, Estimated Cost, Errors, Today, 7D, 30D, Custom, Provider, Model, Workspace, Prompt, Monthly Budget and Hard Budget Limit.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/analytics-ui-contract.test.mjs
```

- [ ] **Step 3: Implement dashboard**

Use simple CSS/SVG bars/lines rather than adding a chart dependency. Keep each chart/metric card focused and derive data with `useMemo` from bounded filtered events.

- [ ] **Step 4: Verify Phase 5**

```bash
npm test
npm run build
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

- [ ] **Step 5: Commit**

```bash
git add components/analytics components/PromptOS.jsx lib/i18n/runtime.mjs tests/analytics-ui-contract.test.mjs
git commit -m "feat: add V5 cost and usage center"
```
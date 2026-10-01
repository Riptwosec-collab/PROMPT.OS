# Prompt.OS V5 Phase 2 Workspace & Variables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Workspace V2, folders, saved views, structured Variables V2, and a modular prompt inspector without breaking existing prompt data.

**Architecture:** Add pure workspace/variable domain modules first, then adapt the existing local database shape with backward-compatible defaults. UI components consume these pure interfaces; `PromptOS.jsx` delegates instead of reimplementing domain logic.

**Tech Stack:** React 19.3, existing localStorage database, Node test runner, existing prompt renderer.

**Spec:** `docs/superpowers/specs/2026-09-16-prompt-os-v5-design.md`

## Global Constraints

- Existing prompts without workspace/folder data migrate to workspace `personal` and no folder.
- Smart views query data; they never duplicate prompt records.
- Empty variable input keeps `{{variable}}` unchanged.
- Keep existing collections for compatibility; workspace is the new primary hierarchy.

---

### Task 1: Workspace domain model

**Files:**
- Create: `lib/workspace/model.mjs`
- Create: `lib/workspace/smart-views.mjs`
- Test: `tests/workspace-model.test.mjs`

**Interfaces:**
- `normalizeWorkspaceState(raw)` -> `{ workspaces, folders }`
- `movePrompt(prompts, promptId, workspaceId, folderId)` -> new prompt array
- `reorderByIds(items, orderedIds)` -> new item array
- `applySmartView(prompts, view, now)` -> filtered prompt array.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWorkspaceState, movePrompt } from '../lib/workspace/model.mjs';

test('legacy data gets a default personal workspace', () => {
  const state = normalizeWorkspaceState({});
  assert.equal(state.workspaces[0].id, 'personal');
});

test('movePrompt changes metadata without duplicating prompt', () => {
  const result = movePrompt([{ id: 'p1', title: 'A' }], 'p1', 'work', 'network');
  assert.equal(result.length, 1);
  assert.equal(result[0].workspaceId, 'work');
  assert.equal(result[0].folderId, 'network');
});
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/workspace-model.test.mjs
```

- [ ] **Step 3: Implement minimal immutable helpers**

Default workspace record:

```js
{ id: 'personal', name: 'PERSONAL', order: 0, archivedAt: null }
```

Folder records contain `{ id, workspaceId, name, order, archivedAt }`.

- [ ] **Step 4: Verify tests**

```bash
node --test tests/workspace-model.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add lib/workspace tests/workspace-model.test.mjs
git commit -m "feat: add workspace domain model"
```

### Task 2: Variables V2 schema and validation

**Files:**
- Create: `lib/variables/schema.mjs`
- Create: `lib/variables/runtime.mjs`
- Modify: `lib/prompts/render.mjs`
- Test: `tests/variables-v2.test.mjs`
- Modify: `tests/prompt-rendering.test.mjs`

**Interfaces:**
- `VARIABLE_TYPES = ['text','textarea','number','select','multi-select','toggle','date','url']`
- `normalizeVariableSchema(promptText, schema)` -> normalized object
- `validateVariableValues(schema, values)` -> `{ valid, errors }`
- `renderVariableValues(prompt, values, schema)` -> string.

- [ ] **Step 1: Write failing tests**

```js
test('detected placeholders become text fields while explicit schema wins', () => {
  const schema = normalizeVariableSchema('Write about {{topic}} in {{language}}', {
    language: { type: 'select', options: ['Thai','English'], default: 'Thai' },
  });
  assert.equal(schema.topic.type, 'text');
  assert.equal(schema.language.type, 'select');
});

test('blank text preserves placeholder', () => {
  assert.equal(renderVariableValues('Hi {{name}}', { name: '' }, { name: { type: 'text' } }), 'Hi {{name}}');
});
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/variables-v2.test.mjs tests/prompt-rendering.test.mjs
```

- [ ] **Step 3: Implement schema normalization and validation**

Required rules: required text rejects blank; number rejects non-finite values; select accepts only configured options; multi-select requires an array and configured options; URL uses `new URL(value)` validation when nonblank.

- [ ] **Step 4: Verify focused tests**

```bash
node --test tests/variables-v2.test.mjs tests/prompt-rendering.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add lib/variables lib/prompts/render.mjs tests/variables-v2.test.mjs tests/prompt-rendering.test.mjs
git commit -m "feat: add structured prompt variables"
```

### Task 3: Backward-compatible local schema migration

**Files:**
- Create: `lib/prompts/local-db-v5.mjs`
- Modify: `components/PromptOS.jsx`
- Test: `tests/local-db-v5.test.mjs`

**Interfaces:**
- `upgradeLocalDatabaseV5(raw)` preserves all prompts and adds `workspaces`, `folders`, `savedViews`, prompt `workspaceId`, `folderId`, `variableSchema`.

- [ ] **Step 1: Add a failing legacy migration test**

```js
const legacy = { schemaVersion: 4, prompts: [{ id: 1, title: 'Legacy', prompt: 'Hi {{name}}' }] };
const next = upgradeLocalDatabaseV5(legacy);
assert.equal(next.prompts.length, 1);
assert.equal(next.prompts[0].workspaceId, 'personal');
assert.equal(next.prompts[0].variableSchema.name.type, 'text');
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/local-db-v5.test.mjs
```

- [ ] **Step 3: Implement migration and delegate PromptOS normalization to it**

Do not delete legacy `collections` or `variables`; preserve them so export/import remains backward compatible during V5 rollout.

- [ ] **Step 4: Run full tests**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add lib/prompts/local-db-v5.mjs components/PromptOS.jsx tests/local-db-v5.test.mjs
git commit -m "refactor: migrate local prompt state to V5 workspace schema"
```

### Task 4: Workspace explorer, variable builder, and prompt inspector

**Files:**
- Create: `components/workspace/WorkspaceExplorer.jsx`
- Create: `components/workspace/SavedViews.jsx`
- Create: `components/prompts/VariableBuilder.jsx`
- Create: `components/prompts/VariableRuntimeForm.jsx`
- Create: `components/prompts/PromptInspector.jsx`
- Modify: `components/PromptOS.jsx`
- Modify: `lib/i18n/runtime.mjs`
- Test: `tests/workspace-ui-contract.test.mjs`

**Interfaces:**
- UI receives domain data/handlers only; it does not write localStorage directly.

- [ ] **Step 1: Add failing contract tests**

Check source for WorkspaceExplorer, SavedViews, VariableBuilder, VariableRuntimeForm, PromptInspector and required action labels (`RUN`, `IMPROVE`, `COPY`, `TEST`, `VERSION`).

- [ ] **Step 2: Verify failure**

```bash
node --test tests/workspace-ui-contract.test.mjs
```

- [ ] **Step 3: Implement components and wire them to existing CRUD handlers**

Drag/drop calls `movePrompt`; variable form calls `validateVariableValues` before run; inspector reads prompt metadata and current version but does not own persistence.

- [ ] **Step 4: Verify Phase 2**

```bash
npm test
npm run build
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

- [ ] **Step 5: Commit**

```bash
git add components/workspace components/prompts components/PromptOS.jsx lib/i18n/runtime.mjs tests/workspace-ui-contract.test.mjs
git commit -m "feat: add workspace explorer and Variables V2 UI"
```
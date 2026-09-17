# Prompt.OS V5 Phase 1 Core Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Search V2, Prompt Detail V2, Variables V2, Prompt Health, Smart Collections, Recent/Most Used, Prompt Packs, and workspace foundations behind feature flags while preserving the Legacy Library.

**Architecture:** Build pure local services first, then thin React surfaces that consume them. Search and health scoring remain client-local. Prompt records stay single-source; workspace/folder/pack membership stores references rather than cloned prompts.

**Tech Stack:** Next 16.3.5, React 19.3.0, Node test runner, Tailwind 4.3.3.

**Spec:** `docs/superpowers/specs/2026-09-17-prompt-os-v5-complete-upgrade-design.md`

## Global Constraints
- 80 built-in prompts preserved.
- TH/EN metadata remains searchable.
- Legacy Library stays available.
- Feature flags default off until the phase PR is verified.
- No production DB changes.
- TDD for each task.

---

## File Structure

**Create**
- `lib/search/prompt-index.mjs`
- `lib/search/prompt-search.mjs`
- `lib/variables/render-prompt.mjs`
- `lib/variables/validate-variables.mjs`
- `lib/prompts/health-score.mjs`
- `lib/prompts/smart-collections.mjs`
- `lib/prompts/packs.mjs`
- `lib/workspace/model.mjs`
- `components/prompt/PromptSearch.jsx`
- `components/prompt/PromptDetailV2.jsx`
- `components/prompt/PromptVariableForm.jsx`
- `components/prompt/PromptHealth.jsx`
- `components/prompt/PromptPacks.jsx`
- `components/workspace/WorkspaceSidebar.jsx`
- `tests/search-v2.test.mjs`
- `tests/variables-v2.test.mjs`
- `tests/prompt-health-v2.test.mjs`
- `tests/smart-collections.test.mjs`
- `tests/workspace-model.test.mjs`

**Modify**
- `components/PromptOS.jsx`
- `components/LanguageRuntime.jsx` only where explicit metadata localization wiring is required.
- `tests/i18n-complete.test.mjs`
- `tests/i18n-coverage.test.mjs`

## Task 1: Weighted TH/EN Search V2

**Interfaces:**
- `buildPromptSearchDocument(prompt)`
- `searchPrompts(prompts, query, filters = {})`

- [ ] Write failing tests proving title/titleTh outrank body-only matches and Thai queries match Thai metadata.
- [ ] Run `node --test tests/search-v2.test.mjs` and confirm RED.
- [ ] Implement token normalization, weighted fields, stable deterministic ranking, and filters for favorite/recent/category/difficulty/source/hasVariables.
- [ ] Re-run and confirm GREEN.
- [ ] Commit with `feat: add weighted prompt search v2`.

## Task 2: Variables V2 Renderer and Validation

**Interfaces:**
- `validatePromptVariables(variableConfig, values)` -> `{ ok, errors }`
- `renderPromptTemplate(template, variableConfig, values)` -> `{ text, unresolvedRequired }`

- [ ] Write failing tests for required vs optional fields, select/multi-select/boolean/date/url/code/language/file values, and Thai default language behavior.
- [ ] Run `node --test tests/variables-v2.test.mjs` and confirm RED.
- [ ] Implement pure validation and rendering. Optional unresolved placeholders are removed or rendered according to field policy; required unresolved placeholders are returned in `unresolvedRequired` and block execution.
- [ ] Re-run and confirm GREEN.
- [ ] Commit with `feat: add variables v2 rendering and validation`.

## Task 3: Local Prompt Health Scoring

**Interfaces:**
- `scorePromptHealth(prompt)` -> `{ total, categories, findings }`.

- [ ] Write failing tests for structure, context, variables, constraints, output format, and reliability categories.
- [ ] Run `node --test tests/prompt-health-v2.test.mjs` and confirm RED.
- [ ] Implement deterministic local scoring with category-level reasons; no AI call.
- [ ] Re-run and confirm GREEN.
- [ ] Commit with `feat: add local prompt health scoring`.

## Task 4: Smart Collections and Usage Selectors

**Interfaces:**
- `buildSmartCollections(prompts, now)`.
- Collections include favorites, pinned, recently used, most used, recently added, advanced, has variables, quick prompts.

- [ ] Write failing tests with fixed timestamps and run/copy counts.
- [ ] Run `node --test tests/smart-collections.test.mjs` and confirm RED.
- [ ] Implement deterministic selectors without mutating source prompts.
- [ ] Re-run and confirm GREEN.
- [ ] Commit with `feat: add smart prompt collections`.

## Task 5: Prompt Packs

**Interfaces:**
- `createPack({ id, name, promptIds })`, `addPromptToPack(pack, promptId)`, `removePromptFromPack(pack, promptId)`.

- [ ] Extend `tests/smart-collections.test.mjs` with duplicate-prevention and multi-pack membership cases.
- [ ] Confirm RED.
- [ ] Implement reference-only pack membership; never clone prompt objects.
- [ ] Confirm GREEN.
- [ ] Commit with `feat: add prompt packs`.

## Task 6: Workspace and Folder Foundation

**Interfaces:**
- `createWorkspace`, `createFolder`, `movePromptToFolder`, `removePromptFromFolder`.
- Prompt identity remains global; folder membership references prompt IDs.

- [ ] Write failing tests proving move does not duplicate prompt records and deleted folders do not delete prompts.
- [ ] Run `node --test tests/workspace-model.test.mjs` and confirm RED.
- [ ] Implement pure workspace/folder model.
- [ ] Re-run and confirm GREEN.
- [ ] Commit with `feat: add workspace folder model`.

## Task 7: Prompt Search UI

**Files:**
- Create: `components/prompt/PromptSearch.jsx`
- Modify: `components/PromptOS.jsx`

- [ ] Add a structural regression test asserting `V5_SEARCH` gates the new search surface and Legacy search remains when off.
- [ ] Confirm RED.
- [ ] Implement search box, quick filters, category/difficulty/source/hasVariables filters, TH/EN result labels, keyboard focus behavior.
- [ ] Confirm targeted tests GREEN.
- [ ] Commit with `feat: add prompt search v2 ui`.

## Task 8: Prompt Detail V2 and Smart Variable Form

**Files:**
- Create: `components/prompt/PromptDetailV2.jsx`
- Create: `components/prompt/PromptVariableForm.jsx`
- Create: `components/prompt/PromptHealth.jsx`
- Modify: `components/PromptOS.jsx`

- [ ] Add UI contract tests for desktop three-region structure, mobile section ordering, required-field error state, and preserved values after run failure.
- [ ] Confirm RED.
- [ ] Implement metadata/health region, typed variable controls, rendered preview, and primary actions. Do not wire new AI execution yet; reuse current run seam.
- [ ] Confirm GREEN.
- [ ] Commit with `feat: add prompt detail and variables v2 ui`.

## Task 9: Packs, Workspace Sidebar, Recent/Most Used UI

**Files:**
- Create: `components/prompt/PromptPacks.jsx`
- Create: `components/workspace/WorkspaceSidebar.jsx`
- Modify: `components/PromptOS.jsx`

- [ ] Add integration tests for reference-only membership and Legacy fallback visibility.
- [ ] Confirm RED.
- [ ] Implement workspace tree, smart collections, packs, Continue Working, Recent/Most Used surfaces.
- [ ] Confirm GREEN.
- [ ] Commit with `feat: add workspace and prompt discovery surfaces`.

## Task 10: Localization and Full Phase Verification

- [ ] Extend `tests/i18n-complete.test.mjs` and `tests/i18n-coverage.test.mjs` for new TH/EN labels and dynamic prompt metadata.
- [ ] Run targeted i18n tests; fix only missing localization paths, not prompt content.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Verify 80 prompts, Legacy fallback, and default-off flags.
- [ ] Commit with `test: verify v5 core experience`.
- [ ] Open Phase 1 PR and stop before merge until explicit authorization.

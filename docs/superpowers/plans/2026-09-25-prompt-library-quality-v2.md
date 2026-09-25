# Prompt.OS — Prompt Library Quality V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade all existing built-in prompts with practical Thai explanation metadata, preserve the current 80 prompt identities and user state, add exactly 20 genuinely new executable prompts for an exact 100-prompt catalog, and surface the explanation in Prompt Detail without changing the existing Run Workspace execution boundary.

**Architecture:** Keep `AI_PROMPT_LIBRARY` as the single built-in catalog and keep `/api/ai/run` plus the Phase 4 Run Workspace as the only execution path. Add static Quality V2 metadata overlays, a deterministic validator, 20 new prompt specs, Thai variable presentation fields, and a default-off `V5_PROMPT_EXPLAINER` presentation flag. Catalog metadata is normalized before export; user-created/imported prompts remain backward compatible and do not need the built-in Quality V2 contract.

**Tech Stack:** Next.js 16.3.5, React 19.3.0, Node.js `node:test`, existing Prompt.OS catalog/render/validation modules, OpenNext Cloudflare, Wrangler.

**Spec:** `docs/superpowers/specs/2026-09-25-prompt-library-quality-v2-design.md`

## Global Constraints

- Built-in catalog becomes **exactly 100 prompts**: preserve all existing 80 prompt IDs and add exactly 20 unique new IDs.
- Existing Favorites, Pins, ratings, copy counts, run counts, results, user collections, compatible variable values, and existing created dates must survive catalog hydration/upgrades.
- Built-in prompts require Thai `displayTitleTh`, `descriptionTh`, `purposeTh`, `useCasesTh`, `inputGuideTh`, `expectedOutputTh`, and `exampleInputTh`.
- Required variables require Thai labels and practical Thai help.
- Prompt templates must render with no unresolved required placeholders after valid values are supplied.
- Empty required values continue to block execution.
- Keep `PromptDetailV2 → RunWorkspace → /api/ai/run`; do not add a second runner or execution engine.
- Add `V5_PROMPT_EXPLAINER`; it defaults false.
- Do not add `NEO_MODE` or another parallel global mode.
- `translateComplete()` remains fallback only; built-in Quality V2 explanations are explicit static metadata.
- No production Supabase DDL, schema migration, vector search, marketplace, agents, or runtime AI-generated descriptions.
- No examples may contain secrets, credentials, tokens, private keys, fabricated sources, or fake telemetry.
- Financial research prompts remain factual/research-oriented and do not output personalized buy/sell instructions.
- New security prompts remain defensive analysis/troubleshooting.
- TDD RED → GREEN for every implementation task.
- Draft PR only; do not merge without a separate explicit `merge` command.
- Do not manually production-deploy this feature branch.

## Final 20-Prompt Addition Set After Duplicate Audit

The approved spec explicitly requires replacement when implementation audit proves semantic duplication. The existing 80 already contain `NETWORK_TROUBLESHOOTER`, `API_ERROR_TROUBLESHOOTER`, `SQL_PERFORMANCE_DIAGNOSTIC`, `KPI_VARIANCE_INVESTIGATOR`, `CLAIM_EVIDENCE_MAP_BUILDER`, `INCIDENT_POSTMORTEM_BUILDER`, `STUDY_PLAN_GENERATOR`, and related planning/review prompts. Therefore these spec candidates are replaced before product implementation: `Network Incident Fault Isolation`, `API Integration Debugger`, `SQL Query Performance Diagnoser`, `KPI Movement Root Cause Analyzer`, `Evidence Matrix Builder`, `Incident Postmortem Builder`, and `Certification Study Planner`.

The final exact addition set is:

1. `ROUTING_PATH_REACHABILITY_ANALYZER` — Routing Path & Reachability Analyzer
2. `CISCO_SWITCH_PORT_TROUBLESHOOTER` — Cisco Switch Port Troubleshooter
3. `WIFI_8021X_NAC_TROUBLESHOOTER` — Wi-Fi / 802.1X / NAC Troubleshooter
4. `FIREWALL_ACL_TRAFFIC_ANALYZER` — Firewall / ACL Traffic Analyzer
5. `VPN_TROUBLESHOOTER` — VPN Troubleshooter
6. `SECURITY_ALERT_TRIAGE` — Security Alert Triage
7. `PHISHING_EMAIL_ANALYZER` — Phishing Email Analyzer
8. `CI_CD_PIPELINE_FAILURE_ANALYZER` — CI/CD Pipeline Failure Analyzer
9. `PRODUCTION_DEPLOYMENT_READINESS_REVIEWER` — Production Deployment Readiness Reviewer
10. `RUNTIME_CONFIGURATION_DRIFT_ANALYZER` — Runtime Configuration Drift Analyzer
11. `DATABASE_LOCK_BLOCKING_ANALYZER` — Database Lock & Blocking Analyzer
12. `CSV_EXCEL_DATA_QUALITY_ANALYZER` — CSV / Excel Data Quality Analyzer
13. `FUNNEL_DROP_OFF_ANALYZER` — Funnel Drop-off Analyzer
14. `EVIDENCE_GAP_ASSUMPTION_AUDITOR` — Evidence Gap & Assumption Auditor
15. `REQUIREMENTS_TRADE_OFF_ANALYZER` — Requirements Trade-off Analyzer
16. `INCIDENT_TIMELINE_RECONSTRUCTOR` — Incident Timeline Reconstructor
17. `PROFESSIONAL_MESSAGE_EMAIL_BUILDER` — Professional Message & Email Builder
18. `TRAVEL_RESEARCH_PLANNER` — Travel Research Planner
19. `PUBLIC_COMPANY_RESEARCH_BRIEF` — Public Company Research Brief
20. `CERTIFICATION_READINESS_GAP_ANALYZER` — Certification Readiness Gap Analyzer

Intent boundaries that must remain explicit:

- `CI_CD_PIPELINE_FAILURE_ANALYZER` diagnoses a **specific failed pipeline execution from logs**; existing `CI_CD_PIPELINE_REVIEWER` reviews pipeline design/configuration.
- `TRAVEL_RESEARCH_PLANNER` structures research and decision inputs before itinerary selection; existing `TRAVEL_ITINERARY_OPTIMIZER` optimizes an existing itinerary.
- `SECURITY_ALERT_TRIAGE` focuses on security alert evidence, containment checks, and escalation context; existing `INCIDENT_TRIAGE_COORDINATOR` is general operational incident coordination.
- `CSV_EXCEL_DATA_QUALITY_ANALYZER` evaluates supplied data/sample quality; existing `DATA_QUALITY_RULE_DESIGNER` designs future validation rules.

## Review Focus

1. **Stored 80-prompt user state:** upgrading to 100 must preserve old IDs and user activity while appending each new prompt once; Task 5 owns migration/idempotency tests.
2. **Placeholder/config drift:** every required placeholder must have config/help and render cleanly with fixture values; Tasks 1, 2, 3, 4, and 8 own these tests.
3. **Malformed Quality V2 metadata:** built-ins must fail tests rather than silently fall back, while user-created prompts remain accepted; Task 1 owns validator boundary tests.
4. **Thai form accessibility:** help text and errors must both be associated with the correct control and Thai placeholders must not break existing input types; Task 6 owns these tests.
5. **Explainer rollout disabled:** when `V5_PROMPT_EXPLAINER=false`, existing Prompt Detail and the Phase 4 execution path must behave unchanged; Task 7 owns flag/fallback tests.

---

## File Structure

### New focused catalog files

- `lib/prompts/catalog/quality-v2/metadata-core.mjs` — explicit Thai metadata for the original 30 prompts.
- `lib/prompts/catalog/quality-v2/metadata-researched-a.mjs` — explicit Thai metadata for researched prompts 1–25.
- `lib/prompts/catalog/quality-v2/metadata-researched-b.mjs` — explicit Thai metadata for researched prompts 26–50.
- `lib/prompts/catalog/quality-v2/variable-labels.mjs` — reusable Thai labels for canonical variable keys.
- `lib/prompts/catalog/quality-v2/new-prompts.mjs` — the exact 20 new prompt specs above.
- `lib/prompts/catalog/quality-v2/index.mjs` — combines metadata maps and enriches normalized built-ins.
- `lib/prompts/quality-validator.mjs` — deterministic Quality V2 validator; no UI responsibilities.
- `tests/fixtures/prompt-catalog-baseline-80.mjs` — immutable snapshot of the 80 IDs from `main` before this release.
- `tests/prompt-quality-v2.test.mjs` — metadata/validator/executability coverage.
- `tests/prompt-quality-v2-ui.test.mjs` — explainer/variable UI contract tests.

### Existing files to modify

- `lib/prompts/ai-prompt-library.mjs` — integrate Quality V2 enrichment, new prompt specs, version bump, and keep merge semantics.
- `components/prompt/PromptVariableForm.jsx` — render Thai help/placeholder accessibly.
- `components/prompt/PromptDetailV2.jsx` — flag-gated explanation sections.
- `components/prompt/PromptLibraryV5.jsx` — forward explainer flag only; no execution logic changes.
- `app/page.jsx` — read and pass `V5_PROMPT_EXPLAINER`.
- `lib/ui/feature-flags.mjs` — add default-off flag.
- `.env.example` — document `NEXT_PUBLIC_V5_PROMPT_EXPLAINER=false`.
- `tests/prompt-catalog.test.mjs` — 80 → 100 baseline and merge assertions.
- `tests/researched-prompt-catalog.test.mjs` — retain existing 50-specific regression while total becomes 100.
- `tests/prompt-localization-usage.test.mjs` — extend Thai explanation coverage.
- `tests/variables-v2.test.mjs` — Thai form presentation/accessibility tests.
- `tests/v5-prompt-detail-ui.test.mjs` — explainer enabled/disabled contract.
- `tests/feature-flags.test.mjs` and `tests/feature-flag-integration.test.mjs` — new flag wiring.
- `tests/search-v2.test.mjs` — Thai title/description search regression.
- `tests/prompt-os-catalog-integration.test.mjs` — PromptOS hydration count/identity regression.

---

### Task 1: Quality V2 Contract and Deterministic Validator

**Files:**
- Create: `lib/prompts/quality-validator.mjs`
- Create: `lib/prompts/catalog/quality-v2/variable-labels.mjs`
- Create: `lib/prompts/catalog/quality-v2/index.mjs`
- Create: `tests/prompt-quality-v2.test.mjs`

**Interfaces:**
- Produces: `validateBuiltInPrompt(prompt) -> { ok, errors, warnings }`.
- Produces: `validatePromptCatalog(prompts) -> { ok, errors, warnings, results }`.
- Produces: `enrichBuiltInPrompt(prompt, metadataMap?) -> prompt`.
- Produces: `THAI_VARIABLE_LABELS` keyed by canonical variable name.
- Consumes later: Tasks 2–5 use the metadata/enrichment contract; Task 8 uses the validator for all 100.

- [ ] **Step 1: Write RED validator tests.**

Add tests for a valid fixture plus explicit failures for missing `purposeTh`, non-array `useCasesTh`, missing required-variable help, placeholder/config mismatch, invalid select defaults, and a user-created prompt that is not forced through the built-in validator.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBuiltInPrompt } from '../lib/prompts/quality-validator.mjs';

const valid = {
  id: 'ai-lib-test',
  name: 'TEST',
  displayTitle: 'Test',
  displayTitleTh: 'ทดสอบ',
  descriptionTh: 'ใช้ทดสอบสัญญา Quality V2',
  purposeTh: 'ช่วยตรวจสัญญาข้อมูลของพรอมต์',
  useCasesTh: ['ตรวจพรอมต์'],
  inputGuideTh: { topic: 'กรอกหัวข้อที่ต้องการทดสอบ' },
  expectedOutputTh: ['ผลลัพธ์ที่ตรวจสอบได้'],
  exampleInputTh: 'หัวข้อ: VLAN trunk',
  prompt: 'TASK\nAnalyze {{topic}}.\nRespond in {{language}}.',
  variableConfig: {
    topic: { type: 'text', required: true, defaultValue: '', labelTh: 'หัวข้อ', helpTh: 'กรอกหัวข้อที่ต้องการทดสอบ' },
    language: { type: 'select', required: true, defaultValue: 'Thai', options: ['Thai', 'English'], labelTh: 'ภาษา', helpTh: 'เลือกภาษาผลลัพธ์' },
  },
  variables: { topic: '', language: 'Thai' },
  catalogManaged: true,
};

test('built-in validator rejects incomplete Quality V2 metadata', () => {
  const result = validateBuiltInPrompt({ ...valid, purposeTh: '' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'missing-purpose-th'));
});

test('built-in validator rejects required variable without Thai help', () => {
  const broken = structuredClone(valid);
  broken.variableConfig.topic.helpTh = '';
  const result = validateBuiltInPrompt(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'missing-variable-help-th'));
});
```

- [ ] **Step 2: Run RED.**

Run:

```bash
node --test tests/prompt-quality-v2.test.mjs
```

Expected: FAIL because `quality-validator.mjs` does not exist.

- [ ] **Step 3: Implement the validator with stable error codes.**

Use explicit checks; do not mutate prompt content. The validator must extract `{{variable}}` placeholders, compare them to `variableConfig`, verify required Thai metadata, and validate select/number defaults.

```js
export function validateBuiltInPrompt(prompt = {}) {
  const errors = [];
  const warnings = [];
  const add = (code, message) => errors.push({ code, message });
  // required identity + Thai metadata checks
  // placeholder/config equality checks
  // variable label/help/default checks
  return { ok: errors.length === 0, errors, warnings };
}

export function validatePromptCatalog(prompts = []) {
  const results = prompts.map((prompt) => ({ id: prompt?.id, ...validateBuiltInPrompt(prompt) }));
  const errors = results.flatMap((result) => result.errors.map((error) => ({ id: result.id, ...error })));
  return { ok: errors.length === 0, errors, warnings: results.flatMap((r) => r.warnings), results };
}
```

- [ ] **Step 4: Implement reusable Thai variable labels and enrichment.**

`enrichBuiltInPrompt()` must merge explicit metadata into a catalog-managed prompt and add `labelTh`, `helpTh`, and `placeholderTh` to each configured variable without changing variable keys/types/required/default/options.

- [ ] **Step 5: Run GREEN.**

```bash
node --test tests/prompt-quality-v2.test.mjs tests/variables-v2.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add lib/prompts/quality-validator.mjs lib/prompts/catalog/quality-v2 tests/prompt-quality-v2.test.mjs
git commit -m "feat: add prompt quality v2 contract"
```

---

### Task 2: Audit and Enrich the Original 30 Built-ins

**Files:**
- Create: `lib/prompts/catalog/quality-v2/metadata-core.mjs`
- Modify: `lib/prompts/ai-prompt-library.mjs`
- Modify: `tests/prompt-catalog.test.mjs`
- Modify: `tests/prompt-localization-usage.test.mjs`

**Interfaces:**
- Consumes: `enrichBuiltInPrompt()` and `validateBuiltInPrompt()` from Task 1.
- Produces: explicit Quality V2 metadata for the first 30 existing prompt names with unchanged IDs/names/executable identity.

- [ ] **Step 1: Add RED coverage requiring Quality V2 metadata on the original 30.**

```js
for (const prompt of catalog.AI_PROMPT_LIBRARY.slice(0, 30)) {
  assert.match(prompt.displayTitleTh, /[ก-๙]/, `${prompt.name} missing Thai title`);
  assert.match(prompt.descriptionTh, /[ก-๙]/, `${prompt.name} missing Thai description`);
  assert.match(prompt.purposeTh, /[ก-๙]/, `${prompt.name} missing Thai purpose`);
  assert.ok(prompt.useCasesTh.length >= 1, `${prompt.name} missing use cases`);
  assert.ok(prompt.expectedOutputTh.length >= 1, `${prompt.name} missing expected output`);
  assert.match(prompt.exampleInputTh, /[ก-๙]/, `${prompt.name} missing Thai example`);
}
```

Also capture the original 30 IDs before edits and assert they do not change.

- [ ] **Step 2: Run RED.**

```bash
node --test tests/prompt-catalog.test.mjs tests/prompt-localization-usage.test.mjs tests/prompt-quality-v2.test.mjs
```

Expected: FAIL on missing Quality V2 fields.

- [ ] **Step 3: Author `CORE_QUALITY_METADATA` for all original 30.**

Every entry must include `descriptionTh`, `purposeTh`, 3–6 practical `useCasesTh`, `inputGuideTh` for each required non-language variable, `expectedOutputTh`, and a realistic `exampleInputTh`. Do not auto-generate these at runtime.

```js
export const CORE_QUALITY_METADATA = Object.freeze({
  DEEP_RESEARCH_ASSISTANT: Object.freeze({
    purposeTh: 'ใช้วางกรอบการวิจัยเชิงลึกจากหัวข้อและเป้าหมายที่ผู้ใช้ระบุ โดยแยกข้อเท็จจริง หลักฐาน มุมมองที่ขัดแย้ง และข้อจำกัดอย่างชัดเจน',
    useCasesTh: ['เตรียมรายงานวิจัย', 'สรุปประเด็นก่อนตัดสินใจ', 'ตรวจช่องว่างของหลักฐาน'],
    inputGuideTh: { topic: 'กรอกหัวข้อที่ต้องการวิจัยให้เฉพาะเจาะจง' },
    expectedOutputTh: ['ข้อเท็จจริงสำคัญ', 'หลักฐานและมุมมองที่ต่างกัน', 'ข้อจำกัดและคำถามที่ยังเปิดอยู่'],
    exampleInputTh: 'หัวข้อ: ผลกระทบของ Wi-Fi 6E ต่อเครือข่ายองค์กร',
  }),
  // continue explicitly for the remaining original prompt names
});
```

- [ ] **Step 4: Apply metadata to the 30 generated prompts without changing their IDs or executable wrappers.**

Refactor the local `buildPrompt()` into an exported/internal reusable `buildPromptFromSpec()` only if needed by Task 4; behavior for the existing 30 must remain byte-equivalent except additive Quality V2 metadata/variable presentation fields.

- [ ] **Step 5: Run GREEN.**

```bash
node --test tests/prompt-catalog.test.mjs tests/prompt-localization-usage.test.mjs tests/prompt-quality-v2.test.mjs
```

Expected: PASS for original-30 Quality V2 checks.

- [ ] **Step 6: Commit.**

```bash
git add lib/prompts/catalog/quality-v2/metadata-core.mjs lib/prompts/ai-prompt-library.mjs tests/prompt-catalog.test.mjs tests/prompt-localization-usage.test.mjs
git commit -m "feat: explain original prompts in Thai"
```

---

### Task 3: Audit and Enrich the Existing 50 Researched Prompts

**Files:**
- Create: `lib/prompts/catalog/quality-v2/metadata-researched-a.mjs`
- Create: `lib/prompts/catalog/quality-v2/metadata-researched-b.mjs`
- Modify: `lib/prompts/catalog/quality-v2/index.mjs`
- Modify: `lib/prompts/ai-prompt-library.mjs`
- Modify: `tests/researched-prompt-catalog.test.mjs`
- Modify: `tests/prompt-quality-v2.test.mjs`

**Interfaces:**
- Consumes: existing `RESEARCHED_PROMPT_LIBRARY`, Task 1 enrichment/validator.
- Produces: explicit Quality V2 metadata for all 50 researched prompts while retaining their existing optional variable rules, provenance, difficulty, estimated value, and executable prompt bodies.

- [ ] **Step 1: Add RED all-80 validation.**

```js
const current80 = AI_PROMPT_LIBRARY.slice(0, 80);
assert.equal(current80.length, 80);
for (const prompt of current80) {
  const result = validateBuiltInPrompt(prompt);
  assert.equal(result.ok, true, `${prompt.name}: ${JSON.stringify(result.errors)}`);
}
```

- [ ] **Step 2: Run RED.**

```bash
node --test tests/researched-prompt-catalog.test.mjs tests/prompt-quality-v2.test.mjs
```

Expected: FAIL because researched entries lack the new structured explanation metadata/help contract.

- [ ] **Step 3: Author researched metadata in two focused files.**

`metadata-researched-a.mjs` covers the first 25 `NEW_PROMPT_NAMES` in `tests/researched-prompt-catalog.test.mjs`; `metadata-researched-b.mjs` covers the remaining 25. Keep each prompt's executable intent unchanged unless the validator proves it is unusable.

- [ ] **Step 4: Merge metadata by stable `name`, not by array index.**

The combined metadata index must throw or fail validation in tests for duplicate metadata keys; it must not silently let one overlay overwrite another.

- [ ] **Step 5: Preserve optional variables.**

Add regression assertions for `RESEARCH_QUESTION_REFINER.context`, `output_format`, `TRANSLATION_QA_REVIEWER.source_language`, and any other existing optional/defaulted fields touched by enrichment.

- [ ] **Step 6: Run GREEN.**

```bash
node --test tests/researched-prompt-catalog.test.mjs tests/prompt-quality-v2.test.mjs tests/variables-v2.test.mjs
```

Expected: PASS for all existing 80.

- [ ] **Step 7: Commit.**

```bash
git add lib/prompts/catalog/quality-v2 lib/prompts/ai-prompt-library.mjs tests/researched-prompt-catalog.test.mjs tests/prompt-quality-v2.test.mjs
git commit -m "feat: add Thai guidance to researched prompts"
```

---

### Task 4: Add the 20 Unique Executable Prompts

**Files:**
- Create: `lib/prompts/catalog/quality-v2/new-prompts.mjs`
- Modify: `lib/prompts/ai-prompt-library.mjs`
- Modify: `tests/prompt-catalog.test.mjs`
- Modify: `tests/prompt-quality-v2.test.mjs`

**Interfaces:**
- Consumes: existing executable wrapper builder (`buildPromptFromSpec` if exported in Task 2) and Task 1 enrichment/validator.
- Produces: exactly the 20 names listed in “Final 20-Prompt Addition Set After Duplicate Audit”.

- [ ] **Step 1: Snapshot the 80 baseline IDs before catalog expansion.**

Generate `tests/fixtures/prompt-catalog-baseline-80.mjs` from the current 80-prompt tree before adding new entries:

```bash
node --input-type=module - <<'NODE'
import { AI_PROMPT_LIBRARY } from './lib/prompts/ai-prompt-library.mjs';
if (AI_PROMPT_LIBRARY.length !== 80) throw new Error(`Expected baseline 80, got ${AI_PROMPT_LIBRARY.length}`);
const ids = AI_PROMPT_LIBRARY.map((prompt) => prompt.id);
process.stdout.write(`export const BASELINE_PROMPT_IDS_80 = Object.freeze(${JSON.stringify(ids, null, 2)});\n`);
NODE
```

Save the output to `tests/fixtures/prompt-catalog-baseline-80.mjs` and commit it with this task.

- [ ] **Step 2: Write RED count/name/duplicate tests.**

```js
import { BASELINE_PROMPT_IDS_80 } from './fixtures/prompt-catalog-baseline-80.mjs';

assert.equal(AI_PROMPT_LIBRARY.length, 100);
const ids = AI_PROMPT_LIBRARY.map((prompt) => prompt.id);
for (const id of BASELINE_PROMPT_IDS_80) assert.ok(ids.includes(id), `lost baseline id ${id}`);
assert.equal(new Set(ids).size, 100);
for (const name of FINAL_NEW_PROMPT_NAMES) assert.ok(AI_PROMPT_LIBRARY.some((p) => p.name === name), `missing ${name}`);
```

Also assert known duplicate candidates are **not** added as second intents (`SQL_QUERY_PERFORMANCE_DIAGNOSER`, `INCIDENT_POSTMORTEM_BUILDER`, etc.).

- [ ] **Step 3: Run RED.**

```bash
node --test tests/prompt-catalog.test.mjs tests/prompt-quality-v2.test.mjs
```

Expected: FAIL at 80 vs 100 and missing new names.

- [ ] **Step 4: Author the 20 specs with concrete task/output instructions.**

Each spec includes exact variables, Thai explanation metadata, explicit output shape, examples, tags/category/collection, and defensive reliability instructions. Use the final set above, not the superseded duplicate candidates from the design draft.

Example shape:

```js
{
  name: 'CISCO_SWITCH_PORT_TROUBLESHOOTER',
  displayTitle: 'Cisco Switch Port Troubleshooter',
  description: 'Diagnose Cisco switch-port Layer 1/2 issues from symptoms and show output.',
  category: 'Network',
  variables: ['symptoms', 'show_output'],
  prompt: `# Role\nYou are a senior network engineer...\n# Inputs\nSymptoms: {{symptoms}}\nShow output: {{show_output}}\n# Output\n- Observed evidence\n- Port state\n- Failure domain\n- Safe verification commands\n- Next action`,
  purposeTh: 'ใช้ไล่ปัญหา port ของ Cisco Switch จากอาการและ show command โดยแยกหลักฐานจากข้อสันนิษฐาน',
  useCasesTh: ['Port down/notconnect', 'CRC/input errors', 'VLAN/Trunk mismatch', 'PoE หรือ speed/duplex ผิดปกติ'],
  inputGuideTh: {
    symptoms: 'อธิบายอาการและผลกระทบ เช่น เครื่องปลายทางใช้งานไม่ได้หรือ port flap',
    show_output: 'วางผล show interface, show interfaces status, show switchport หรือ log ที่เกี่ยวข้อง',
  },
  expectedOutputTh: ['หลักฐานที่พบ', 'สถานะ Layer 1/2', 'Failure domain', 'คำสั่งตรวจต่อที่ปลอดภัย'],
  exampleInputTh: 'อาการ: Gi1/0/24 ขึ้น notconnect หลังย้ายสาย\nShow output: show interfaces status ...',
}
```

- [ ] **Step 5: Integrate new specs and bump catalog version.**

Set:

```js
export const PROMPT_CATALOG_VERSION = '2026-09-25-ai-library-quality-v2-100';
```

New generated IDs follow the existing stable `ai-lib-<name>` rule and must not collide with the 80 baseline IDs.

- [ ] **Step 6: Run GREEN.**

```bash
node --test tests/prompt-catalog.test.mjs tests/researched-prompt-catalog.test.mjs tests/prompt-quality-v2.test.mjs
```

Expected: exactly 100 unique prompts; all baseline IDs present; all 20 new names present; all 100 validate.

- [ ] **Step 7: Commit.**

```bash
git add tests/fixtures/prompt-catalog-baseline-80.mjs lib/prompts/catalog/quality-v2/new-prompts.mjs lib/prompts/ai-prompt-library.mjs tests/prompt-catalog.test.mjs tests/prompt-quality-v2.test.mjs
git commit -m "feat: expand prompt catalog to 100"
```

---

### Task 5: Catalog Upgrade, Merge Idempotency, and Stored User State

**Files:**
- Modify: `lib/prompts/ai-prompt-library.mjs` only if merge defects are exposed
- Modify: `lib/prompts/client-store.mjs` only if hydration defects are exposed
- Modify: `tests/prompt-catalog.test.mjs`
- Modify: `tests/prompt-os-catalog-integration.test.mjs`
- Modify: `tests/v5-state-migration.test.mjs` only if current migration assertions need the new count

**Interfaces:**
- Consumes: `mergePromptCatalog(existing, incoming)` and `loadPromptCatalogState(storage, catalog)`.
- Produces: idempotent 80 → 100 upgrade behavior with user activity preservation.

- [ ] **Step 1: Write RED migration tests using a realistic stored 80 catalog subset.**

Cover favorite, pinned, rating, copy count, run count, results, collections, createdAt, existing compatible variable values, and empty `language` being normalized to Thai.

```js
const merged = mergePromptCatalog([legacyManaged], AI_PROMPT_LIBRARY);
assert.equal(merged.length, 100);
assert.equal(merged.find((p) => p.id === legacyManaged.id).favorite, true);
assert.equal(merged.find((p) => p.id === legacyManaged.id).runs, 7);
assert.equal(merged.find((p) => p.id === legacyManaged.id).variables.topic, 'Zero Trust');
```

- [ ] **Step 2: Add repeated-hydration idempotency test.**

```js
const once = mergePromptCatalog(stored80, AI_PROMPT_LIBRARY);
const twice = mergePromptCatalog(once, AI_PROMPT_LIBRARY);
assert.equal(once.length, 100);
assert.equal(twice.length, 100);
assert.deepEqual(twice.map((p) => p.id), once.map((p) => p.id));
```

- [ ] **Step 3: Run RED/Regression.**

```bash
node --test tests/prompt-catalog.test.mjs tests/prompt-os-catalog-integration.test.mjs tests/v5-state-migration.test.mjs
```

If current merge logic already passes, keep the tests and do not change production code. If it fails, the failure must be in merge/hydration behavior, not patched in UI.

- [ ] **Step 4: Implement only the minimal merge/hydration fix required.**

Preserve identity matching by stable ID/name/title and keep catalog-managed metadata authoritative while retaining user activity state. Never let malformed incoming metadata overwrite an existing user record in tests.

- [ ] **Step 5: Run GREEN.**

```bash
node --test tests/prompt-catalog.test.mjs tests/prompt-os-catalog-integration.test.mjs tests/v5-state-migration.test.mjs
```

- [ ] **Step 6: Commit.**

```bash
git add lib/prompts/ai-prompt-library.mjs lib/prompts/client-store.mjs tests/prompt-catalog.test.mjs tests/prompt-os-catalog-integration.test.mjs tests/v5-state-migration.test.mjs
git commit -m "test: protect 100 prompt catalog migration"
```

---

### Task 6: Thai Variable Labels, Help, Placeholders, and Accessibility

**Files:**
- Modify: `components/prompt/PromptVariableForm.jsx`
- Modify: `tests/variables-v2.test.mjs`
- Modify: `tests/prompt-quality-v2-ui.test.mjs`

**Interfaces:**
- Consumes: `variableConfig[name].labelTh`, `helpTh`, `placeholderTh` from Quality V2 enrichment.
- Produces: accessible Thai form presentation; no changes to value shape or validation interface.

- [ ] **Step 1: Write RED UI contract tests.**

Require `labelTh`, `helpTh`, and `placeholderTh` usage and `aria-describedby` containing both help and error IDs when both exist.

```js
const source = fs.readFileSync('components/prompt/PromptVariableForm.jsx', 'utf8');
assert.match(source, /field\.helpTh/);
assert.match(source, /field\.placeholderTh/);
assert.match(source, /variable-\$\{name\}-help/);
```

- [ ] **Step 2: Run RED.**

```bash
node --test tests/variables-v2.test.mjs tests/prompt-quality-v2-ui.test.mjs
```

Expected: FAIL because help/Thai placeholder rendering is absent.

- [ ] **Step 3: Render help and Thai placeholders without changing controls.**

Build described-by IDs deterministically:

```js
const describedBy = [
  field.helpTh ? `variable-${name}-help` : null,
  error ? `variable-${name}-error` : null,
].filter(Boolean).join(' ') || undefined;
```

Use `field.placeholderTh || field.placeholder || ''`. Render help as selectable text under the control. Keep existing `textarea`, `number`, `select`, `boolean`, `date`, `url`, `file`, and text behavior unchanged.

- [ ] **Step 4: Run GREEN.**

```bash
node --test tests/variables-v2.test.mjs tests/prompt-quality-v2-ui.test.mjs tests/prompt-rendering.test.mjs
```

- [ ] **Step 5: Commit.**

```bash
git add components/prompt/PromptVariableForm.jsx tests/variables-v2.test.mjs tests/prompt-quality-v2-ui.test.mjs
git commit -m "feat: explain prompt variables in Thai"
```

---

### Task 7: Feature-Gated Prompt Explainer UI

**Files:**
- Modify: `lib/ui/feature-flags.mjs`
- Modify: `.env.example`
- Modify: `app/page.jsx`
- Modify: `components/prompt/PromptLibraryV5.jsx`
- Modify: `components/prompt/PromptDetailV2.jsx`
- Modify: `tests/feature-flags.test.mjs`
- Modify: `tests/feature-flag-integration.test.mjs`
- Modify: `tests/v5-prompt-detail-ui.test.mjs`
- Modify: `tests/prompt-quality-v2-ui.test.mjs`

**Interfaces:**
- Produces: `V5_PROMPT_EXPLAINER` in `V5_FLAG_NAMES`, read from `NEXT_PUBLIC_V5_PROMPT_EXPLAINER`.
- `PromptLibraryV5({ explainerEnabled })` forwards the value to `PromptDetailV2`.
- `PromptDetailV2({ explainerEnabled = false })` renders explanation sections only when enabled.

- [ ] **Step 1: Write RED feature-flag tests.**

```js
assert.equal(readFeatureFlags({}).V5_PROMPT_EXPLAINER, false);
assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_PROMPT_EXPLAINER: 'true' }).V5_PROMPT_EXPLAINER, true);
```

- [ ] **Step 2: Write RED Prompt Detail contract tests.**

Require semantic headings/text hooks for:

- `พรอมต์นี้ทำอะไร`
- `เหมาะกับ`
- `ผลลัพธ์ที่จะได้`
- `ตัวอย่างข้อมูลที่กรอก`

and assert the component still calls existing `onRun({ prompt, values, renderedPrompt })` rather than fetching `/api/ai/run` directly.

- [ ] **Step 3: Run RED.**

```bash
node --test tests/feature-flags.test.mjs tests/feature-flag-integration.test.mjs tests/v5-prompt-detail-ui.test.mjs tests/prompt-quality-v2-ui.test.mjs
```

- [ ] **Step 4: Add flag wiring and `.env.example`.**

Add exactly:

```text
NEXT_PUBLIC_V5_PROMPT_EXPLAINER=false
```

Read it in `app/page.jsx`, pass `explainerEnabled` through `PromptLibraryV5`, and default false in every component signature.

- [ ] **Step 5: Implement semantic explainer sections.**

When enabled and metadata exists, render purpose as paragraphs, `useCasesTh`/`expectedOutputTh` as real `<ul>` lists, and `exampleInputTh` in selectable `<pre>`/text content. When disabled, preserve the existing three-region Info / Inputs / Preview presentation and run behavior.

- [ ] **Step 6: Verify mobile/reduced-motion behavior stays inherited from existing detail layout.**

Do not add new motion or pointer-only interactions. Explanation content must appear before raw rendered prompt content in DOM order.

- [ ] **Step 7: Run GREEN.**

```bash
node --test tests/feature-flags.test.mjs tests/feature-flag-integration.test.mjs tests/v5-prompt-detail-ui.test.mjs tests/prompt-quality-v2-ui.test.mjs tests/immersive-run-ui-contract.test.mjs
```

- [ ] **Step 8: Commit.**

```bash
git add lib/ui/feature-flags.mjs .env.example app/page.jsx components/prompt/PromptLibraryV5.jsx components/prompt/PromptDetailV2.jsx tests/feature-flags.test.mjs tests/feature-flag-integration.test.mjs tests/v5-prompt-detail-ui.test.mjs tests/prompt-quality-v2-ui.test.mjs
git commit -m "feat: add Thai prompt explainer"
```

---

### Task 8: All-100 Executability, Thai Search, Safety, and Regression Sweep

**Files:**
- Modify: `tests/prompt-quality-v2.test.mjs`
- Modify: `tests/search-v2.test.mjs`
- Modify: `tests/prompt-rendering.test.mjs`
- Modify: `tests/prompt-localization-usage.test.mjs`
- Modify: `lib/prompts/catalog/quality-v2/*.mjs` only to fix defects exposed by tests
- Modify: `lib/search/prompt-index.mjs` only if existing Thai title/description indexing unexpectedly fails

**Interfaces:**
- Consumes: all 100 final prompts.
- Produces: proof that every built-in can be filled/rendered and discovered by Thai title/description without adding long metadata fields to search unnecessarily.

- [ ] **Step 1: Add a fixture-value generator for test-only rendering.**

In the test file, generate a valid value per configured field without changing production defaults:

```js
function fixtureValue(name, field = {}) {
  if (field.type === 'number') return '1';
  if (field.type === 'boolean') return true;
  if (field.type === 'multi-select') return [String(field.options?.[0] || 'example')];
  if (field.type === 'select' || field.type === 'language') return field.defaultValue || field.options?.[0] || 'Thai';
  if (field.type === 'date') return '2026-09-25';
  if (field.type === 'url') return 'https://example.com';
  return name === 'language' ? 'Thai' : `example ${name}`;
}
```

- [ ] **Step 2: Add all-100 executability tests.**

For every prompt:

1. `validateBuiltInPrompt(prompt).ok === true`;
2. configured placeholders equal extracted placeholders;
3. required empty values fail `validatePromptVariables()`;
4. fixture values pass validation;
5. `renderPromptTemplate()` leaves no unresolved required placeholders;
6. output language defaults to Thai;
7. executable prompt contains a concrete task section/instruction rather than only a role label.

- [ ] **Step 3: Add Thai search regressions.**

Search one original prompt and one new prompt by Thai title/description and assert the expected prompt is returned. Existing `prompt-index.mjs` already indexes `displayTitleTh` and `descriptionTh`; do not expand to `purposeTh`/examples unless these tests prove a requirement is unmet.

- [ ] **Step 4: Add safety/reliability assertions for the new security/finance prompts.**

Assert `PUBLIC_COMPANY_RESEARCH_BRIEF` contains language that requires sourced/uncertain factual treatment and excludes personalized buy/sell instructions. Assert security prompts are framed as analysis/triage and do not request secrets or credential extraction.

- [ ] **Step 5: Run RED/GREEN until the catalog passes without weakening tests.**

```bash
node --test tests/prompt-quality-v2.test.mjs tests/search-v2.test.mjs tests/prompt-rendering.test.mjs tests/prompt-localization-usage.test.mjs
```

Fix metadata/spec defects at their source. Do not special-case individual bad prompts in the validator.

- [ ] **Step 6: Commit.**

```bash
git add lib/prompts/catalog/quality-v2 lib/search/prompt-index.mjs tests/prompt-quality-v2.test.mjs tests/search-v2.test.mjs tests/prompt-rendering.test.mjs tests/prompt-localization-usage.test.mjs
git commit -m "test: verify all 100 prompts are executable"
```

---

### Task 9: Whole-Branch Verification and Draft PR

**Files:**
- Modify only files required to fix verification failures.
- No production deployment files or credentials.

**Interfaces:**
- Consumes: complete Tasks 1–8.
- Produces: green branch, Draft PR, no merge/deploy.

- [ ] **Step 1: Run the complete test suite.**

```bash
npm test
```

Expected: all tests pass, including the exact 100-prompt invariant and Phase 4 Run regressions.

- [ ] **Step 2: Run OpenNext production build.**

```bash
npm run build
```

Expected: successful OpenNext build with `.open-next/worker.js` and assets produced.

- [ ] **Step 3: Verify generated artifacts.**

Use the same checks as `.github/workflows/cloudflare-build-check.yml` for worker/assets/config existence.

- [ ] **Step 4: Verify Wrangler can bundle without deploying.**

Run the repository workflow-equivalent Wrangler generated-worker bundle/dry-run command. It must not publish production.

- [ ] **Step 5: Run targeted final invariants again.**

```bash
node --test \
  tests/prompt-catalog.test.mjs \
  tests/researched-prompt-catalog.test.mjs \
  tests/prompt-quality-v2.test.mjs \
  tests/prompt-quality-v2-ui.test.mjs \
  tests/prompt-os-catalog-integration.test.mjs \
  tests/search-v2.test.mjs \
  tests/variables-v2.test.mjs \
  tests/v5-prompt-detail-ui.test.mjs \
  tests/feature-flags.test.mjs \
  tests/immersive-run-ui-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Compare with `main`.**

Confirm:

- exactly 100 built-ins;
- all 80 baseline IDs survive;
- exactly the final 20 new names exist;
- no production database schema files changed;
- no secret/env values were committed;
- no second execution path was added;
- `V5_PROMPT_EXPLAINER` defaults false.

- [ ] **Step 7: Open a Draft PR against `main`.**

PR body must summarize:

- 80 → 100 catalog transition;
- Thai explanation/variable guidance;
- duplicate audit and final replacement set;
- catalog migration/user-state preservation;
- Quality V2 validator/executability evidence;
- feature-flag fallback;
- full tests/OpenNext/Wrangler dry-run status;
- explicit statement that merge and production deployment remain separate approvals.

- [ ] **Step 8: Stop before merge.**

Do not mark the PR merged, enable auto-merge, or manually deploy. Await a separate explicit `merge` command.

---

## Self-Review Notes

- **Spec coverage:** Tasks 1–8 cover structured Thai metadata, variable guidance, all 80 existing prompt audit, 20 unique additions, count/identity preservation, migration/idempotency, search, execution, explainer flag/UI, accessibility, safety, and the existing Run boundary. Task 9 covers release verification and Draft PR gating.
- **Duplicate audit:** seven approved-design candidates were replaced before coding because existing catalog entries already cover materially identical intent. The final 20 names are fixed in this plan.
- **Placeholder scan:** no `TBD`, `TODO`, “implement later”, “similar to Task N”, or unspecified validation/error-handling steps remain.
- **Type consistency:** metadata fields are `purposeTh: string`, `useCasesTh: string[]`, `inputGuideTh: Record<string,string>`, `expectedOutputTh: string[]`, `exampleInputTh: string`; variable additions are `labelTh/helpTh/placeholderTh: string`.
- **Review Focus coverage:** stored-state migration → Task 5; placeholder/config drift → Tasks 1/2/3/4/8; malformed metadata/user-created compatibility → Task 1; Thai accessibility → Task 6; explainer-off fallback → Task 7.

## Execution Gate

Implementation begins only after the user reviews this plan and selects an execution approach. Use a separate feature branch starting from the approved spec/plan state. Merge and production deployment remain separate explicit approvals.

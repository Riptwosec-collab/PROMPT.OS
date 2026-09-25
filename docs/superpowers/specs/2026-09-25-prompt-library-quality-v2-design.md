# Prompt.OS — Prompt Library Quality V2 Design

Date: 2026-09-25
Status: Approved conversational design, awaiting written-spec review
Base: `main` after Phase 4 merge (`387dd8218a71e929babd428cfa2ac43e3792d577`)

## 1. Goal

Upgrade the built-in Prompt.OS library so a Thai-speaking user can understand what each prompt does, know exactly what to enter, and run it successfully without having to interpret raw template text.

This release also expands the built-in catalog from **80 prompts to exactly 100 prompts** by preserving all existing prompt identities and adding 20 new high-value executable prompts.

The previous 80-prompt invariant is intentionally superseded by a 100-prompt invariant for this release. Existing built-in IDs must remain stable so Favorites, Pins, Run History, Saved Results, and catalog-managed metadata continue to resolve correctly.

## 2. Success Criteria

The change is successful when:

1. Every built-in prompt has a clear Thai explanation suitable for a non-expert user.
2. Every required variable has a Thai label and practical input guidance.
3. Every prompt can render without unresolved required placeholders once valid inputs are supplied.
4. Every prompt has a concrete task and expected output shape rather than a vague role-only instruction.
5. Existing 80 built-in prompt IDs remain stable.
6. Exactly 20 new built-in prompts are added, producing exactly 100 built-in prompts.
7. Prompt Detail explains purpose, use cases, inputs, expected output, and example input before execution.
8. The existing Prompt Detail → Immersive Run → `/api/ai/run` execution path remains the only execution path.
9. Existing user state is preserved when the catalog updates.
10. No prompt claims to use unavailable files, data, tools, telemetry, or sources.

## 3. Non-Goals

This release does not add:

- a new AI execution engine;
- a second prompt runner;
- automatic cloud database migrations;
- vector search or embeddings;
- a prompt marketplace;
- multi-user collaboration;
- autonomous agents;
- automatic AI-generated descriptions at runtime;
- investment recommendations or political persuasion prompts;
- hidden prompt generation that changes built-in content from run to run.

## 4. Current Architecture to Preserve

Prompt.OS already has the correct execution foundation:

- catalog specs are converted into executable prompt templates;
- `{{language}}` is included as a standard variable;
- required fields are validated before execution;
- unresolved placeholders are detected;
- generated templates include reliability rules;
- Prompt Detail renders variable values into the prompt;
- Phase 4 routes execution through the full-screen Run Workspace;
- `/api/ai/run` remains the server-side AI execution boundary.

This release extends catalog metadata and presentation. It must not duplicate those responsibilities.

## 5. Recommended Architecture

Use **static structured prompt metadata + deterministic validation**.

Each prompt owns human-authored metadata that explains the prompt in Thai. The UI renders that metadata directly. Runtime AI is not used to explain built-in prompts.

Architecture:

```text
Prompt Catalog Spec
    │
    ├── executable task/template
    ├── variable definitions
    ├── Thai explanation metadata
    ├── examples
    └── expected output guidance
             │
             ▼
      Catalog Normalizer
             │
             ▼
       AI_PROMPT_LIBRARY
             │
        ┌────┴─────┐
        ▼          ▼
 Prompt Detail   Run Workspace
 explanation    actual execution
```

## 6. Prompt Metadata Contract

Built-in prompts should expose the following fields after normalization:

```js
{
  id,
  name,
  displayTitle,
  displayTitleTh,
  description,
  descriptionTh,

  purposeTh,
  useCasesTh,
  inputGuideTh,
  expectedOutputTh,
  exampleInputTh,
  usageGuideTh,

  category,
  subcategory,
  tags,

  prompt,
  variables,
  variableConfig,
  outputFormat,
  compatibleModels,

  catalogManaged,
  catalogVersion,
  version
}
```

### Field Rules

`descriptionTh`
: One short sentence that answers “พรอมต์นี้คืออะไร”.

`purposeTh`
: Two to four concise sentences explaining what the prompt helps the user accomplish and important boundaries.

`useCasesTh`
: Array of practical situations, normally 3–6 items.

`inputGuideTh`
: Structured guidance keyed by variable name.

```js
inputGuideTh: {
  incident: 'อธิบายอาการที่เกิดขึ้น อุปกรณ์ที่เกี่ยวข้อง และผลกระทบที่เห็น',
  logs: 'วาง log, error message หรือ show command ที่เกี่ยวข้องโดยไม่ตัดบรรทัดสำคัญ'
}
```

`expectedOutputTh`
: Array describing the concrete sections/results the user should expect.

`exampleInputTh`
: Short realistic example. It must not contain secrets, production credentials, fabricated source claims, or unsafe instructions.

`usageGuideTh`
: Existing Thai usage guidance remains supported and can be generated from structured metadata where appropriate.

## 7. Thai Language Policy

Thai explanations must prioritize understanding over literal translation.

Keep technical terms in English when translating would reduce precision, including examples such as:

- VLAN
- Trunk
- OSPF
- BGP
- API
- JSON
- SQL
- React
- Docker
- Git
- RADIUS
- 802.1X
- Token
- Latency

Good:

> ตรวจ ACL เพื่อหากฎที่ block traffic พร้อมอธิบาย source, destination, protocol และ port ที่ได้รับผลกระทบ

Avoid unnatural literal translations of established technical terms.

Thai text must not imply capabilities the application does not have.

## 8. Variable Presentation

Extend variable metadata without breaking the current validator.

Recommended normalized variable shape:

```js
{
  type: 'textarea',
  required: true,
  defaultValue: '',
  label: 'logs',
  labelTh: 'Log / หลักฐาน',
  helpTh: 'วาง log, error message หรือคำสั่ง show ที่เกี่ยวข้อง',
  placeholderTh: 'ตัวอย่าง: show interface Gi1/0/24 ...'
}
```

Existing keys remain valid. Thai keys are additive.

### Variable Type Rules

- Long evidence/source/code fields use `textarea`.
- Small numeric controls use `number`.
- Language remains a select.
- Tone remains a select where applicable.
- Boolean-like choices should use select/toggle only when a real choice exists.
- Do not require fields that are not actually referenced by the executable prompt.

## 9. Prompt Detail V2 Presentation

Prompt Detail should surface the explanation before the raw rendered template.

Recommended information hierarchy:

```text
Title TH
English title
Short Thai description

พรอมต์นี้ทำอะไร
<purposeTh>

เหมาะกับ
• use case 1
• use case 2
• use case 3

ข้อมูลที่ต้องกรอก
[Thai-labelled variable controls + help text]

ผลลัพธ์ที่จะได้
• expected output 1
• expected output 2

ตัวอย่างข้อมูลที่กรอก
<exampleInputTh>

Rendered Prompt
<existing preview>

[Run Prompt]
```

Desktop may keep the existing multi-column layout, but the explanation must be readable without forcing the user to inspect the raw prompt.

Mobile remains single-column and touch friendly.

## 10. Execution Contract

A prompt is “usable” only when it satisfies all of these conditions:

1. It contains a concrete task.
2. Required placeholders are declared in `variableConfig`.
3. Required `variableConfig` entries correspond to actual placeholders or required non-text media input.
4. Rendering with valid values leaves no unresolved required placeholder tokens.
5. Empty required inputs prevent execution.
6. Missing source material causes the prompt to ask only for the missing source rather than fabricate analysis.
7. Output instructions are explicit enough to produce a useful result.
8. The prompt does not depend on unavailable product capabilities.
9. The prompt is compatible with the current `PromptDetailV2` and Phase 4 `RunWorkspace` flow.
10. It passes the catalog quality tests defined below.

## 11. Quality Validator

Add a deterministic built-in prompt quality validator used by tests and optionally by development tooling.

Conceptual interface:

```js
validateBuiltInPrompt(prompt)
// => {
//   ok: boolean,
//   errors: [],
//   warnings: []
// }
```

Errors should include:

- missing ID/name/title;
- duplicate ID;
- missing Thai description;
- missing `purposeTh`;
- empty use cases;
- unresolved variable definition mismatch;
- required variable not referenced by the template;
- placeholder without variable configuration;
- missing expected output guidance;
- missing executable task;
- invalid default value for select/number fields;
- non-array metadata where arrays are required.

Warnings may include overly long titles or descriptions, but warnings must not silently change prompt content.

## 12. Catalog Migration Policy

### Preserve Existing 80

All existing built-in prompt IDs must remain unchanged.

Catalog merging must continue to preserve user state including:

- favorite;
- pinned;
- rating;
- copy count;
- run count;
- results;
- created date when already present;
- user collections;
- existing entered variable values where compatible.

### Metadata Upgrade

Catalog-managed fields may update to the new Quality V2 definition.

When executable prompt content changes, existing catalog version/history behavior must continue to create a built-in catalog upgrade record rather than silently erase the previous template.

### Variable Changes

If a variable is renamed, migration must be explicit. Prefer keeping existing variable keys and improving only `labelTh/helpTh` unless the current key is objectively unusable.

## 13. Catalog Version

Bump the built-in catalog version to a new dated Quality V2 identifier, for example:

```text
2026-09-25-ai-library-quality-v2-100
```

Version numbering must make the 80 → 100 catalog transition inspectable.

## 14. Twenty New Built-In Prompts

Add exactly these 20 high-value prompts unless implementation review finds a duplicate with an existing catalog prompt. If a duplicate exists, replace it with another prompt from the same domain rather than adding duplicate intent.

### Network & IT Operations

1. **Network Incident Fault Isolation**
   - Inputs: `incident`, `logs`, optional context encoded in those fields
   - Output: evidence summary, failure domain, hypotheses, next commands/actions

2. **Cisco Switch Port Troubleshooter**
   - Inputs: `symptoms`, `show_output`
   - Output: port state, likely Layer 1/2 issues, validation commands

3. **Wi-Fi / 802.1X / NAC Troubleshooter**
   - Inputs: `symptoms`, `logs`, `environment`
   - Output: auth path analysis, likely failure domain, verification steps

4. **Firewall / ACL Traffic Analyzer**
   - Inputs: `traffic_flow`, `acl_or_rules`, `logs`
   - Output: matched rules, blocked/allowed reasoning, safe validation steps

5. **VPN Troubleshooter**
   - Inputs: `vpn_type`, `symptoms`, `logs`
   - Output: tunnel phase analysis, routing/NAT/auth checks, next actions

### Security

6. **Security Alert Triage**
   - Inputs: `alert`, `evidence`, `environment`
   - Output: verified facts, severity factors, containment checks, escalation data

7. **Phishing Email Analyzer**
   - Inputs: `email_content`, `headers`, `context`
   - Output: indicators, suspicious patterns, uncertainty, safe next steps

### Software Engineering

8. **Bug Root Cause Investigator**
   - Inputs: `problem`, `code`, `logs`
   - Output: evidence-backed root cause candidates, tests, minimal fix direction

9. **Code Review & Risk Audit**
   - Inputs: `code`, `requirements`
   - Output: correctness, security, performance, maintainability findings

10. **API Integration Debugger**
    - Inputs: `request`, `response`, `code`, `expected_behavior`
    - Output: failure layer, contract mismatch, auth/input/output checks

11. **SQL Query Optimizer**
    - Inputs: `query`, `schema`, `execution_context`
    - Output: bottlenecks, index/query suggestions, correctness risks

### Data & Business Analysis

12. **CSV / Excel Data Quality Analyzer**
    - Inputs: `data_description`, `sample_data`, `goal`
    - Output: grain, missingness, duplicates, type/range/join risks

13. **KPI Movement Root Cause Analyzer**
    - Inputs: `metric`, `time_range`, `data`, `context`
    - Output: verified movement, segments/drivers, hypotheses vs evidence

### Research

14. **Research Source Verifier**
    - Inputs: `claim`, `sources`
    - Output: source-by-source evidence, agreement/conflict, uncertainty

15. **Deep Research Brief Builder**
    - Inputs: `topic`, `objectives`, `constraints`
    - Output: research plan, evidence matrix, findings, open questions

### Productivity & Communication

16. **Meeting Notes to Action Plan**
    - Inputs: `notes`, `context`
    - Output: decisions, owners, actions, deadlines only when stated

17. **Professional Message & Email Builder**
    - Inputs: `goal`, `context`, `tone`
    - Output: send-ready draft with no invented facts

### Travel & Planning

18. **Travel Research Planner**
    - Inputs: `destination`, `dates`, `preferences`, `constraints`
    - Output: research checklist, itinerary framework, practical decision points

### Finance Research

19. **Public Company Research Brief**
    - Inputs: `company`, `research_goal`, `sources`
    - Output: factual business/financial summary, catalysts/risks as sourced facts, uncertainty
    - Must not output personalized buy/sell instructions.

### Learning

20. **Skill Learning Roadmap Builder**
    - Inputs: `skill`, `current_level`, `goal`, `time_available`
    - Output: staged roadmap, exercises, milestones, verification criteria

## 15. Duplicate Prevention

Prompt uniqueness must be checked on at least:

- `id`;
- normalized `name`;
- normalized `displayTitle`;
- intent-level duplication during implementation review.

Do not create multiple prompts that only differ by wording while performing the same task.

## 16. Existing Prompt Audit

All existing 80 built-ins must be audited, not merely auto-translated.

For each prompt:

1. inspect current task;
2. verify variables against placeholders;
3. write/refine Thai explanation;
4. add practical use cases;
5. add per-variable Thai help;
6. define expected output;
7. add realistic example input;
8. ensure executable instructions remain concrete;
9. retain original identity;
10. run deterministic quality validation.

The audit should prefer improving metadata over rewriting executable prompt text unless the existing template is objectively incomplete or unusable.

## 17. Translation Fallback

`translateComplete()` remains useful for global UI strings and legacy fallback, but Quality V2 built-ins should not rely solely on generic translation mappings for their explanations.

Priority:

```text
explicit prompt metadata
  > catalog-specific Thai fallback
  > generic translateComplete()
  > English source
```

This avoids awkward machine-like explanations.

## 18. Search and Discovery

Thai metadata should participate in prompt search where the existing search architecture supports searchable text fields.

At minimum users should be able to find prompts by:

- Thai title;
- English title;
- Thai description;
- category/tags.

If expanding the search index to all long explanation fields materially affects performance, keep search limited to title/description/tags in this release.

## 19. Feature Flag Policy

The richer explanation UI should be independently gateable during rollout with a new default-off flag:

```text
V5_PROMPT_EXPLAINER
```

When disabled:

- existing Prompt Detail presentation remains available;
- execution behavior remains unchanged;
- no explanation UI is required to run prompts.

The 100-prompt catalog itself is a catalog release rather than a presentation experiment. Once this feature branch is explicitly merged, exactly 100 built-ins become the intended catalog baseline.

No `NEO_MODE` or parallel global mode is introduced.

## 20. Error Handling

### Missing Thai Metadata

Catalog quality tests fail before merge. Runtime may fall back to English for user-created/imported prompts, but built-ins must satisfy the Thai metadata contract.

### Bad Variable Metadata

A built-in prompt with placeholder/config mismatch is a test failure and must not be silently repaired at runtime.

### User-Created Prompts

Do not require Quality V2 metadata from user-created/imported prompts. Existing user prompt compatibility is preserved.

### Catalog Merge

Malformed new catalog entries must not overwrite existing user records during catalog merge tests.

## 21. Accessibility

- Explanation headings use semantic hierarchy.
- Lists render as lists rather than decorative text.
- Variable help text is associated with its input.
- Required status is programmatically available.
- Examples are selectable text.
- No explanation depends on color alone.
- Mobile controls keep current touch-size requirements.
- New UI honors reduced motion.

## 22. Testing Strategy

### Catalog Count and Identity

Tests must assert:

- exactly 100 built-in prompts;
- no duplicate IDs/names;
- all original 80 IDs still exist;
- exactly 20 new IDs are added.

### Metadata Coverage

For each built-in:

- non-empty `displayTitleTh`;
- non-empty `descriptionTh`;
- non-empty `purposeTh`;
- non-empty `useCasesTh` array;
- non-empty `expectedOutputTh` array;
- non-empty `exampleInputTh`;
- Thai label/help coverage for required variables.

### Executability

For each built-in:

- extract placeholders;
- compare with variable config;
- render with valid fixture values;
- assert no required unresolved placeholder;
- assert empty required values are rejected;
- assert output language defaults to Thai;
- assert the template contains concrete task instructions.

### Catalog Merge Regression

Tests must verify:

- favorites/pins/runs/results survive upgrade;
- old IDs map to upgraded catalog definitions;
- new prompts append once only;
- repeated hydration does not create duplicates;
- existing variable values survive compatible schema updates.

### UI Contract

Tests must cover:

- Thai explanation sections render when flag enabled;
- legacy Prompt Detail fallback remains when flag disabled;
- input help maps to the correct variable;
- Run continues to use existing validated/rendered prompt path;
- mobile order remains logical.

### Regression

Run the entire repository test suite, OpenNext build, artifact verification, and Wrangler bundle dry-run before PR completion.

## 23. Files Expected to Change

Likely implementation areas:

```text
lib/prompts/ai-prompt-library.mjs
lib/prompts/catalog/*.mjs
lib/prompts/catalog/quality-v2*.mjs        (new prompts or metadata helpers)
lib/prompts/quality-validator.mjs           (new)
components/prompt/PromptDetailV2.jsx
components/prompt/PromptVariableForm.jsx
lib/search/...                              (only if required for Thai discovery)
lib/ui/feature-flags.mjs
.env.example
tests/prompt-*.test.mjs
tests/feature-flags.test.mjs
```

Exact file decomposition is deferred to the implementation plan after written-spec approval.

## 24. Rollout and Compatibility

1. Implement on a separate feature branch.
2. Use TDD RED → GREEN per implementation task.
3. Keep explanation UI behind `V5_PROMPT_EXPLAINER=false` by default.
4. Validate catalog migration from existing stored Prompt.OS data.
5. Open a Draft PR.
6. Do not merge without a separate explicit `merge` command.
7. Do not manually production-deploy the new feature branch.
8. After explicit merge, Cloudflare Git integration may deploy `main` automatically; manual deployment remains a separate action only when explicitly needed.

## 25. Security and Reliability

- Never place secrets in examples.
- Never ask a prompt to expose credentials/tokens/private keys.
- Security prompts should be defensive analysis and troubleshooting.
- Financial research prompts must separate sourced facts, analysis, and uncertainty.
- Prompt metadata must never claim live/current data unless the execution environment actually provides it.
- Do not fabricate citations.
- Do not invent telemetry, costs, latency, or model behavior.

## 26. Acceptance Checklist

Before Phase completion:

- [ ] Exactly 100 built-in prompts.
- [ ] All previous 80 prompt IDs preserved.
- [ ] Exactly 20 unique additions.
- [ ] All 100 pass Quality V2 validator.
- [ ] All 100 have Thai explanations.
- [ ] Required variables have Thai labels/help.
- [ ] No unresolved required placeholders with valid fixtures.
- [ ] Prompt Detail explains purpose/use/input/output/example.
- [ ] Existing Run Workspace is reused unchanged as execution boundary unless a small adapter is required.
- [ ] No user prompt is forced into the built-in metadata schema.
- [ ] Catalog merge preserves user state.
- [ ] `V5_PROMPT_EXPLAINER` defaults false.
- [ ] Full tests pass.
- [ ] OpenNext build passes.
- [ ] OpenNext artifacts verify.
- [ ] Wrangler bundle dry-run passes.
- [ ] Draft PR remains unmerged until explicit `merge`.
- [ ] No manual production deployment without explicit authorization.

## 27. Next Gate

After the user reviews and approves this written spec, the only next step is to invoke the planning workflow and write the detailed implementation plan.

Implementation must not start from this design document alone.

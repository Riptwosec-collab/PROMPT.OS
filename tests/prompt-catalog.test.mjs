import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE_80_IDS } from './fixtures/prompt-catalog-baseline-80.mjs';

const EXPECTED_NAMES = [
  'DEEP_RESEARCH_ASSISTANT', 'FACT_CHECKER', 'ARTICLE_ANALYZER', 'PAPER_ANALYZER', 'SOURCE_COMPARATOR',
  'CODE_REVIEWER', 'BUG_HUNTER', 'UNIT_TEST_GENERATOR', 'CODE_OPTIMIZER', 'TIME_COMPLEXITY_ANALYZER',
  'REGEX_GENERATOR', 'DOCKER_GENERATOR', 'API_DESIGNER', 'DATABASE_SCHEMA_DESIGNER', 'JSON_EXTRACTOR',
  'TABLE_EXTRACTOR', 'SENTIMENT_ANALYZER', 'DATA_CLASSIFIER', 'IMAGE_OBJECT_ANALYZER', 'IMAGE_TO_JSON',
  'VIDEO_QA', 'AUDIO_TRANSCRIBER', 'BLOG_GENERATOR', 'SEO_CONTENT_WRITER', 'SOCIAL_CONTENT_GENERATOR',
  'MEETING_SUMMARIZER', 'ACTION_ITEM_EXTRACTOR', 'PRESENTATION_BUILDER', 'PERSONAL_TUTOR', 'QUIZ_GENERATOR',
];

const EXPECTED_IDS_30 = EXPECTED_NAMES.map((name) => `ai-lib-${name.toLowerCase().replace(/_/g, '-')}`);

const QUALITY_V2_NEW_NAMES = [
  'ROUTING_PATH_REACHABILITY_ANALYZER',
  'CISCO_SWITCH_PORT_TROUBLESHOOTER',
  'WIFI_8021X_NAC_TROUBLESHOOTER',
  'FIREWALL_ACL_TRAFFIC_ANALYZER',
  'VPN_TROUBLESHOOTER',
  'SECURITY_ALERT_TRIAGE',
  'PHISHING_EMAIL_ANALYZER',
  'CI_CD_PIPELINE_FAILURE_ANALYZER',
  'PRODUCTION_DEPLOYMENT_READINESS_REVIEWER',
  'RUNTIME_CONFIGURATION_DRIFT_ANALYZER',
  'DATABASE_LOCK_BLOCKING_ANALYZER',
  'CSV_EXCEL_DATA_QUALITY_ANALYZER',
  'FUNNEL_DROP_OFF_ANALYZER',
  'EVIDENCE_GAP_ASSUMPTION_AUDITOR',
  'REQUIREMENTS_TRADE_OFF_ANALYZER',
  'INCIDENT_TIMELINE_RECONSTRUCTOR',
  'PROFESSIONAL_MESSAGE_EMAIL_BUILDER',
  'TRAVEL_RESEARCH_PLANNER',
  'PUBLIC_COMPANY_RESEARCH_BRIEF',
  'CERTIFICATION_READINESS_GAP_ANALYZER',
];

async function loadCatalog() {
  try {
    return await import('../lib/prompts/ai-prompt-library.mjs');
  } catch {
    return null;
  }
}

test('AI Prompt Library preserves the original 80 identities and expands to exactly 100 unique prompts', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog, 'Expected lib/prompts/ai-prompt-library.mjs to exist');
  assert.equal(catalog.AI_PROMPT_LIBRARY.length, 100);

  const ids = catalog.AI_PROMPT_LIBRARY.map((prompt) => prompt.id);
  const names = catalog.AI_PROMPT_LIBRARY.map((prompt) => prompt.name);
  const titles = catalog.AI_PROMPT_LIBRARY.map((prompt) => prompt.displayTitle);
  assert.equal(new Set(ids).size, 100, 'Prompt IDs must be unique');
  assert.equal(new Set(names).size, 100, 'Prompt names must be unique');
  assert.equal(new Set(titles).size, 100, 'Display titles must be unique');
  assert.deepEqual(names.slice(0, 30), EXPECTED_NAMES);
  assert.deepEqual(ids.slice(0, 30), EXPECTED_IDS_30, 'original 30 IDs must remain stable');
  for (const id of BASELINE_80_IDS) assert.ok(ids.includes(id), `missing pre-Quality-V2 ID: ${id}`);

  const additions = catalog.AI_PROMPT_LIBRARY.filter((prompt) => !BASELINE_80_IDS.includes(prompt.id));
  assert.equal(additions.length, 20, 'Quality V2 must add exactly 20 prompts');
  assert.deepEqual(additions.map((prompt) => prompt.name).sort(), [...QUALITY_V2_NEW_NAMES].sort());
  assert.equal(catalog.PROMPT_CATALOG_VERSION, '2026-09-25-ai-library-quality-v2-100');
});

test('the original 30 catalog prompts keep the existing executable metadata contract', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);

  const required = [
    'id', 'name', 'displayTitle', 'description', 'category', 'subcategory', 'promptType', 'prompt',
    'variables', 'variableConfig', 'tags', 'collections', 'language', 'outputFormat', 'compatibleModels', 'sourceType',
    'version', 'status', 'createdAt', 'updatedAt',
  ];

  for (const prompt of catalog.AI_PROMPT_LIBRARY.slice(0, 30)) {
    for (const key of required) assert.ok(Object.hasOwn(prompt, key), `${prompt.name} missing ${key}`);
    assert.equal(prompt.version, '2.0.0');
    assert.equal(prompt.status, 'published');
    assert.deepEqual(prompt.compatibleModels, ['GPT', 'Claude', 'Gemini']);
    assert.ok(prompt.collections.includes('AI Prompt Library'));
    assert.ok(prompt.tags.includes('EXECUTABLE'));
    assert.ok(prompt.prompt.includes('INPUT VALIDATION'));
    assert.ok(prompt.prompt.includes('RELIABILITY RULES'));
    assert.ok(prompt.prompt.includes('Respond in {{language}}'));
    assert.equal(prompt.variables.language, 'Thai');
    assert.equal(prompt.variableConfig.language.defaultValue, 'Thai');
    assert.equal(prompt.variableConfig.language.required, true);

    const detected = catalog.extractCatalogVariables(prompt.prompt).sort();
    const configured = Object.keys(prompt.variables).sort();
    assert.deepEqual(configured, detected, `${prompt.name} variable config must match {{variables}}`);

    for (const name of detected) {
      assert.equal(prompt.variableConfig[name]?.required, true, `${prompt.name}.${name} must be required`);
    }
  }
});

test('the original 30 expose explicit Quality V2 Thai explanations without changing identity', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);
  const original = catalog.AI_PROMPT_LIBRARY.slice(0, 30);
  assert.deepEqual(original.map((prompt) => prompt.id), EXPECTED_IDS_30);

  for (const prompt of original) {
    assert.match(prompt.displayTitleTh || '', /[ก-๙]/, `${prompt.name} missing Thai title`);
    assert.match(prompt.descriptionTh || '', /[ก-๙]/, `${prompt.name} missing Thai description`);
    assert.match(prompt.purposeTh || '', /[ก-๙]/, `${prompt.name} missing Thai purpose`);
    assert.ok(Array.isArray(prompt.useCasesTh) && prompt.useCasesTh.length >= 1, `${prompt.name} missing use cases`);
    assert.ok(Array.isArray(prompt.expectedOutputTh) && prompt.expectedOutputTh.length >= 1, `${prompt.name} missing expected output`);
    assert.match(prompt.exampleInputTh || '', /[ก-๙]/, `${prompt.name} missing Thai example`);
    for (const [name, field] of Object.entries(prompt.variableConfig || {})) {
      if (!field.required) continue;
      assert.ok(field.labelTh?.trim(), `${prompt.name}.${name} missing labelTh`);
      assert.ok(field.helpTh?.trim(), `${prompt.name}.${name} missing helpTh`);
      if (name !== 'language') assert.ok(prompt.inputGuideTh?.[name]?.trim(), `${prompt.name}.${name} missing inputGuideTh`);
    }
  }
});

test('catalog exposes every existing category and collection', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);
  const categories = new Set(catalog.AI_PROMPT_LIBRARY.map((prompt) => prompt.category));
  for (const category of ['Research', 'Coding', 'DevOps', 'Database', 'Data', 'Vision', 'Video', 'Audio', 'Writing', 'Marketing', 'Productivity', 'Education']) {
    assert.ok(categories.has(category), `Missing category: ${category}`);
  }

  for (const collection of ['Popular AI Prompts', 'Research Toolkit', 'Developer Toolkit', 'Data & Analysis', 'Multimodal AI', 'Content Creator', 'Productivity', 'Learning']) {
    assert.ok(catalog.AI_PROMPT_COLLECTIONS.includes(collection), `Missing collection: ${collection}`);
  }
});

test('catalog upgrade refreshes managed templates while preserving user activity state', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);
  const seeded = catalog.AI_PROMPT_LIBRARY[0];
  const legacyManaged = {
    ...seeded,
    prompt: 'LEGACY BUILT-IN TEMPLATE',
    version: '1.0.0',
    favorite: true,
    pinned: true,
    runs: 7,
    copyCount: 3,
    results: [{ id: 'r1', content: 'kept' }],
    variables: { topic: 'Zero Trust', language: '' },
  };
  const merged = catalog.mergePromptCatalog([legacyManaged], catalog.AI_PROMPT_LIBRARY);
  assert.equal(merged.length, 100);
  assert.notEqual(merged[0].prompt, 'LEGACY BUILT-IN TEMPLATE');
  assert.match(merged[0].prompt, /INPUT VALIDATION/);
  assert.equal(merged[0].favorite, true);
  assert.equal(merged[0].pinned, true);
  assert.equal(merged[0].runs, 7);
  assert.equal(merged[0].copyCount, 3);
  assert.equal(merged[0].results.length, 1);
  assert.equal(merged[0].variables.topic, 'Zero Trust');
  assert.equal(merged[0].variables.language, 'Thai');
});

test('variable field inference supports note requirements', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);
  assert.equal(catalog.getVariableInputKind('count'), 'number');
  assert.equal(catalog.getVariableInputKind('slides'), 'number');
  assert.equal(catalog.getVariableInputKind('content'), 'textarea');
  assert.equal(catalog.getVariableInputKind('code'), 'textarea');
  assert.equal(catalog.getVariableInputKind('language'), 'language');
  assert.equal(catalog.getVariableInputKind('tone'), 'tone');
  assert.equal(catalog.getVariableInputKind('topic'), 'text');
});

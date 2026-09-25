import test from 'node:test';
import assert from 'node:assert/strict';

import { AI_PROMPT_LIBRARY, extractCatalogVariables } from '../lib/prompts/ai-prompt-library.mjs';

const NEW_PROMPT_NAMES = [
  'RESEARCH_QUESTION_REFINER',
  'LITERATURE_SYNTHESIS_MATRIX',
  'CLAIM_EVIDENCE_MAP_BUILDER',
  'RESEARCH_GAP_FINDER',
  'CODEBASE_ONBOARDING_GUIDE',
  'REFACTOR_PLAN_BUILDER',
  'SOFTWARE_MIGRATION_PLANNER',
  'ARCHITECTURE_DECISION_RECORD',
  'DEPENDENCY_UPGRADE_PLANNER',
  'API_INTEGRATION_PLANNER',
  'CI_CD_PIPELINE_REVIEWER',
  'INCIDENT_TRIAGE_COORDINATOR',
  'INCIDENT_POSTMORTEM_BUILDER',
  'RUNBOOK_GENERATOR',
  'OBSERVABILITY_PLAN_DESIGNER',
  'NETWORK_TROUBLESHOOTER',
  'NETWORK_CHANGE_RISK_REVIEWER',
  'THREAT_MODEL_BUILDER',
  'API_SECURITY_ASSESSOR',
  'IAM_LEAST_PRIVILEGE_REVIEWER',
  'CLOUD_ARCHITECTURE_REVIEWER',
  'SQL_PERFORMANCE_DIAGNOSTIC',
  'DATABASE_MIGRATION_PLANNER',
  'DATA_QUALITY_RULE_DESIGNER',
  'EXPLORATORY_DATA_ANALYSIS_PLANNER',
  'KPI_VARIANCE_INVESTIGATOR',
  'EXPERIMENT_ANALYSIS_PLANNER',
  'FEATURE_LEAKAGE_AUDITOR',
  'WORKFLOW_AUTOMATION_DESIGNER',
  'WEBHOOK_EVENT_FLOW_DESIGNER',
  'API_ERROR_TROUBLESHOOTER',
  'SOP_BUILDER',
  'DECISION_MEMO_BUILDER',
  'PROJECT_RISK_REGISTER',
  'PROJECT_STATUS_REPORTER',
  'REQUIREMENTS_TO_USER_STORIES',
  'CUSTOMER_FEEDBACK_SYNTHESIZER',
  'SALES_DISCOVERY_PREP',
  'FINANCIAL_VARIANCE_NARRATIVE',
  'STUDY_PLAN_GENERATOR',
  'MISCONCEPTION_DIAGNOSER',
  'INTERVIEW_PREP_COACH',
  'CONTENT_REPURPOSING_PLANNER',
  'SEO_CONTENT_REFRESH_AUDITOR',
  'TRANSLATION_QA_REVIEWER',
  'DOCUMENT_CHANGE_IMPACT_ANALYZER',
  'VIDEO_CHAPTER_GENERATOR',
  'TRAVEL_ITINERARY_OPTIMIZER',
  'PROMPT_EVALUATION_TEST_BUILDER',
  'PROMPT_VARIABLE_SCHEMA_DESIGNER',
];

const hasThai = (value) => /[ก-๙]/.test(String(value || ''));

test('100 prompt catalog preserves all 50 researched prompts', () => {
  assert.equal(AI_PROMPT_LIBRARY.length, 100);
  const names = AI_PROMPT_LIBRARY.map((prompt) => prompt.name);
  assert.equal(new Set(names).size, 100, 'all prompt names must be unique');
  for (const name of NEW_PROMPT_NAMES) assert.ok(names.includes(name), `missing researched prompt: ${name}`);
});

test('all researched prompts have Thai/English metadata, usage guidance, provenance, and executable variables', () => {
  const researched = AI_PROMPT_LIBRARY.filter((prompt) => NEW_PROMPT_NAMES.includes(prompt.name));
  assert.equal(researched.length, 50);

  for (const prompt of researched) {
    assert.ok(prompt.displayTitle, `${prompt.name} missing English title`);
    assert.ok(hasThai(prompt.displayTitleTh), `${prompt.name} missing Thai title`);
    assert.ok(prompt.description, `${prompt.name} missing English description`);
    assert.ok(hasThai(prompt.descriptionTh), `${prompt.name} missing Thai description`);
    assert.ok(prompt.usageGuideEn?.includes('1.'), `${prompt.name} missing English usage guide`);
    assert.ok(hasThai(prompt.usageGuideTh), `${prompt.name} missing Thai usage guide`);
    assert.ok(prompt.sourceType, `${prompt.name} missing source type`);
    assert.ok(Array.isArray(prompt.sourceInspiration), `${prompt.name} source inspiration must be an array`);
    assert.ok(prompt.difficulty, `${prompt.name} missing difficulty`);
    assert.ok(prompt.estimatedValue, `${prompt.name} missing estimated value`);
    assert.equal(prompt.variables.language, 'Thai');
    assert.equal(prompt.variableConfig.language.defaultValue, 'Thai');
    assert.ok(prompt.prompt.includes('INPUT VALIDATION'));
    assert.ok(prompt.prompt.includes('RELIABILITY RULES'));

    const detected = extractCatalogVariables(prompt.prompt).sort();
    const configured = Object.keys(prompt.variableConfig).sort();
    assert.deepEqual(configured, detected, `${prompt.name} variable config must match prompt placeholders`);
  }
});

test('researched variable schema preserves types, optional fields, defaults, and options', () => {
  const research = AI_PROMPT_LIBRARY.find((prompt) => prompt.name === 'RESEARCH_QUESTION_REFINER');
  assert.equal(research.variableConfig.topic.type, 'text');
  assert.equal(research.variableConfig.topic.required, true);
  assert.equal(research.variableConfig.context.type, 'textarea');
  assert.equal(research.variableConfig.context.required, false);
  assert.equal(research.variableConfig.output_format.type, 'select');
  assert.equal(research.variableConfig.output_format.required, false);
  assert.ok(research.variableConfig.output_format.options.includes('JSON'));

  const translation = AI_PROMPT_LIBRARY.find((prompt) => prompt.name === 'TRANSLATION_QA_REVIEWER');
  assert.equal(translation.variableConfig.source_language.defaultValue, 'Auto-detect');
  assert.ok(translation.variableConfig.source_language.options.includes('Thai'));
  assert.equal(translation.variableConfig.target_language.defaultValue, 'Thai');
});

test('selected researched prompts retain their production task instructions', () => {
  const network = AI_PROMPT_LIBRARY.find((prompt) => prompt.name === 'NETWORK_TROUBLESHOOTER');
  assert.match(network.prompt, /structured fault isolation/i);
  assert.match(network.prompt, /Avoid config changes until evidence justifies them/i);

  const travel = AI_PROMPT_LIBRARY.find((prompt) => prompt.name === 'TRAVEL_ITINERARY_OPTIMIZER');
  assert.match(travel.prompt, /Group activities geographically/i);
  assert.match(travel.prompt, /fallback options/i);
});

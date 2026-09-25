import test from 'node:test';
import assert from 'node:assert/strict';

import { AI_PROMPT_LIBRARY, PROMPT_CATALOG_VERSION } from '../lib/prompts/ai-prompt-library.mjs';
import { BASELINE_PROMPT_IDS_80 } from './fixtures/prompt-catalog-baseline-80.mjs';
import { validatePromptCatalog } from '../lib/prompts/quality-validator.mjs';

export const FINAL_NEW_PROMPT_NAMES = Object.freeze([
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
]);

test('Quality V2 expands the built-in catalog from 80 to exactly 100 without losing baseline ids', () => {
  assert.equal(PROMPT_CATALOG_VERSION, '2026-09-25-ai-library-quality-v2-100');
  assert.equal(AI_PROMPT_LIBRARY.length, 100);
  const ids = AI_PROMPT_LIBRARY.map((prompt) => prompt.id);
  const names = AI_PROMPT_LIBRARY.map((prompt) => prompt.name);
  assert.equal(new Set(ids).size, 100, 'all built-in ids must be unique');
  assert.equal(new Set(names).size, 100, 'all built-in names must be unique');
  for (const id of BASELINE_PROMPT_IDS_80) assert.ok(ids.includes(id), `lost baseline id ${id}`);
  for (const name of FINAL_NEW_PROMPT_NAMES) assert.ok(names.includes(name), `missing new prompt ${name}`);
});

test('superseded duplicate candidates are not introduced as new prompt names', () => {
  const names = new Set(AI_PROMPT_LIBRARY.map((prompt) => prompt.name));
  for (const duplicate of [
    'SQL_QUERY_PERFORMANCE_DIAGNOSER',
    'KPI_MOVEMENT_ROOT_CAUSE_ANALYZER',
    'EVIDENCE_MATRIX_BUILDER',
    'CERTIFICATION_STUDY_PLANNER',
    'NETWORK_INCIDENT_FAULT_ISOLATION',
  ]) {
    assert.equal(names.has(duplicate), false, `duplicate intent candidate leaked into catalog: ${duplicate}`);
  }
});

test('all 100 built-ins satisfy the deterministic Quality V2 metadata contract', () => {
  const result = validatePromptCatalog(AI_PROMPT_LIBRARY);
  assert.equal(result.ok, true, JSON.stringify(result.errors.slice(0, 10)));
  assert.equal(result.results.length, 100);
});

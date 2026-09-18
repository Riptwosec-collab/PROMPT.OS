import { createPack } from './packs.mjs';

export const DEFAULT_PACK_BLUEPRINTS = Object.freeze([
  Object.freeze({
    id: 'network-engineer',
    name: 'Network Engineer',
    promptNames: Object.freeze([
      'NETWORK_TROUBLESHOOTER',
      'INCIDENT_TRIAGE_COORDINATOR',
      'RUNBOOK_GENERATOR',
      'NETWORK_CHANGE_RISK_REVIEWER',
      'CLOUD_ARCHITECTURE_REVIEWER',
    ]),
  }),
  Object.freeze({
    id: 'research',
    name: 'Research',
    promptNames: Object.freeze([
      'DEEP_RESEARCH_ASSISTANT',
      'FACT_CHECKER',
      'SOURCE_COMPARATOR',
      'RESEARCH_QUESTION_REFINER',
      'LITERATURE_SYNTHESIS_MATRIX',
    ]),
  }),
  Object.freeze({
    id: 'developer',
    name: 'Developer',
    promptNames: Object.freeze([
      'CODE_REVIEWER',
      'BUG_HUNTER',
      'API_DESIGNER',
      'DATABASE_SCHEMA_DESIGNER',
      'CI_CD_PIPELINE_REVIEWER',
    ]),
  }),
]);

export function buildDefaultPacks(prompts = []) {
  const byName = new Map((Array.isArray(prompts) ? prompts : []).map((prompt) => [prompt?.name, prompt?.id]));
  return DEFAULT_PACK_BLUEPRINTS.map((blueprint) => createPack({
    id: blueprint.id,
    name: blueprint.name,
    promptIds: blueprint.promptNames
      .map((promptName) => byName.get(promptName))
      .filter((value) => value !== undefined),
  }));
}

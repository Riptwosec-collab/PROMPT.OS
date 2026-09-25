import { RESEARCH_PROMPTS } from './catalog/research.mjs';
import { DEVELOPMENT_PROMPTS } from './catalog/development.mjs';
import { DATA_PROMPTS } from './catalog/data.mjs';
import { MULTIMODAL_PROMPTS } from './catalog/multimodal.mjs';
import { CONTENT_PROMPTS } from './catalog/content.mjs';
import { PRODUCTIVITY_LEARNING_PROMPTS } from './catalog/productivity-learning.mjs';
import { RESEARCHED_PROMPT_LIBRARY } from './catalog/researched.mjs';
import { NEW_QUALITY_PROMPT_SPECS } from './catalog/quality-v2/new-prompts.mjs';
import { enrichBuiltInPrompt, QUALITY_V2_METADATA } from './catalog/quality-v2/index.mjs';
import { translateComplete } from '../i18n/complete.mjs';

export const PROMPT_CATALOG_VERSION = '2026-09-25-ai-library-quality-v2-100';

export const AI_PROMPT_COLLECTIONS = Object.freeze([
  'AI Prompt Library',
  'Popular AI Prompts',
  'Research Toolkit',
  'Developer Toolkit',
  'Data & Analysis',
  'Multimodal AI',
  'Content Creator',
  'Productivity',
  'Learning',
]);

const CREATED_AT = '2026-09-16T06:10:00.000Z';
const UPDATED_AT = '2026-09-25T05:00:00.000Z';
const COMPATIBLE_MODELS = Object.freeze(['GPT', 'Claude', 'Gemini']);
const DEFAULT_OUTPUT_LANGUAGE = 'Thai';

const TEXTAREA_VARIABLES = new Set([
  'content', 'article', 'paper', 'code', 'transcript', 'sources', 'schema', 'requirements', 'objectives',
  'actual_behavior', 'error', 'application', 'system', 'columns', 'text', 'input', 'categories',
  'source_destination', 'topology_context', 'routing_output', 'symptoms', 'show_output', 'logs', 'environment',
  'traffic_flow', 'acl_or_rules', 'alert', 'evidence', 'email_content', 'headers', 'pipeline', 'recent_changes',
  'change_summary', 'test_evidence', 'deployment_plan', 'rollback_plan', 'expected_config', 'observed_config',
  'environment_context', 'lock_evidence', 'queries', 'data_description', 'sample_data', 'funnel_definition',
  'funnel_data', 'decision_or_claim', 'options', 'constraints', 'events', 'time_context', 'incident_goal',
  'context', 'preferences', 'research_goal', 'blueprint_or_topics', 'current_evidence',
]);

export function getVariableInputKind(name = '') {
  const key = String(name).trim().toLowerCase();
  if (['count', 'slides'].includes(key)) return 'number';
  if (TEXTAREA_VARIABLES.has(key)) return 'textarea';
  if (key === 'language') return 'language';
  if (key === 'tone') return 'tone';
  return 'text';
}

function buildVariableConfig(names = []) {
  return Object.fromEntries(names.map((name) => {
    if (name === 'language') {
      return [name, {
        type: 'select',
        required: true,
        defaultValue: DEFAULT_OUTPUT_LANGUAGE,
        label: 'Output language',
        options: ['Thai', 'English', 'Multi-language'],
      }];
    }

    return [name, {
      type: getVariableInputKind(name),
      required: true,
      defaultValue: '',
      label: name.replace(/_/g, ' '),
    }];
  }));
}

function buildUsageGuides(variableNames = []) {
  const requiredNames = variableNames.filter((name) => name !== 'language');
  const fieldsEn = requiredNames.length
    ? requiredNames.map((name) => `{{${name}}}`).join(', ')
    : 'the required image, video, audio, document, or other source file';
  const fieldsTh = requiredNames.length
    ? requiredNames.map((name) => `{{${name}}}`).join(', ')
    : 'รูปภาพ วิดีโอ เสียง เอกสาร หรือไฟล์ต้นฉบับที่พรอมต์ต้องใช้';

  return {
    en: [
      'HOW TO USE PROMPT',
      `1. Fill or provide the required input: ${fieldsEn}.`,
      '2. Choose the output language. Thai is selected by default.',
      '3. Review the rendered prompt and make sure no required placeholder is left blank.',
      '4. Run the prompt. If required information is missing, the assistant will ask only for the missing input instead of guessing.',
    ].join('\n'),
    th: [
      'วิธีใช้พรอมต์',
      `1. กรอกหรือแนบข้อมูลที่จำเป็น: ${fieldsTh}.`,
      '2. เลือกภาษาของผลลัพธ์ โดยค่าเริ่มต้นเป็นภาษาไทย',
      '3. ตรวจตัวอย่างพรอมต์หลังแทนค่าตัวแปร และตรวจว่าไม่มีช่องที่จำเป็นเว้นว่าง',
      '4. กดรันพรอมต์ หากข้อมูลสำคัญยังขาด ระบบจะถามเฉพาะข้อมูลที่ขาดแทนการเดาเอง',
    ].join('\n'),
  };
}

function buildExecutablePrompt(spec, variableNames) {
  const requiredNames = variableNames.filter((name) => name !== 'language');
  const requiredList = requiredNames.length ? requiredNames.map((name) => `- {{${name}}}`).join('\n') : '- No text fields. Use the media/file supplied with this request when applicable.';

  return `You are executing a reusable production prompt template.\n\nOUTPUT LANGUAGE\nRespond in {{language}}. Keep code, commands, identifiers, JSON keys, product names, and technical terms in their original form when translating them would reduce accuracy.\n\nINPUT VALIDATION\nRequired inputs for this template:\n${requiredList}\n\nBefore doing the task, check whether any required field is blank or still displayed as an unresolved placeholder token. If any required input is missing, do not guess. Ask the user only for the missing input(s), then stop.\n\nRELIABILITY RULES\n- Do not invent facts, sources, measurements, dates, code behavior, or file contents.\n- Clearly distinguish provided information from assumptions or inference.\n- Follow the requested output format exactly when one is specified.\n- Preserve important names, numbers, code, URLs, and quoted source material accurately.\n- If the task depends on an image, video, audio file, document, source text, or code that was not actually provided, ask for it instead of pretending to analyze it.\n\nTASK\n${spec.prompt}\n\nFINAL CHECK\nBefore answering, verify that every requested section is present and that no required input was silently fabricated.`;
}

export function buildPromptFromSpec(spec) {
  const requestedVariableNames = Array.isArray(spec.variables) ? spec.variables : [];
  const variableNames = [...new Set([...requestedVariableNames, 'language'])];
  const variableConfig = buildVariableConfig(variableNames);
  const values = Object.fromEntries(variableNames.map((name) => [name, variableConfig[name]?.defaultValue ?? '']));
  const usageGuide = buildUsageGuides(variableNames);
  const displayTitleTh = spec.displayTitleTh || translateComplete('th', spec.displayTitle);
  const descriptionTh = spec.descriptionTh || translateComplete('th', spec.description);

  return {
    id: `ai-lib-${String(spec.name).toLowerCase().replace(/_/g, '-')}`,
    name: spec.name,
    displayTitle: spec.displayTitle,
    displayTitleTh,
    title: spec.displayTitle,
    description: spec.description,
    descriptionTh,
    usageGuideEn: usageGuide.en,
    usageGuideTh: usageGuide.th,
    category: spec.category,
    subcategory: spec.subcategory || '',
    promptType: String(spec.category || 'text').toLowerCase(),
    type: 'text',
    prompt: buildExecutablePrompt(spec, variableNames),
    variables: values,
    variableConfig,
    tags: [...new Set([...(spec.tags || []), spec.name, 'EXECUTABLE'])],
    collections: [...new Set(['AI Prompt Library', ...(spec.collections || [])])],
    language: 'Multi-language',
    outputFormat: spec.outputFormat || 'Structured response',
    compatibleModels: [...COMPATIBLE_MODELS],
    exampleInput: spec.exampleInput || usageGuide.en,
    exampleOutput: spec.exampleOutput || '',
    sourceType: 'Built-in Prompt Catalog',
    catalogManaged: true,
    catalogVersion: PROMPT_CATALOG_VERSION,
    version: '2.0.0',
    status: 'published',
    runs: 0,
    results: [],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
}

const PROMPT_SPECS = [
  ...RESEARCH_PROMPTS,
  ...DEVELOPMENT_PROMPTS,
  ...DATA_PROMPTS,
  ...MULTIMODAL_PROMPTS,
  ...CONTENT_PROMPTS,
  ...PRODUCTIVITY_LEARNING_PROMPTS,
];

const CORE_PROMPTS = PROMPT_SPECS.map((spec) => enrichBuiltInPrompt(buildPromptFromSpec(spec), QUALITY_V2_METADATA));
const RESEARCHED_PROMPTS = RESEARCHED_PROMPT_LIBRARY.map((item) => enrichBuiltInPrompt(item, QUALITY_V2_METADATA));
const NEW_PROMPTS = NEW_QUALITY_PROMPT_SPECS.map((spec) => enrichBuiltInPrompt(buildPromptFromSpec(spec), QUALITY_V2_METADATA));

export const AI_PROMPT_LIBRARY = Object.freeze([
  ...CORE_PROMPTS,
  ...RESEARCHED_PROMPTS,
  ...NEW_PROMPTS,
]);

function normalizeIdentity(value) {
  return String(value ?? '').trim().toLowerCase();
}

function promptIdentityKeys(prompt = {}) {
  return [prompt.id, prompt.name, prompt.displayTitle]
    .map(normalizeIdentity)
    .filter(Boolean);
}

function isManagedCatalogPrompt(prompt = {}) {
  return Boolean(prompt.catalogManaged) || String(prompt.id || '').startsWith('ai-lib-');
}

function mergeManagedPrompt(existing, catalog) {
  const promptChanged = String(existing.prompt || '') !== String(catalog.prompt || '');
  const existingVersions = Array.isArray(existing.versions) ? existing.versions : [];
  const hasCatalogVersion = existingVersions.some((item) => item?.version === catalog.version && item?.note === 'Built-in catalog executable upgrade');
  const versions = promptChanged && !hasCatalogVersion
    ? [{
        id: `${catalog.id}-${catalog.version}-catalog`,
        version: catalog.version,
        prompt: catalog.prompt,
        updatedAt: catalog.updatedAt,
        note: 'Built-in catalog executable upgrade',
      }, ...existingVersions]
    : existingVersions;

  return {
    ...existing,
    ...catalog,
    favorite: Boolean(existing.favorite),
    pinned: Boolean(existing.pinned),
    rating: Number(existing.rating || 0),
    copyCount: Number(existing.copyCount || 0),
    runs: Number(existing.runs || 0),
    results: Array.isArray(existing.results) ? existing.results : [],
    deletedAt: existing.deletedAt || null,
    createdAt: existing.createdAt || catalog.createdAt,
    versions,
    collections: [...new Set([...(catalog.collections || []), ...(existing.collections || [])])],
    variables: { ...(catalog.variables || {}), ...(existing.variables || {}), language: existing.variables?.language || DEFAULT_OUTPUT_LANGUAGE },
  };
}

export function mergePromptCatalog(existing = [], incoming = AI_PROMPT_LIBRARY) {
  const result = [];
  const consumedIncoming = new Set();

  for (const current of existing) {
    const currentKeys = new Set(promptIdentityKeys(current));
    const matchIndex = incoming.findIndex((candidate) => promptIdentityKeys(candidate).some((key) => currentKeys.has(key)));

    if (matchIndex >= 0) {
      consumedIncoming.add(matchIndex);
      const catalog = incoming[matchIndex];
      result.push(isManagedCatalogPrompt(current) ? mergeManagedPrompt(current, catalog) : current);
    } else {
      result.push(current);
    }
  }

  incoming.forEach((item, index) => {
    if (!consumedIncoming.has(index)) result.push(item);
  });

  return result;
}

export function extractCatalogVariables(prompt = '') {
  const matches = [...String(prompt).matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)];
  return [...new Set(matches.map((match) => match[1]))];
}

import { RESEARCH_PROMPTS } from './catalog/research.mjs';
import { DEVELOPMENT_PROMPTS } from './catalog/development.mjs';
import { DATA_PROMPTS } from './catalog/data.mjs';
import { MULTIMODAL_PROMPTS } from './catalog/multimodal.mjs';
import { CONTENT_PROMPTS } from './catalog/content.mjs';
import { PRODUCTIVITY_LEARNING_PROMPTS } from './catalog/productivity-learning.mjs';

export const PROMPT_CATALOG_VERSION = '2026-09-16-ai-library-v1';

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
const COMPATIBLE_MODELS = Object.freeze(['GPT', 'Claude', 'Gemini']);

export function getVariableInputKind(name = '') {
  const key = String(name).trim().toLowerCase();
  if (['count', 'slides'].includes(key)) return 'number';
  if (['content', 'article', 'paper', 'code', 'transcript', 'sources', 'schema', 'requirements'].includes(key)) return 'textarea';
  if (key === 'language') return 'language';
  if (key === 'tone') return 'tone';
  return 'text';
}

function buildVariableConfig(names = []) {
  return Object.fromEntries(names.map((name) => [name, {
    type: getVariableInputKind(name),
    required: false,
    defaultValue: '',
  }]));
}

function buildPrompt(spec) {
  const variableNames = Array.isArray(spec.variables) ? spec.variables : [];
  return {
    id: `ai-lib-${String(spec.name).toLowerCase().replace(/_/g, '-')}`,
    name: spec.name,
    displayTitle: spec.displayTitle,
    title: spec.displayTitle,
    description: spec.description,
    category: spec.category,
    subcategory: spec.subcategory || '',
    promptType: String(spec.category || 'text').toLowerCase(),
    type: 'text',
    prompt: spec.prompt,
    variables: Object.fromEntries(variableNames.map((name) => [name, ''])),
    variableConfig: buildVariableConfig(variableNames),
    tags: [...new Set([...(spec.tags || []), spec.name])],
    collections: [...new Set(['AI Prompt Library', ...(spec.collections || [])])],
    language: 'Multi-language',
    outputFormat: spec.outputFormat || 'Structured response',
    compatibleModels: [...COMPATIBLE_MODELS],
    exampleInput: spec.exampleInput || '',
    exampleOutput: spec.exampleOutput || '',
    sourceType: 'User Prompt Note',
    version: '1.0.0',
    status: 'published',
    runs: 0,
    results: [],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
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

export const AI_PROMPT_LIBRARY = Object.freeze(PROMPT_SPECS.map(buildPrompt));

function normalizeIdentity(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function mergePromptCatalog(existing = [], incoming = AI_PROMPT_LIBRARY) {
  const result = [...existing];
  const identities = new Set();

  for (const prompt of existing) {
    for (const value of [prompt.id, prompt.name, prompt.displayTitle]) {
      const normalized = normalizeIdentity(value);
      if (normalized) identities.add(normalized);
    }
  }

  for (const prompt of incoming) {
    const keys = [prompt.id, prompt.name, prompt.displayTitle]
      .map(normalizeIdentity)
      .filter(Boolean);
    if (keys.some((key) => identities.has(key))) continue;
    result.push(prompt);
    keys.forEach((key) => identities.add(key));
  }

  return result;
}

export function extractCatalogVariables(prompt = '') {
  const matches = [...String(prompt).matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)];
  return [...new Set(matches.map((match) => match[1]))];
}

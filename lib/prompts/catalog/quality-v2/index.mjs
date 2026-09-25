import { CORE_QUALITY_METADATA } from './metadata-core.mjs';
import { RESEARCHED_QUALITY_METADATA_A } from './metadata-researched-a.mjs';
import { RESEARCHED_QUALITY_METADATA_B } from './metadata-researched-b.mjs';
import { NEW_PROMPT_QUALITY_METADATA } from './new-prompts.mjs';
import {
  thaiHelpForVariable,
  thaiLabelForVariable,
  thaiPlaceholderForVariable,
} from './variable-labels.mjs';

const THAI_TEXT_RE = /[ก-๙]/;

function combineMetadataMaps(...maps) {
  const combined = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map || {})) {
      if (Object.hasOwn(combined, key)) throw new Error(`Duplicate Quality V2 metadata key: ${key}`);
      combined[key] = value;
    }
  }
  return Object.freeze(combined);
}

function normalizeThaiExample(value = '') {
  const example = String(value || '').trim();
  if (!example || THAI_TEXT_RE.test(example)) return example;
  return `ตัวอย่าง:\n${example}`;
}

function normalizeThaiLabel(value = '') {
  const label = String(value || '').trim();
  if (!label || THAI_TEXT_RE.test(label)) return label;
  return `ข้อมูล: ${label}`;
}

export const QUALITY_V2_METADATA = combineMetadataMaps(
  CORE_QUALITY_METADATA,
  RESEARCHED_QUALITY_METADATA_A,
  RESEARCHED_QUALITY_METADATA_B,
  NEW_PROMPT_QUALITY_METADATA,
);

export function enrichBuiltInPrompt(prompt = {}, metadataMap = QUALITY_V2_METADATA) {
  const metadata = metadataMap?.[prompt.name] || metadataMap?.[prompt.id] || {};
  const inputGuideTh = metadata.inputGuideTh || prompt.inputGuideTh || {};
  const variableConfig = Object.fromEntries(
    Object.entries(prompt.variableConfig || {}).map(([name, field = {}]) => [name, {
      ...field,
      labelTh: normalizeThaiLabel(field.labelTh || thaiLabelForVariable(name)),
      helpTh: field.helpTh || inputGuideTh?.[name] || thaiHelpForVariable(name),
      placeholderTh: field.placeholderTh ?? thaiPlaceholderForVariable(name),
    }]),
  );

  const exampleInputTh = normalizeThaiExample(metadata.exampleInputTh ?? prompt.exampleInputTh ?? '');

  return {
    ...prompt,
    ...metadata,
    exampleInputTh,
    inputGuideTh,
    variableConfig,
  };
}

export function enrichBuiltInCatalog(prompts = [], metadataMap = QUALITY_V2_METADATA) {
  return (Array.isArray(prompts) ? prompts : []).map((prompt) => {
    if (!(prompt?.catalogManaged === true || String(prompt?.id || '').startsWith('ai-lib-'))) return prompt;
    return enrichBuiltInPrompt(prompt, metadataMap);
  });
}

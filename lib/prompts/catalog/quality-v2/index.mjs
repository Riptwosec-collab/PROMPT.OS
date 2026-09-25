import { CORE_QUALITY_METADATA } from './metadata-core.mjs';
import { RESEARCHED_QUALITY_METADATA_A } from './metadata-researched-a.mjs';
import { RESEARCHED_QUALITY_METADATA_B } from './metadata-researched-b.mjs';
import {
  thaiHelpForVariable,
  thaiLabelForVariable,
  thaiPlaceholderForVariable,
} from './variable-labels.mjs';

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

export const QUALITY_V2_METADATA = combineMetadataMaps(
  CORE_QUALITY_METADATA,
  RESEARCHED_QUALITY_METADATA_A,
  RESEARCHED_QUALITY_METADATA_B,
);

export function enrichBuiltInPrompt(prompt = {}, metadataMap = QUALITY_V2_METADATA) {
  const metadata = metadataMap?.[prompt.name] || metadataMap?.[prompt.id] || {};
  const inputGuideTh = metadata.inputGuideTh || prompt.inputGuideTh || {};
  const variableConfig = Object.fromEntries(
    Object.entries(prompt.variableConfig || {}).map(([name, field = {}]) => [name, {
      ...field,
      labelTh: field.labelTh || thaiLabelForVariable(name),
      helpTh: field.helpTh || inputGuideTh?.[name] || thaiHelpForVariable(name),
      placeholderTh: field.placeholderTh ?? thaiPlaceholderForVariable(name),
    }]),
  );

  return {
    ...prompt,
    ...metadata,
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

import { thaiVariableMetadata } from './variable-labels.mjs';

function builtIn(prompt = {}) {
  return Boolean(prompt.catalogManaged) || String(prompt.id || '').startsWith('ai-lib-');
}

function resolveMetadata(prompt, metadataMap = {}) {
  if (!metadataMap || typeof metadataMap !== 'object') return {};
  return metadataMap[prompt?.name] || metadataMap[prompt?.id] || {};
}

export function enrichBuiltInPrompt(prompt = {}, metadataMap = {}) {
  if (!builtIn(prompt)) return prompt;

  const metadata = resolveMetadata(prompt, metadataMap);
  const explicitInputGuide = {
    ...(prompt.inputGuideTh || {}),
    ...(metadata.inputGuideTh || {}),
  };

  const inputGuideTh = { ...explicitInputGuide };
  for (const [name, field = {}] of Object.entries(prompt.variableConfig || {})) {
    if (!field.required || name === 'language') continue;
    if (!inputGuideTh[name]) inputGuideTh[name] = thaiVariableMetadata(name).helpTh;
  }

  const variableConfig = Object.fromEntries(
    Object.entries(prompt.variableConfig || {}).map(([name, field = {}]) => {
      const fallback = thaiVariableMetadata(name);
      return [name, {
        ...field,
        labelTh: field.labelTh || metadata.variableConfig?.[name]?.labelTh || fallback.labelTh,
        helpTh: field.helpTh || metadata.variableConfig?.[name]?.helpTh || inputGuideTh[name] || fallback.helpTh,
        placeholderTh: field.placeholderTh || metadata.variableConfig?.[name]?.placeholderTh || fallback.placeholderTh,
      }];
    }),
  );

  return {
    ...prompt,
    ...metadata,
    inputGuideTh,
    variableConfig,
  };
}

export function enrichBuiltInCatalog(prompts = [], metadataMap = {}) {
  return (Array.isArray(prompts) ? prompts : []).map((prompt) => enrichBuiltInPrompt(prompt, metadataMap));
}

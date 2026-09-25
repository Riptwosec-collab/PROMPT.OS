import {
  thaiHelpForVariable,
  thaiLabelForVariable,
  thaiPlaceholderForVariable,
} from './variable-labels.mjs';

export function enrichBuiltInPrompt(prompt = {}, metadataMap = {}) {
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

export function enrichBuiltInCatalog(prompts = [], metadataMap = {}) {
  return (Array.isArray(prompts) ? prompts : []).map((prompt) => {
    if (!(prompt?.catalogManaged === true || String(prompt?.id || '').startsWith('ai-lib-'))) return prompt;
    return enrichBuiltInPrompt(prompt, metadataMap);
  });
}

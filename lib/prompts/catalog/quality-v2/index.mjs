import { thaiVariableMetadata } from './variable-labels.mjs';

const STATIC_METADATA_CORRECTIONS = Object.freeze({
  DOCKER_GENERATOR: Object.freeze({
    exampleInputTh: 'ตัวอย่าง: Application = Next.js web app, Technology = Node.js 22, Requirements = non-root user, health check และ production build',
  }),
  JSON_EXTRACTOR: Object.freeze({
    exampleInputTh: 'ตัวอย่างข้อมูล: Order #A-102, ลูกค้า Somchai, ยอดรวม 1,250 THB\nSchema: {"order_id":"","customer":"","total":0}',
  }),
  PRESENTATION_BUILDER: Object.freeze({
    exampleInputTh: 'ตัวอย่าง: Topic = Quarterly IT Operations Review, Audience = ผู้บริหาร, Slides = 8 สไลด์',
  }),
});

function builtIn(prompt = {}) {
  return Boolean(prompt.catalogManaged) || String(prompt.id || '').startsWith('ai-lib-');
}

function resolveMetadata(prompt, metadataMap = {}) {
  if (!metadataMap || typeof metadataMap !== 'object') return {};
  const metadata = metadataMap[prompt?.name] || metadataMap[prompt?.id] || {};
  const correction = STATIC_METADATA_CORRECTIONS[prompt?.name] || {};
  return { ...metadata, ...correction };
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

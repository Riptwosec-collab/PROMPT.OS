function normalize(value) {
  return String(value ?? '').trim();
}

function isBuiltIn(prompt = {}) {
  return Boolean(prompt.catalogManaged) || String(prompt.id || '').startsWith('ai-lib-');
}

function placeholders(prompt = '') {
  return [...new Set([...String(prompt).matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)].map((match) => match[1]))];
}

function arrayOfText(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => normalize(item));
}

function objectValue(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function validateBuiltInPrompt(prompt = {}) {
  if (!isBuiltIn(prompt)) return { ok: true, errors: [], warnings: [] };

  const errors = [];
  const warnings = [];
  const add = (code, message) => errors.push({ code, message });

  if (!normalize(prompt.id)) add('missing-id', 'Built-in prompt requires id');
  if (!normalize(prompt.name)) add('missing-name', 'Built-in prompt requires name');
  if (!normalize(prompt.displayTitle || prompt.title)) add('missing-title', 'Built-in prompt requires display title');
  if (!normalize(prompt.displayTitleTh)) add('missing-title-th', 'Built-in prompt requires Thai title');
  if (!normalize(prompt.descriptionTh)) add('missing-description-th', 'Built-in prompt requires Thai description');
  if (!normalize(prompt.purposeTh)) add('missing-purpose-th', 'Built-in prompt requires Thai purpose');
  if (!arrayOfText(prompt.useCasesTh)) add('invalid-use-cases-th', 'useCasesTh must be a non-empty string array');
  if (!arrayOfText(prompt.expectedOutputTh)) add('invalid-expected-output-th', 'expectedOutputTh must be a non-empty string array');
  if (!normalize(prompt.exampleInputTh)) add('missing-example-input-th', 'Built-in prompt requires Thai example input');
  if (!objectValue(prompt.inputGuideTh)) add('invalid-input-guide-th', 'inputGuideTh must be an object');
  if (!normalize(prompt.prompt)) add('missing-executable-task', 'Built-in prompt requires executable prompt text');

  const config = objectValue(prompt.variableConfig) ? prompt.variableConfig : {};
  const promptVariables = placeholders(prompt.prompt).sort();
  const configuredVariables = Object.keys(config).sort();
  if (JSON.stringify(promptVariables) !== JSON.stringify(configuredVariables)) {
    add('placeholder-config-mismatch', `Prompt placeholders (${promptVariables.join(', ')}) must match variableConfig (${configuredVariables.join(', ')})`);
  }

  for (const [name, field = {}] of Object.entries(config)) {
    if (field.required) {
      if (!normalize(field.labelTh)) add('missing-variable-label-th', `${name} requires labelTh`);
      if (!normalize(field.helpTh)) add('missing-variable-help-th', `${name} requires helpTh`);
      if (name !== 'language' && !normalize(prompt.inputGuideTh?.[name])) {
        add('missing-input-guide-th', `${name} requires inputGuideTh guidance`);
      }
    }

    const type = String(field.type || 'text');
    if (type === 'select' || type === 'language' || type === 'tone') {
      const options = Array.isArray(field.options) ? field.options.map(String) : [];
      const defaultValue = field.defaultValue ?? field.default ?? '';
      if (normalize(defaultValue) && !options.includes(String(defaultValue))) {
        add('invalid-select-default', `${name} default must be one of its options`);
      }
    }

    if (type === 'number') {
      const defaultValue = field.defaultValue ?? field.default ?? '';
      if (defaultValue !== '' && defaultValue != null && !Number.isFinite(Number(defaultValue))) {
        add('invalid-number-default', `${name} number default must be finite`);
      }
    }
  }

  if (normalize(prompt.displayTitle).length > 90) warnings.push({ code: 'long-title', message: 'Display title is unusually long' });
  if (normalize(prompt.descriptionTh).length > 240) warnings.push({ code: 'long-description-th', message: 'Thai description is unusually long' });

  return { ok: errors.length === 0, errors, warnings };
}

export function validatePromptCatalog(prompts = []) {
  const source = Array.isArray(prompts) ? prompts : [];
  const results = source.map((prompt) => ({ id: prompt?.id, ...validateBuiltInPrompt(prompt) }));
  const errors = results.flatMap((result) => result.errors.map((error) => ({ id: result.id, ...error })));
  const warnings = results.flatMap((result) => result.warnings.map((warning) => ({ id: result.id, ...warning })));

  const duplicateChecks = [
    ['id', 'duplicate-id'],
    ['name', 'duplicate-name'],
    ['displayTitle', 'duplicate-display-title'],
  ];

  for (const [key, code] of duplicateChecks) {
    const seen = new Set();
    for (const prompt of source) {
      const value = normalize(prompt?.[key]).toLowerCase();
      if (!value) continue;
      if (seen.has(value)) errors.push({ id: prompt?.id, code, message: `Duplicate ${key}: ${prompt?.[key]}` });
      else seen.add(value);
    }
  }

  return { ok: errors.length === 0, errors, warnings, results };
}

const PLACEHOLDER_RE = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

function placeholders(template = '') {
  return [...new Set([...String(template).matchAll(PLACEHOLDER_RE)].map((match) => match[1]))];
}

function text(value) {
  return String(value ?? '').trim();
}

function addError(errors, code, message, field = '') {
  errors.push({ code, message, ...(field ? { field } : {}) });
}

export function validateBuiltInPrompt(prompt = {}) {
  const errors = [];
  const warnings = [];

  for (const key of ['id', 'name', 'displayTitle']) {
    if (!text(prompt?.[key])) addError(errors, `missing-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`, `Missing ${key}`, key);
  }

  if (!text(prompt.displayTitleTh)) addError(errors, 'missing-display-title-th', 'Missing Thai display title', 'displayTitleTh');
  if (!text(prompt.descriptionTh)) addError(errors, 'missing-description-th', 'Missing Thai description', 'descriptionTh');
  if (!text(prompt.purposeTh)) addError(errors, 'missing-purpose-th', 'Missing Thai purpose', 'purposeTh');
  if (!Array.isArray(prompt.useCasesTh) || prompt.useCasesTh.filter(text).length === 0) addError(errors, 'missing-use-cases-th', 'Missing Thai use cases', 'useCasesTh');
  if (!Array.isArray(prompt.expectedOutputTh) || prompt.expectedOutputTh.filter(text).length === 0) addError(errors, 'missing-expected-output-th', 'Missing Thai expected output guidance', 'expectedOutputTh');
  if (!text(prompt.exampleInputTh)) addError(errors, 'missing-example-input-th', 'Missing Thai example input', 'exampleInputTh');
  if (!text(prompt.prompt)) addError(errors, 'missing-executable-task', 'Missing executable prompt task', 'prompt');

  const config = prompt.variableConfig && typeof prompt.variableConfig === 'object' ? prompt.variableConfig : {};
  const detected = placeholders(prompt.prompt);
  const configured = Object.keys(config);
  const missingConfig = detected.filter((name) => !configured.includes(name));
  const orphanConfig = configured.filter((name) => !detected.includes(name) && config[name]?.type !== 'file');
  if (missingConfig.length || orphanConfig.length) {
    addError(errors, 'placeholder-config-mismatch', `Placeholder/config mismatch: missing config [${missingConfig.join(', ')}], unused config [${orphanConfig.join(', ')}]`, 'variableConfig');
  }

  for (const [name, field = {}] of Object.entries(config)) {
    if (field.required) {
      if (!text(field.labelTh)) addError(errors, 'missing-variable-label-th', `Missing Thai label for ${name}`, `variableConfig.${name}.labelTh`);
      if (!text(field.helpTh)) addError(errors, 'missing-variable-help-th', `Missing Thai help for ${name}`, `variableConfig.${name}.helpTh`);
    }

    if ((field.type === 'select' || field.type === 'language' || field.type === 'tone') && field.defaultValue != null && field.defaultValue !== '') {
      const options = Array.isArray(field.options) ? field.options.map(String) : [];
      if (options.length && !options.includes(String(field.defaultValue))) addError(errors, 'invalid-select-default', `Default for ${name} is not in options`, `variableConfig.${name}.defaultValue`);
    }

    if (field.type === 'number' && field.defaultValue != null && field.defaultValue !== '' && Number.isNaN(Number(field.defaultValue))) {
      addError(errors, 'invalid-number-default', `Default for ${name} is not numeric`, `variableConfig.${name}.defaultValue`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validatePromptCatalog(prompts = []) {
  const managed = (Array.isArray(prompts) ? prompts : []).filter((prompt) => prompt?.catalogManaged === true || String(prompt?.id || '').startsWith('ai-lib-'));
  const results = managed.map((prompt) => ({ id: prompt?.id, name: prompt?.name, ...validateBuiltInPrompt(prompt) }));
  const errors = results.flatMap((result) => result.errors.map((error) => ({ id: result.id, name: result.name, ...error })));
  const warnings = results.flatMap((result) => result.warnings.map((warning) => ({ id: result.id, name: result.name, ...warning })));

  for (const [field, code] of [['id', 'duplicate-id'], ['name', 'duplicate-name'], ['displayTitle', 'duplicate-display-title']]) {
    const seen = new Map();
    for (const prompt of managed) {
      const value = text(prompt?.[field]).toLocaleLowerCase();
      if (!value) continue;
      if (seen.has(value)) errors.push({ id: prompt.id, name: prompt.name, code, message: `Duplicate ${field}: ${prompt[field]}` });
      else seen.set(value, prompt.id);
    }
  }

  return { ok: errors.length === 0, errors, warnings, results };
}

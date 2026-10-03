import { renderPromptTemplate } from '../variables/render-prompt.mjs';
import { validatePromptVariables } from '../variables/validate-variables.mjs';

function placeholders(template = '') {
  return [...String(template).matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)].map((match) => match[1]);
}

function sampleValue(field = {}, text = 'example') {
  if (Object.prototype.hasOwnProperty.call(field, 'default') && field.default !== '' && field.default != null) return field.default;
  if (Object.prototype.hasOwnProperty.call(field, 'defaultValue') && field.defaultValue !== '' && field.defaultValue != null) return field.defaultValue;
  if (field.type === 'number') return 1;
  if (field.type === 'boolean' || field.type === 'toggle') return true;
  if (field.type === 'date') return '2026-01-01';
  if (field.type === 'url') return 'https://example.com';
  if (field.type === 'select') return Array.isArray(field.options) && field.options.length ? field.options[0] : text;
  if (field.type === 'multi-select') return Array.isArray(field.options) && field.options.length ? [field.options[0]] : [];
  return text;
}

function valuesFor(config = {}, text = 'example', { includeOptional = true } = {}) {
  return Object.fromEntries(Object.entries(config).flatMap(([name, field = {}]) => {
    if (!includeOptional && !field.required) return [];
    return [[name, sampleValue(field, text)]];
  }));
}

function check(key, status, message) {
  return { key, status, message };
}

function rendersCleanly(template, config, values) {
  const validation = validatePromptVariables(config, values);
  const rendered = renderPromptTemplate(template, config, values);
  return validation.ok && rendered.unresolvedRequired.length === 0;
}

function hasSection(source, template, key, headingPattern) {
  if (String(source?.sections?.[key] || '').trim()) return true;
  return new RegExp(`(^|\\n)\\s*#*\\s*${headingPattern}\\b`, 'i').test(template);
}

export function runPromptTestSuite({ draft, longInputSize = 4096 } = {}) {
  const source = draft || {};
  const template = String(source.rawPrompt || source.prompt || '');
  const config = source.variableConfig || source.variableSchema || {};
  const declared = new Set(Object.keys(config));
  const used = [...new Set(placeholders(template))];
  const undeclared = used.filter((name) => !declared.has(name));
  const checks = [];

  checks.push(check('goal_present', hasSection(source, template, 'goal', 'goal') ? 'passed' : 'failed', 'Prompt should state a concrete goal.'));
  checks.push(check('context_present', hasSection(source, template, 'context', 'context') ? 'passed' : 'skipped', 'Context is explicit when the task needs it.'));
  checks.push(check('variables_declared', used.length === 0 || declared.size > 0 ? 'passed' : 'failed', used.length ? `${declared.size} configured variables for ${used.length} placeholders.` : 'Prompt has no template variables.'));

  checks.push(check(
    'placeholder_config',
    undeclared.length ? 'failed' : 'passed',
    undeclared.length ? `Undeclared placeholders: ${undeclared.join(', ')}` : 'Every template placeholder has variable configuration.',
  ));

  const validValues = valuesFor(config, 'example');
  const requiredFields = Object.entries(config).filter(([, field = {}]) => field.required).map(([name]) => name);
  const requiredEnforced = requiredFields.every((name) => {
    const values = { ...validValues, [name]: '' };
    return validatePromptVariables(config, values).errors?.[name] === 'Required';
  });
  checks.push(check('required_inputs', requiredEnforced ? 'passed' : 'failed', requiredEnforced ? 'Required fields reject blank input.' : 'At least one required field accepts blank input.'));

  const requiredHelpMissing = Object.entries(config)
    .filter(([, field = {}]) => field.required)
    .filter(([, field = {}]) => !String(field.helpTh || field.help || field.description || '').trim())
    .map(([name]) => name);
  checks.push(check('required_help', requiredHelpMissing.length ? 'failed' : 'passed', requiredHelpMissing.length ? `Required variables missing help text: ${requiredHelpMissing.join(', ')}` : 'Required variables provide help text.'));

  const requiredOnly = valuesFor(config, 'example', { includeOptional: false });
  checks.push(check(
    'optional_empty',
    rendersCleanly(template, config, requiredOnly) ? 'passed' : 'failed',
    'Optional fields may remain empty without blocking rendering.',
  ));

  if (source.exampleValues && Object.keys(source.exampleValues).length) {
    const exampleOk = rendersCleanly(template, config, source.exampleValues) && undeclared.length === 0;
    checks.push(check('example_render', exampleOk ? 'passed' : 'failed', exampleOk ? 'Structured example renders cleanly.' : 'Structured example is incomplete or invalid.'));
  } else {
    checks.push(check('example_render', 'skipped', 'No structured example values declared.'));
  }

  const thaiValues = valuesFor(config, 'ตัวอย่างภาษาไทย');
  checks.push(check('thai_input', rendersCleanly(template, config, thaiValues) ? 'passed' : 'failed', 'Thai input renders through the declared variable contract.'));

  const englishValues = valuesFor(config, 'English example');
  checks.push(check('english_input', rendersCleanly(template, config, englishValues) ? 'passed' : 'failed', 'English input renders through the declared variable contract.'));

  const boundedSize = Math.max(256, Math.min(Number(longInputSize) || 4096, 20000));
  const longValues = valuesFor(config, 'x'.repeat(boundedSize));
  checks.push(check('long_input', rendersCleanly(template, config, longValues) ? 'passed' : 'failed', `Long input renders deterministically at ${boundedSize} characters.`));

  const declaresOutput = hasSection(source, template, 'outputFormat', 'output\\s+format') || /\bOUTPUT FORMAT\b/i.test(template);
  checks.push(check('output_format', declaresOutput ? 'passed' : 'skipped', declaresOutput ? 'Prompt declares an output format section.' : 'No deterministic output-format declaration found.'));

  const passed = checks.filter((item) => item.status === 'passed').length;
  const failed = checks.filter((item) => item.status === 'failed').length;
  const skipped = checks.filter((item) => item.status === 'skipped').length;
  return { checks, passed, failed, skipped };
}

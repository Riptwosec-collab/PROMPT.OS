import test from 'node:test';
import assert from 'node:assert/strict';

import { AI_PROMPT_LIBRARY, extractCatalogVariables } from '../lib/prompts/ai-prompt-library.mjs';
import { renderPromptTemplate } from '../lib/variables/render-prompt.mjs';
import { validatePromptVariables } from '../lib/variables/validate-variables.mjs';
import { searchPrompts } from '../lib/search/prompt-search.mjs';

function validValue(name, field = {}) {
  if (name === 'language') return 'Thai';
  if (field.type === 'number') return '3';
  if (field.type === 'boolean') return true;
  if (field.type === 'multi-select') return Array.isArray(field.options) && field.options.length ? [String(field.options[0])] : [];
  if (field.type === 'select' || field.type === 'language' || field.type === 'tone') {
    return field.defaultValue || field.default || field.options?.[0] || 'Thai';
  }
  if (field.type === 'date') return '2026-09-25';
  if (field.type === 'url') return 'https://example.com/source';
  return `ข้อมูลทดสอบสำหรับ ${name}`;
}

function validValues(prompt) {
  return Object.fromEntries(Object.entries(prompt.variableConfig || {}).map(([name, field]) => [name, validValue(name, field)]));
}

test('all 100 prompts declare every template placeholder and render cleanly with valid values', () => {
  assert.equal(AI_PROMPT_LIBRARY.length, 100);
  for (const prompt of AI_PROMPT_LIBRARY) {
    const detected = extractCatalogVariables(prompt.prompt).sort();
    const configured = Object.keys(prompt.variableConfig || {}).sort();
    assert.deepEqual(configured, detected, `${prompt.name}: placeholder/config drift`);

    const values = validValues(prompt);
    const validation = validatePromptVariables(prompt.variableConfig, values);
    assert.equal(validation.ok, true, `${prompt.name}: ${JSON.stringify(validation.errors)}`);

    const rendered = renderPromptTemplate(prompt.prompt, prompt.variableConfig, values);
    assert.deepEqual(rendered.unresolvedRequired, [], `${prompt.name}: unresolved required placeholders`);
    assert.doesNotMatch(rendered.text, /{{\s*[a-zA-Z0-9_.-]+\s*}}/, `${prompt.name}: unresolved placeholder remains`);
  }
});

test('every prompt rejects at least one empty required input when it has required user data', () => {
  for (const prompt of AI_PROMPT_LIBRARY) {
    const required = Object.entries(prompt.variableConfig || {}).filter(([name, field]) => field.required && name !== 'language');
    if (required.length === 0) continue;
    const values = validValues(prompt);
    const [name] = required[0];
    values[name] = '';
    const validation = validatePromptVariables(prompt.variableConfig, values);
    assert.equal(validation.ok, false, `${prompt.name}: empty required ${name} should fail`);
    assert.ok(validation.errors[name], `${prompt.name}: expected error for ${name}`);
  }
});

test('Thai title and description are searchable without indexing long explainer bodies', () => {
  const network = searchPrompts(AI_PROMPT_LIBRARY, 'วิเคราะห์ปัญหา Port');
  assert.ok(network.some((prompt) => prompt.name === 'CISCO_SWITCH_PORT_TROUBLESHOOTER'));
  const phishing = searchPrompts(AI_PROMPT_LIBRARY, 'อีเมล Phishing');
  assert.ok(phishing.some((prompt) => prompt.name === 'PHISHING_EMAIL_ANALYZER'));
});

test('new finance and security prompts keep explicit safety boundaries', () => {
  const finance = AI_PROMPT_LIBRARY.find((prompt) => prompt.name === 'PUBLIC_COMPANY_RESEARCH_BRIEF');
  assert.match(finance.prompt, /Do not provide personalized buy\/sell instructions/i);
  assert.match(finance.prompt, /Do not fabricate current prices/i);

  const phishing = AI_PROMPT_LIBRARY.find((prompt) => prompt.name === 'PHISHING_EMAIL_ANALYZER');
  assert.match(phishing.prompt, /do not instruct the user to open suspicious links/i);
  const security = AI_PROMPT_LIBRARY.find((prompt) => prompt.name === 'SECURITY_ALERT_TRIAGE');
  assert.match(security.prompt, /defensive security analyst/i);
});

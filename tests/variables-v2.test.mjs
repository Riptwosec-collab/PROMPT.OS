import test from 'node:test';
import assert from 'node:assert/strict';
import { VARIABLE_TYPES, normalizeVariableSchema } from '../lib/variables/schema.mjs';
import { renderVariableValues, validateVariableValues } from '../lib/variables/runtime.mjs';
import { validatePromptVariables } from '../lib/variables/validate-variables.mjs';
import { renderPromptTemplate } from '../lib/variables/render-prompt.mjs';

test('Variables V2 exposes approved types while preserving legacy toggle compatibility', () => {
  for (const type of ['text', 'textarea', 'number', 'select', 'multi-select', 'boolean', 'date', 'url', 'code', 'language', 'file']) {
    assert.ok(VARIABLE_TYPES.includes(type), `missing ${type}`);
  }
  assert.ok(VARIABLE_TYPES.includes('toggle'));
});

test('detected placeholders become text fields while explicit schema wins', () => {
  const schema = normalizeVariableSchema('Write about {{topic}} in {{language}}', {
    language: { type: 'language', options: ['Thai', 'English'], default: 'Thai' },
  });
  assert.equal(schema.topic.type, 'text');
  assert.equal(schema.language.type, 'language');
});

test('legacy renderer still preserves explicit blanks and applies defaults', () => {
  assert.equal(renderVariableValues('Hi {{name}}', { name: '' }, { name: { type: 'text' } }), 'Hi {{name}}');
  assert.equal(renderVariableValues('Language: {{language}}', {}, { language: { type: 'language', default: 'Thai' } }), 'Language: Thai');
});

test('validation distinguishes required and optional fields across approved types', () => {
  const config = {
    topic: { type: 'text', required: true },
    count: { type: 'number' },
    mode: { type: 'select', options: ['A', 'B'] },
    tags: { type: 'multi-select', options: ['X', 'Y'] },
    enabled: { type: 'boolean' },
    date: { type: 'date' },
    source: { type: 'url' },
    code: { type: 'code' },
    language: { type: 'language', default: 'Thai' },
    attachment: { type: 'file', required: false },
  };

  const invalid = validatePromptVariables(config, {
    topic: ' ', count: 'x', mode: 'C', tags: ['X', 'Z'], enabled: 'yes', date: 'not-date', source: 'bad',
  });
  assert.equal(invalid.ok, false);
  for (const field of ['topic', 'count', 'mode', 'tags', 'enabled', 'date', 'source']) assert.ok(invalid.errors[field]);
  assert.equal(invalid.errors.attachment, undefined);

  const valid = validatePromptVariables(config, {
    topic: 'VLAN issue', count: 3, mode: 'A', tags: ['X'], enabled: true, date: '2026-09-17', source: 'https://example.com', code: 'show vlan brief',
  });
  assert.deepEqual(valid, { ok: true, errors: {} });
});

test('renderPromptTemplate applies Thai default, removes optional blanks and reports unresolved required fields', () => {
  const config = {
    topic: { type: 'text', required: true },
    notes: { type: 'textarea', required: false },
    language: { type: 'language', default: 'Thai' },
  };
  const missing = renderPromptTemplate('Topic={{topic}}\nNotes={{notes}}\nLanguage={{language}}', config, {});
  assert.deepEqual(missing.unresolvedRequired, ['topic']);
  assert.equal(missing.text.includes('{{notes}}'), false);
  assert.match(missing.text, /Language=Thai/);

  const rendered = renderPromptTemplate('Topic={{topic}}\nLanguage={{language}}', config, { topic: 'OSPF' });
  assert.deepEqual(rendered.unresolvedRequired, []);
  assert.equal(rendered.text, 'Topic=OSPF\nLanguage=Thai');
});

test('legacy validation contract remains available', () => {
  const result = validateVariableValues({ name: { type: 'text', required: true } }, { name: 'Mek' });
  assert.deepEqual(result, { valid: true, errors: {} });
});

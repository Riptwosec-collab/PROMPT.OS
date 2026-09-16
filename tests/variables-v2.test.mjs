import test from 'node:test';
import assert from 'node:assert/strict';
import { VARIABLE_TYPES, normalizeVariableSchema } from '../lib/variables/schema.mjs';
import { renderVariableValues, validateVariableValues } from '../lib/variables/runtime.mjs';

test('Variables V2 exposes the approved field types', () => {
  assert.deepEqual(VARIABLE_TYPES, ['text', 'textarea', 'number', 'select', 'multi-select', 'toggle', 'date', 'url']);
});

test('detected placeholders become text fields while explicit schema wins', () => {
  const schema = normalizeVariableSchema('Write about {{topic}} in {{language}}', {
    language: { type: 'select', options: ['Thai', 'English'], default: 'Thai' },
  });
  assert.equal(schema.topic.type, 'text');
  assert.equal(schema.language.type, 'select');
  assert.deepEqual(schema.language.options, ['Thai', 'English']);
});

test('blank text preserves placeholder and missing value may use default', () => {
  assert.equal(renderVariableValues('Hi {{name}}', { name: '' }, { name: { type: 'text' } }), 'Hi {{name}}');
  assert.equal(renderVariableValues('Language: {{language}}', {}, { language: { type: 'select', default: 'Thai', options: ['Thai'] } }), 'Language: Thai');
});

test('validation enforces required, number, select, multi-select and URL rules', () => {
  const schema = {
    name: { type: 'text', required: true },
    count: { type: 'number' },
    language: { type: 'select', options: ['Thai', 'English'] },
    tags: { type: 'multi-select', options: ['A', 'B'] },
    source: { type: 'url' },
  };

  const invalid = validateVariableValues(schema, {
    name: ' ', count: 'not-a-number', language: 'French', tags: ['A', 'C'], source: 'not a url',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.count);
  assert.ok(invalid.errors.language);
  assert.ok(invalid.errors.tags);
  assert.ok(invalid.errors.source);

  const valid = validateVariableValues(schema, {
    name: 'Mek', count: '3', language: 'Thai', tags: ['A', 'B'], source: 'https://example.com',
  });
  assert.deepEqual(valid, { valid: true, errors: {} });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../components/PromptOS.jsx', import.meta.url), 'utf8');

test('Prompt.OS migrates the centralized prompt catalog without overwriting existing data', () => {
  assert.match(source, /AI_PROMPT_LIBRARY/);
  assert.match(source, /PROMPT_CATALOG_VERSION/);
  assert.match(source, /mergePromptCatalog/);
  assert.match(source, /catalogVersion/);
});

test('search includes catalog name and display title metadata', () => {
  assert.match(source, /prompt\.name/);
  assert.match(source, /prompt\.displayTitle/);
});

test('delete actions use the two-step destructive confirmation helper', () => {
  assert.match(source, /confirmDestructiveAction\(/);
  assert.match(source, /Confirm again: move/);
  assert.match(source, /FINAL CONFIRMATION: permanently delete/);
});

test('prompt detail exposes catalog metadata, copy, edit, favorite, and smart variable fields', () => {
  assert.match(source, /PROMPT_METADATA/);
  assert.match(source, /compatibleModels/);
  assert.match(source, /COPY PROMPT/);
  assert.match(source, /onEdit/);
  assert.match(source, /getVariableInputKind/);
  assert.match(source, /VariableInput/);
});

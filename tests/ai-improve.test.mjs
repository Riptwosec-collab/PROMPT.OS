import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImproveInput, parseImproveResponse } from '../lib/ai/improve-prompt.mjs';

test('improve input preserves variables and asks for the approved prompt dimensions', () => {
  const input = buildImproveInput({
    prompt: 'Write about {{topic}} for {{audience}}',
    health: { score: 2, max: 6 },
    language: 'th',
  });

  assert.match(input, /preserve[\s\S]*\{\{topic\}\}/i);
  assert.match(input, /\{\{audience\}\}/i);
  assert.match(input, /role/i);
  assert.match(input, /context/i);
  assert.match(input, /constraints/i);
  assert.match(input, /output format/i);
  assert.match(input, /language[\s\S]*th/i);
});

test('parseImproveResponse accepts JSON objects and fenced JSON', () => {
  const parsed = parseImproveResponse(JSON.stringify({
    improvedPrompt: 'Act as an expert. Write about {{topic}}.',
    rationale: ['Adds a role'],
    checks: { role: true, context: false, constraints: false, outputFormat: false },
  }));
  assert.equal(parsed.improvedPrompt.includes('{{topic}}'), true);
  assert.deepEqual(parsed.rationale, ['Adds a role']);

  const fenced = parseImproveResponse('```json\n{"improvedPrompt":"Hello {{name}}","rationale":[],"checks":{}}\n```');
  assert.equal(fenced.improvedPrompt, 'Hello {{name}}');
});

test('parseImproveResponse rejects missing or blank improvedPrompt', () => {
  assert.throws(() => parseImproveResponse('{"rationale":[]}'), /improvedPrompt/i);
  assert.throws(() => parseImproveResponse('{"improvedPrompt":"   "}'), /improvedPrompt/i);
  assert.throws(() => parseImproveResponse('not json'), /valid JSON/i);
});

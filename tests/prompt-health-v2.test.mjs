import test from 'node:test';
import assert from 'node:assert/strict';
import { scorePromptHealth } from '../lib/prompts/health-score.mjs';

const CATEGORY_NAMES = ['structure', 'context', 'variables', 'constraints', 'outputFormat', 'reliability'];

test('prompt health returns deterministic category scores and findings', () => {
  const prompt = {
    prompt: `Role: You are a senior network engineer.\nContext: Diagnose {{problem}} on {{device}}.\nConstraints:\n- Do not invent missing facts.\n- State assumptions explicitly.\nOutput Format:\n1. Findings\n2. Commands\n3. Risks\nIf information is missing, ask for it before concluding.`,
    variables: { problem: '', device: '' },
    variableConfig: {
      problem: { type: 'textarea', required: true },
      device: { type: 'text', required: true },
    },
    exampleOutput: 'Findings: ...',
  };

  const result = scorePromptHealth(prompt);
  assert.equal(typeof result.total, 'number');
  assert.ok(result.total >= 0 && result.total <= 100);
  assert.deepEqual(Object.keys(result.categories), CATEGORY_NAMES);
  for (const name of CATEGORY_NAMES) {
    assert.equal(typeof result.categories[name].score, 'number');
    assert.equal(typeof result.categories[name].max, 'number');
    assert.ok(result.categories[name].score <= result.categories[name].max);
  }
  assert.ok(Array.isArray(result.findings));
});

test('well-structured prompt scores higher than vague prompt without using AI', () => {
  const vague = scorePromptHealth({ prompt: 'Help me with this.' });
  const strong = scorePromptHealth({
    prompt: `Role: Act as an analyst.\nContext: Analyze {{topic}} for a technical audience.\nConstraints:\n- Use only supplied evidence.\n- Mark uncertainty.\nOutput Format:\nReturn Summary, Evidence, Risks, and Next Steps.\nIf evidence is missing, say what is missing.`,
    variables: { topic: '' },
    variableConfig: { topic: { type: 'text', required: true } },
    exampleOutput: 'Summary: ...',
  });
  assert.ok(strong.total > vague.total);
  assert.ok(vague.findings.length > 0);
});

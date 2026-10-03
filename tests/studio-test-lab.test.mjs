import test from 'node:test';
import assert from 'node:assert/strict';
import { runPromptTestSuite } from '../lib/studio/test-lab.mjs';

const draft = {
  draftId: 'draft:test',
  promptId: 'user:test',
  rawPrompt: '# Goal\nAnalyze {{topic}} for {{audience}}.\n\n# Output Format\nReturn a concise markdown table.',
  variableConfig: {
    topic: { type: 'text', required: true },
    audience: { type: 'text', required: false, default: '' },
  },
  exampleValues: { topic: 'เครือข่ายสำนักงาน', audience: 'Network Engineer' },
};

test('Test Lab is deterministic and covers required optional example Thai English long input and output format checks', () => {
  const first = runPromptTestSuite({ draft });
  const second = runPromptTestSuite({ draft });
  assert.deepEqual(first, second);
  assert.equal(Array.isArray(first.checks), true);
  const keys = first.checks.map((check) => check.key);
  for (const key of ['placeholder_config', 'required_inputs', 'optional_empty', 'example_render', 'thai_input', 'english_input', 'long_input', 'output_format']) {
    assert.ok(keys.includes(key), `missing ${key}`);
  }
  assert.equal(first.passed + first.failed + first.skipped, first.checks.length);
  assert.equal('score' in first, false);
  assert.equal('aiEvaluation' in first, false);
});

test('Test Lab fails undeclared placeholders and missing required example values without network or AI', () => {
  const broken = runPromptTestSuite({ draft: {
    ...draft,
    rawPrompt: 'Analyze {{topic}} and {{missing}}.',
    exampleValues: { audience: 'Ops' },
  } });
  assert.equal(broken.checks.find((check) => check.key === 'placeholder_config').status, 'failed');
  assert.equal(broken.checks.find((check) => check.key === 'example_render').status, 'failed');
});

test('long-input test is bounded and does not mutate the source Draft', () => {
  const before = structuredClone(draft);
  const result = runPromptTestSuite({ draft, longInputSize: 4096 });
  assert.deepEqual(draft, before);
  assert.equal(result.checks.find((check) => check.key === 'long_input').status, 'passed');
});

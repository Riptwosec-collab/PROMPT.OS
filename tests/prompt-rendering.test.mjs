import test from 'node:test';
import assert from 'node:assert/strict';

async function loadRenderer() {
  try {
    return await import('../lib/prompts/render.mjs');
  } catch {
    return null;
  }
}

test('rendered prompts preserve empty variables as template placeholders', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'Expected lib/prompts/render.mjs to exist');
  assert.equal(
    renderer.renderPromptVariables('Topic: {{topic}} / Tone: {{tone}}', { topic: '', tone: '   ' }),
    'Topic: {{topic}} / Tone: {{tone}}',
  );
});

test('rendered prompts replace only variables that have real values', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer);
  assert.equal(
    renderer.renderPromptVariables('Topic: {{topic}} / Count: {{count}} / Lang: {{language}}', { topic: 'AI', count: 5 }),
    'Topic: AI / Count: 5 / Lang: {{language}}',
  );
});

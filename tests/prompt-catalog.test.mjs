import test from 'node:test';
import assert from 'node:assert/strict';

const EXPECTED_NAMES = [
  'DEEP_RESEARCH_ASSISTANT', 'FACT_CHECKER', 'ARTICLE_ANALYZER', 'PAPER_ANALYZER', 'SOURCE_COMPARATOR',
  'CODE_REVIEWER', 'BUG_HUNTER', 'UNIT_TEST_GENERATOR', 'CODE_OPTIMIZER', 'TIME_COMPLEXITY_ANALYZER',
  'REGEX_GENERATOR', 'DOCKER_GENERATOR', 'API_DESIGNER', 'DATABASE_SCHEMA_DESIGNER', 'JSON_EXTRACTOR',
  'TABLE_EXTRACTOR', 'SENTIMENT_ANALYZER', 'DATA_CLASSIFIER', 'IMAGE_OBJECT_ANALYZER', 'IMAGE_TO_JSON',
  'VIDEO_QA', 'AUDIO_TRANSCRIBER', 'BLOG_GENERATOR', 'SEO_CONTENT_WRITER', 'SOCIAL_CONTENT_GENERATOR',
  'MEETING_SUMMARIZER', 'ACTION_ITEM_EXTRACTOR', 'PRESENTATION_BUILDER', 'PERSONAL_TUTOR', 'QUIZ_GENERATOR',
];

async function loadCatalog() {
  try {
    return await import('../lib/prompts/ai-prompt-library.mjs');
  } catch {
    return null;
  }
}

test('AI Prompt Library contains exactly the 30 unique prompts from the supplied note', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog, 'Expected lib/prompts/ai-prompt-library.mjs to exist');
  assert.equal(catalog.AI_PROMPT_LIBRARY.length, 30);

  const ids = catalog.AI_PROMPT_LIBRARY.map((prompt) => prompt.id);
  const names = catalog.AI_PROMPT_LIBRARY.map((prompt) => prompt.name);
  const titles = catalog.AI_PROMPT_LIBRARY.map((prompt) => prompt.displayTitle);
  assert.equal(new Set(ids).size, 30, 'Prompt IDs must be unique');
  assert.equal(new Set(names).size, 30, 'Prompt names must be unique');
  assert.equal(new Set(titles).size, 30, 'Display titles must be unique');
  assert.deepEqual(names, EXPECTED_NAMES);
});

test('every catalog prompt includes the required metadata and valid variables', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);

  const required = [
    'id', 'name', 'displayTitle', 'description', 'category', 'subcategory', 'promptType', 'prompt',
    'variables', 'tags', 'collections', 'language', 'outputFormat', 'compatibleModels', 'sourceType',
    'version', 'status', 'createdAt', 'updatedAt',
  ];

  for (const prompt of catalog.AI_PROMPT_LIBRARY) {
    for (const key of required) assert.ok(Object.hasOwn(prompt, key), `${prompt.name} missing ${key}`);
    assert.equal(prompt.version, '1.0.0');
    assert.equal(prompt.status, 'published');
    assert.deepEqual(prompt.compatibleModels, ['GPT', 'Claude', 'Gemini']);
    assert.ok(prompt.collections.includes('AI Prompt Library'));
    assert.ok(prompt.prompt.trim().length > 0, `${prompt.name} has an empty prompt`);

    const detected = catalog.extractCatalogVariables(prompt.prompt).sort();
    const configured = Object.keys(prompt.variables).sort();
    assert.deepEqual(configured, detected, `${prompt.name} variable config must match {{variables}}`);
  }
});

test('catalog exposes every requested category and collection', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);
  const categories = new Set(catalog.AI_PROMPT_LIBRARY.map((prompt) => prompt.category));
  for (const category of ['Research', 'Coding', 'DevOps', 'Database', 'Data', 'Vision', 'Video', 'Audio', 'Writing', 'Marketing', 'Productivity', 'Education']) {
    assert.ok(categories.has(category), `Missing category: ${category}`);
  }

  for (const collection of ['Popular AI Prompts', 'Research Toolkit', 'Developer Toolkit', 'Data & Analysis', 'Multimodal AI', 'Content Creator', 'Productivity', 'Learning']) {
    assert.ok(catalog.AI_PROMPT_COLLECTIONS.includes(collection), `Missing collection: ${collection}`);
  }
});

test('duplicate detection preserves existing prompts instead of overwriting them', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);
  const seeded = catalog.AI_PROMPT_LIBRARY[0];
  const customized = { ...seeded, title: 'MY CUSTOM TITLE', prompt: 'CUSTOMIZED BY USER' };
  const merged = catalog.mergePromptCatalog([customized], catalog.AI_PROMPT_LIBRARY);
  assert.equal(merged.length, 30);
  assert.equal(merged[0].prompt, 'CUSTOMIZED BY USER');
  assert.equal(merged[0].title, 'MY CUSTOM TITLE');
});

test('variable field inference supports note requirements', async () => {
  const catalog = await loadCatalog();
  assert.ok(catalog);
  assert.equal(catalog.getVariableInputKind('count'), 'number');
  assert.equal(catalog.getVariableInputKind('slides'), 'number');
  assert.equal(catalog.getVariableInputKind('content'), 'textarea');
  assert.equal(catalog.getVariableInputKind('code'), 'textarea');
  assert.equal(catalog.getVariableInputKind('language'), 'language');
  assert.equal(catalog.getVariableInputKind('tone'), 'tone');
  assert.equal(catalog.getVariableInputKind('topic'), 'text');
});

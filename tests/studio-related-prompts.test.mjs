import test from 'node:test';
import assert from 'node:assert/strict';
import { findRelatedPrompts } from '../lib/studio/related-prompts.mjs';

const source = { id: 'a', category: 'Network', tags: ['routing', 'incident'], sourcePack: 'ops' };
const catalog = [
  source,
  { id: 'b', category: 'Network', tags: ['routing'], sourcePack: 'ops' },
  { id: 'c', category: 'Network', tags: ['wifi'], sourcePack: 'other' },
  { id: 'd', category: 'Writing', tags: ['routing'], sourcePack: 'other' },
  { id: 'e', category: 'Data', tags: [], sourcePack: 'ops' },
];

test('related prompts use category tags and source only, exclude self, and are deterministic', () => {
  const first = findRelatedPrompts(source, catalog, { limit: 4 });
  const second = findRelatedPrompts(source, catalog, { limit: 4 });
  assert.deepEqual(first, second);
  assert.equal(first.some((prompt) => prompt.id === source.id), false);
  assert.equal(first[0].id, 'b');
  assert.ok(first.every((prompt) => catalog.includes(prompt)));
});

test('related prompts obey limit and never clone catalog records', () => {
  const related = findRelatedPrompts(source, catalog, { limit: 2 });
  assert.equal(related.length, 2);
  for (const prompt of related) assert.equal(prompt, catalog.find((candidate) => candidate.id === prompt.id));
});

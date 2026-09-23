import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('RunResult uses GFM markdown without enabling raw HTML execution', () => {
  const source = read('components/prompt/RunResult.jsx');
  assert.match(source, /react-markdown/);
  assert.match(source, /remark-gfm/);
  assert.match(source, /remarkPlugins=\{\[remarkGfm\]\}/);
  assert.doesNotMatch(source, /rehypeRaw/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
});

test('RunResult rejects unsafe link protocols and hardens external links', () => {
  const source = read('components/prompt/RunResult.jsx');
  assert.match(source, /http:/);
  assert.match(source, /https:/);
  assert.match(source, /mailto:/);
  assert.match(source, /safeHref/);
  assert.match(source, /target=["']_blank["']/);
  assert.match(source, /noreferrer noopener/);
  assert.doesNotMatch(source, /javascript:\s*['"]/i);
});

test('Raw mode renders the canonical output string without rewriting it', () => {
  const source = read('components/prompt/RunResult.jsx');
  assert.match(source, /mode\s*===\s*['"]raw['"]/);
  assert.match(source, /\{output\}/);
  assert.doesNotMatch(source, /output\.replace\s*\(/);
});

test('fenced code routes language-aware blocks through prism-react-renderer', () => {
  const source = read('components/prompt/RunResult.jsx');
  assert.match(source, /prism-react-renderer/);
  assert.match(source, /Highlight/);
  assert.match(source, /language/);
  assert.match(source, /match\(/);
});

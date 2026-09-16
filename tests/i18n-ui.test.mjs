import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);

function read(path) {
  return fs.readFileSync(new URL(path, root), 'utf8');
}

test('the app is wrapped by a language runtime with a TH/EN switcher', () => {
  const runtimeUrl = new URL('components/LanguageRuntime.jsx', root);
  assert.equal(fs.existsSync(runtimeUrl), true, 'Expected components/LanguageRuntime.jsx to exist');

  const page = read('app/page.jsx');
  const runtime = read('components/LanguageRuntime.jsx');

  assert.match(page, /LanguageRuntime/);
  assert.match(page, /<LanguageRuntime>/);
  assert.match(runtime, /TH/);
  assert.match(runtime, /EN/);
  assert.match(runtime, /LANGUAGE_STORAGE_KEY/);
});

test('language selection is persisted and Thai is applied to the document', () => {
  const runtimeUrl = new URL('components/LanguageRuntime.jsx', root);
  assert.equal(fs.existsSync(runtimeUrl), true, 'Expected components/LanguageRuntime.jsx to exist');
  const runtime = read('components/LanguageRuntime.jsx');

  assert.match(runtime, /localStorage\.getItem\(LANGUAGE_STORAGE_KEY\)/);
  assert.match(runtime, /localStorage\.setItem\(LANGUAGE_STORAGE_KEY/);
  assert.match(runtime, /document\.documentElement\.lang/);
  assert.match(runtime, /MutationObserver/);
});

test('runtime translates placeholders, titles, confirmations, and alerts in addition to text nodes', () => {
  const runtimeUrl = new URL('components/LanguageRuntime.jsx', root);
  assert.equal(fs.existsSync(runtimeUrl), true, 'Expected components/LanguageRuntime.jsx to exist');
  const runtime = read('components/LanguageRuntime.jsx');

  assert.match(runtime, /placeholder/);
  assert.match(runtime, /title/);
  assert.match(runtime, /window\.confirm/);
  assert.match(runtime, /window\.alert/);
});

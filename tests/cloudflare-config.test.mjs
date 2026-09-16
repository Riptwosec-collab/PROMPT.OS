import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Cloudflare adapter dependencies are pinned', () => {
  assert.equal(pkg.dependencies['@opennextjs/cloudflare'], '1.20.6');
  assert.equal(pkg.devDependencies.wrangler, '4.131.2');
});

test('Cloudflare Workers build produces OpenNext artifacts before deploy', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.build, 'opennextjs-cloudflare build');
  assert.equal(pkg.scripts['build:next'], 'next build');
  assert.equal(config.main, '.open-next/worker.js');
  assert.equal(config.assets.directory, '.open-next/assets');
  assert.ok(config.compatibility_flags.includes('nodejs_compat'));
  assert.equal(config.build, undefined);
});

test('OpenNext uses the dedicated Next.js build command instead of recursing into itself', () => {
  const text = fs.readFileSync(new URL('../open-next.config.ts', import.meta.url), 'utf8');
  assert.match(text, /defineCloudflareConfig/);
  assert.match(text, /buildCommand:\s*['\"]npm run build:next['\"]/);
});

test('Next.js emits standalone output for OpenNext', () => {
  const text = fs.readFileSync(new URL('../next.config.mjs', import.meta.url), 'utf8');
  assert.match(text, /output:\s*['\"]standalone['\"]/);
});

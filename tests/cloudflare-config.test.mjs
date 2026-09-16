import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Cloudflare adapter dependencies are pinned', () => {
  assert.equal(pkg.dependencies['@opennextjs/cloudflare'], '1.20.6');
  assert.equal(pkg.devDependencies.wrangler, '4.131.2');
});

test('Wrangler deploy converts the existing Next build to OpenNext output', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.main, '.open-next/worker.js');
  assert.equal(config.assets.directory, '.open-next/assets');
  assert.ok(config.compatibility_flags.includes('nodejs_compat'));
  assert.equal(config.build.command, 'npx opennextjs-cloudflare build --skipNextBuild');
});

test('OpenNext Cloudflare config exists', () => {
  const text = fs.readFileSync(new URL('../open-next.config.ts', import.meta.url), 'utf8');
  assert.match(text, /defineCloudflareConfig/);
});

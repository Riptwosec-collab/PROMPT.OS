import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const config = JSON.parse(fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));

test('Cloudflare dashboard build command creates OpenNext artifacts', () => {
  assert.equal(pkg.scripts.build, 'opennextjs-cloudflare build');
});

test('Wrangler config does not rely on custom build commands in Workers Builds', () => {
  assert.equal(config.build, undefined);
});

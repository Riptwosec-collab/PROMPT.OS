import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('mission control exposes approved command-center sections and conditional telemetry', () => {
  const source = read('components/home/MissionControl.jsx');
  for (const label of [
    'Search prompts, commands, workflows',
    'Continue Working',
    'Featured Prompt Packs',
    'Prompt Health',
    'Activity',
    'Smart Collections',
  ]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /usageEnabled/);
  assert.match(source, /cloudStatus/);
  assert.match(source, /usage\.runs|usage\.copies/);
  assert.equal(/tokens|estimated\s*cost|latency|success\s*rate/i.test(source), false);
});

test('home and library share one-shot navigation requests without duplicating library ownership', () => {
  const page = read('app/page.jsx');
  const library = read('components/prompt/PromptLibraryV5.jsx');
  assert.match(page, /libraryRequest/);
  assert.match(page, /type:\s*['"]prompt['"]/);
  assert.match(page, /type:\s*['"]view['"]/);
  assert.match(page, /onExternalRequestHandled/);
  assert.match(library, /externalRequest\s*=\s*null/);
  assert.match(library, /onExternalRequestHandled/);
  assert.match(library, /hydrated/);
});

test('mission control remains independently gated and legacy library remains the default path', () => {
  const page = read('app/page.jsx');
  assert.match(page, /V5_MISSION_CONTROL/);
  assert.match(page, /activePage\s*===\s*['"]home['"]/);
  assert.match(page, /MissionControl/);
  assert.match(page, /V5_USAGE_ANALYTICS/);
  assert.match(page, /V5_PROMPT_HEALTH/);
  assert.match(page, /V5_SMART_COLLECTIONS/);
  assert.match(page, /cloudStatus=\{null\}/);
  assert.match(page, /['"]library['"]/);
});

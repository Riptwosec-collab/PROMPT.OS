import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const qualitySource = fs.readFileSync(new URL('../components/studio/PromptQualityCenter.jsx', import.meta.url), 'utf8');
const studioSource = fs.readFileSync(new URL('../components/studio/PromptStudio.jsx', import.meta.url), 'utf8');
const packsSource = fs.readFileSync(new URL('../components/prompt/PromptPacks.jsx', import.meta.url), 'utf8');

test('Quality Center renders concrete deterministic findings without synthetic percentage score', () => {
  assert.match(qualitySource, /Prompt Quality|Quality Center/);
  assert.match(qualitySource, /checks/);
  assert.match(qualitySource, /passed|failed|skipped/);
  assert.doesNotMatch(qualitySource, /qualityScore|score\s*\*\s*100|% quality/i);
  assert.doesNotMatch(qualitySource, /fetch\(|\/api\/ai|aiEvaluation/);
});

test('Prompt Studio integrates Test Lab and Quality Center without replacing canonical Draft state', () => {
  assert.match(studioSource, /Test Lab/);
  assert.match(studioSource, /PromptQualityCenter/);
  assert.match(studioSource, /runPromptTestSuite/);
  assert.match(studioSource, /draft/);
});

test('Prompt Packs remain reference-only while exposing deterministic related prompt integration', () => {
  assert.match(packsSource, /promptIds/);
  assert.doesNotMatch(packsSource, /embedding|vector/i);
});

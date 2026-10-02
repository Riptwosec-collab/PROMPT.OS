import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDraft, updateDraftSection, updateDraftRaw } from '../lib/studio/draft-model.mjs';
import { readFeatureFlags } from '../lib/ui/feature-flags.mjs';

const studioSource = fs.readFileSync(new URL('../components/studio/PromptStudio.jsx', import.meta.url), 'utf8');
const runtimeSource = fs.readFileSync(new URL('../lib/studio/runtime.mjs', import.meta.url), 'utf8');
const pageSource = fs.readFileSync(new URL('../app/page.jsx', import.meta.url), 'utf8');

test('Prompt Studio flag is default-off and strict-true only', () => {
  assert.equal(readFeatureFlags({}).V5_PROMPT_STUDIO, false);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_PROMPT_STUDIO: 'true' }).V5_PROMPT_STUDIO, true);
  assert.equal(readFeatureFlags({ NEXT_PUBLIC_V5_PROMPT_STUDIO: '1' }).V5_PROMPT_STUDIO, false);
});

test('Structured and Raw edits return one canonical detached Draft object', () => {
  const original = createDraft({ draftId: 'd1', promptId: 'p1', title: 'Demo', sections: { goal: 'Old goal' }, rawPrompt: 'Old raw' });
  const structured = updateDraftSection(original, 'goal', 'New goal');
  assert.notEqual(structured, original);
  assert.equal(structured.sections.goal, 'New goal');
  assert.match(structured.rawPrompt, /New goal/);
  assert.equal(original.sections.goal, 'Old goal');

  const raw = updateDraftRaw(structured, 'Act as a network engineer.');
  assert.notEqual(raw, structured);
  assert.equal(raw.rawPrompt, 'Act as a network engineer.');
  assert.equal(raw.sections.goal, 'New goal');
});

test('Prompt Studio uses one draft state for Structured Raw Preview and Versions modes with debounced repository autosave', () => {
  assert.match(studioSource, /const \[draft, setDraft\] = useState\(\(\) => createDraft/);
  assert.match(studioSource, /Structured/);
  assert.match(studioSource, /Raw/);
  assert.match(studioSource, /Preview/);
  assert.match(studioSource, /Versions/);
  assert.match(studioSource, /activeDraftRepository\.upsert/);
  assert.match(studioSource, /setTimeout/);
  assert.match(studioSource, /Recovered Draft/);
  assert.doesNotMatch(studioSource, /activeVersionRepository\.create\([^)]*autosave/s);
  assert.match(studioSource, /min-h-11/);
});

test('Prompt Studio opens repositories only through the non-React runtime facade', () => {
  assert.match(studioSource, /openStudioRuntime/);
  assert.doesNotMatch(studioSource, /openRuntimeDb|indexedDB/);
  assert.match(runtimeSource, /openRuntimeDb/);
  assert.match(runtimeSource, /createDraftRepository/);
  assert.match(runtimeSource, /createVersionRepository/);
  assert.match(pageSource, /V5_PROMPT_STUDIO/);
  assert.match(pageSource, /activePage === 'studio'/);
});

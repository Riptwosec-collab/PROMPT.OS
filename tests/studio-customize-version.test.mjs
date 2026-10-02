import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AI_PROMPT_LIBRARY } from '../lib/prompts/ai-prompt-library.mjs';
import { createDerivedDraft } from '../lib/studio/customize.mjs';
import { createVersionSnapshot } from '../lib/studio/version-model.mjs';
import { restoreVersionToDraft } from '../lib/studio/draft-model.mjs';
import { createVersionRepository } from '../lib/studio/version-repository.mjs';
import { openRuntimeDb, RUNTIME_DB_NAME } from '../lib/run/indexeddb.mjs';

const studioSource = fs.readFileSync(new URL('../components/studio/PromptStudio.jsx', import.meta.url), 'utf8');
const detailSource = fs.readFileSync(new URL('../components/prompt/PromptDetailV2.jsx', import.meta.url), 'utf8');
const librarySource = fs.readFileSync(new URL('../components/prompt/PromptLibraryV5.jsx', import.meta.url), 'utf8');
const pageSource = fs.readFileSync(new URL('../app/page.jsx', import.meta.url), 'utf8');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function deleteDb() { return new Promise((resolve, reject) => { const request = indexedDB.deleteDatabase(RUNTIME_DB_NAME); request.onsuccess = resolve; request.onerror = () => reject(request.error); }); }

test('customizing a built-in creates a detached user-owned Draft and never mutates catalog source', () => {
  const builtIn = AI_PROMPT_LIBRARY[0];
  const before = clone(builtIn);
  const draft = createDerivedDraft(builtIn, { idFactory: () => 'user-prompt-1', draftIdFactory: () => 'draft-user-1' });
  assert.equal(draft.promptId, 'user-prompt-1');
  assert.equal(draft.draftId, 'draft-user-1');
  assert.equal(String(draft.derivedFromPromptId), String(builtIn.id));
  assert.notEqual(draft.sourceBuiltInSnapshot, builtIn);
  draft.title = 'Changed';
  draft.sourceBuiltInSnapshot.displayTitle = 'Changed snapshot';
  assert.deepEqual(builtIn, before);
  assert.equal(AI_PROMPT_LIBRARY.length, 100);
});

test('explicit Save Version keeps snapshots immutable and restore only creates working Draft', async () => {
  await deleteDb().catch(() => {});
  let db;
  try {
    db = await openRuntimeDb();
    const repo = createVersionRepository({ db });
    const builtIn = AI_PROMPT_LIBRARY[0];
    const draft = createDerivedDraft(builtIn, { idFactory: () => 'user-prompt-2', draftIdFactory: () => 'draft-user-2' });
    draft.rawPrompt = 'First committed text';
    const one = createVersionSnapshot({ draft, versionId: 'version-1', versionNumber: await repo.nextVersionNumber(draft.promptId), status: 'Stable', label: 'Baseline' });
    await repo.create(one);
    const restored = restoreVersionToDraft(await repo.get('version-1'), { draftId: 'restored-working' });
    restored.rawPrompt = 'Edited after restore';
    assert.equal((await repo.get('version-1')).promptSnapshot, 'First committed text');
    assert.equal(await repo.nextVersionNumber(draft.promptId), 2);
    const two = createVersionSnapshot({ draft: restored, versionId: 'version-2', versionNumber: await repo.nextVersionNumber(draft.promptId), status: 'Experimental' });
    await repo.create(two);
    await repo.archive('version-1');
    assert.equal((await repo.get('version-1')).status, 'Archived');
    assert.equal(await repo.nextVersionNumber(draft.promptId), 3);
  } finally { db?.close(); await deleteDb().catch(() => {}); }
});

test('Customize routes built-in to Studio while version creation remains explicit', () => {
  assert.match(detailSource, /Customize/);
  assert.match(detailSource, /onCustomize/);
  assert.match(librarySource, /studioEnabled/);
  assert.match(librarySource, /onCustomizePrompt/);
  assert.match(pageSource, /createDerivedDraft/);
  assert.match(pageSource, /setStudioInitialDraft/);
  assert.match(pageSource, /activePage.*studio|setActivePage\('studio'\)/s);
  assert.match(studioSource, /Save Version/);
  assert.match(studioSource, /nextVersionNumber/);
  assert.match(studioSource, /createVersionSnapshot/);
  assert.match(studioSource, /Restore/);
  assert.match(studioSource, /restoreVersionToDraft/);
  assert.match(studioSource, /Stable/);
  assert.match(studioSource, /Experimental/);
  assert.match(studioSource, /Archived/);
});

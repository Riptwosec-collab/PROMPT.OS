import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { translate } from '../lib/i18n/runtime.mjs';
import { translateCatalogThai } from '../lib/i18n/catalog-th.mjs';

const REQUIRED_UI_TEXT = [
  'Favorite', 'Pin', 'COPIED_SUCCESS', 'EXECUTE_COPY', 'IMG', 'TXT',
  'SYSTEM_OVERVIEW', 'Prompt Operations Dashboard', 'TOP_PROMPTS', 'RECENTLY_UPDATED',
  'CATEGORY_DISTRIBUTION', 'RESULT_STATUS', 'RECOVERY_ZONE', 'TRASH_IS_EMPTY',
  'PROMPT_SOURCE', 'COPY_RENDERED', 'COPIED_RENDERED', 'RENDERED_PREVIEW',
  'ROLE', 'CONTEXT', 'TASK', 'REQUIREMENTS', 'CONSTRAINTS', 'OUTPUT FORMAT',
  'COMPILE_TO_PROMPT + NEW_VERSION', 'VERSION_HISTORY', 'VERSION_DIFF', 'RESTORE',
  'BASE', 'COMPARE', 'No note', 'VERSION_PERFORMANCE', 'NO_RUNS',
  'RUN_HISTORY', 'HISTORY', 'META', 'COPY', 'RETRY', 'MARK_BEST',
  'AWAITING_EXECUTION', 'EXECUTE_RUN', 'COMPARE:', 'OFF', 'RUN_METADATA',
  'STATUS', 'RATING', 'PROVIDER', 'MODEL', 'PROMPT_VER', 'LATENCY', 'TOKENS', 'COST', 'TIMESTAMP', 'NOTES_LOG',
  'EDIT_PROTOCOL_ENTRY', 'NEW_PROTOCOL_ENTRY', 'TITLE', 'CATEGORY', 'DESCRIPTION',
  'DATA_PAYLOAD (PROMPT)', 'TAGS (COMMA SEPARATED)', 'COLLECTIONS (COMMA SEPARATED)',
  'PREVIEW TYPE', 'TEXT / CODE', 'IMAGE RENDER', 'EXAMPLE_CODE_OUTPUT', 'IMAGE_URL_SOURCE',
  'UPDATE_PROTOCOL + VERSION', 'SAVE_PROTOCOL', 'NO_DATA',
  'EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS IMPROVEMENT', 'FAILED', 'READY',
  'General', 'Coding', 'Image', 'Work', 'Image Generation',
  'Initial imported version', 'Edited from prompt modal', 'Initial version', 'Compiled from Prompt Builder',
  'Manual', 'Manual Result',
];

const V5_CORE_UI_TEXT = [
  'Prompt Library', 'Search prompts', 'Prompt Variables', 'Rendered Prompt', 'Prompt Health',
  'Smart Collections', 'Prompt Packs', 'Workspace', 'Recently Used', 'Most Used',
  'Continue Working', 'Add all to Workspace', 'No matching prompts',
];

const V5_PHASE2_UI_TEXT = [
  'Mission Control', 'Neo Mission Control', 'AI Usage Pulse', 'Runs', 'Copies',
  'Featured Prompt Packs', 'Activity', 'Search anything',
  'Search prompts, commands, workflows', 'Create', 'More', 'New Prompt',
  'New Workflow', 'Import Prompt', 'Close', 'Dismiss', 'No matching commands',
  'Choose an action', 'Unavailable', 'Open full Library', 'Command Palette',
  'Esc to close', 'Notifications',
];

const V5_PHASE3_UI_TEXT = [
  'Health', 'Variables', 'Run', 'Favorite', 'Unfavorite', 'Pin', 'Unpin',
  'Add to pack', 'Quick actions', 'Close', 'Open details', 'No matching prompts',
];

const V5_PHASE4_UI_TEXT = [
  'Preparing', 'Running', 'Streaming', 'Completed', 'Failed', 'Stopped', 'Ready',
  'Stop', 'Retry', 'Run Again', 'Edit Prompt', 'Copied', 'Jump to latest',
  'Save Result', 'Provider', 'Model', 'Latency', 'Input tokens', 'Output tokens',
  'Total tokens', 'Response ID', 'Run status', 'Waiting for the first response chunk…',
  'Run the prompt to see streamed output here.', 'Active run controls',
];

test('all known user-facing Prompt.OS labels have a Thai rendering', () => {
  const missing = REQUIRED_UI_TEXT.filter((text) => translate('th', text) === text);
  assert.deepEqual(missing, [], `Missing Thai translations: ${missing.join(', ')}`);
});

test('V5 core experience source labels resolve through the catalog-aware Thai layer', () => {
  const missing = V5_CORE_UI_TEXT.filter((text) => translateCatalogThai('th', text) === text);
  assert.deepEqual(missing, [], `Missing V5 core translations: ${missing.join(', ')}`);

  const files = [
    'components/prompt/PromptLibraryV5.jsx',
    'components/prompt/PromptDetailV2.jsx',
    'components/prompt/PromptVariableForm.jsx',
    'components/prompt/PromptHealth.jsx',
    'components/prompt/PromptPacks.jsx',
    'components/workspace/WorkspaceSidebar.jsx',
  ].map((path) => fs.readFileSync(path, 'utf8')).join('\n');
  for (const label of ['Prompt Library', 'Prompt Variables', 'Rendered Prompt', 'Prompt Health', 'PROMPT PACKS', 'WORKSPACE']) {
    assert.match(files, new RegExp(label));
  }
});

test('Phase 2 Mission Control, command and create surfaces have Thai rendering', () => {
  const missing = V5_PHASE2_UI_TEXT.filter((text) => translateCatalogThai('th', text) === text);
  assert.deepEqual(missing, [], `Missing V5 Phase 2 translations: ${missing.join(', ')}`);

  const files = [
    'components/home/MissionControl.jsx',
    'components/command/CommandPaletteV5.jsx',
    'components/shell/TopBar.jsx',
    'components/shell/MobileDock.jsx',
    'components/shell/CreateActionSheet.jsx',
    'components/ui/ToastViewport.jsx',
  ].map((path) => fs.readFileSync(path, 'utf8')).join('\n');
  for (const label of ['Neo Mission Control', 'AI Usage Pulse', 'Featured Prompt Packs', 'No matching commands', 'New Workflow', 'Dismiss']) {
    assert.match(files, new RegExp(label));
  }
});

test('Phase 3 premium prompt actions and metadata have Thai rendering', () => {
  const missing = V5_PHASE3_UI_TEXT.filter((text) => translateCatalogThai('th', text) === text);
  assert.deepEqual(missing, [], `Missing V5 Phase 3 translations: ${missing.join(', ')}`);

  const files = [
    'components/prompt/PromptCardV5.jsx',
    'components/prompt/PromptQuickActionsSheet.jsx',
    'components/prompt/PromptLibraryV5.jsx',
  ].map((path) => fs.readFileSync(path, 'utf8')).join('\n');
  for (const label of ['Health', 'Run', 'Favorite', 'Pin', 'Add to pack', 'Quick actions', 'Close', 'Open details']) {
    assert.match(files, new RegExp(label, 'i'));
  }
});

test('Phase 4 immersive run states, actions and telemetry have Thai rendering', () => {
  const missing = V5_PHASE4_UI_TEXT.filter((text) => translateCatalogThai('th', text) === text);
  assert.deepEqual(missing, [], `Missing V5 Phase 4 translations: ${missing.join(', ')}`);

  const files = [
    'components/prompt/ExecutionPulse.jsx',
    'components/prompt/RunTelemetry.jsx',
    'components/prompt/ImmersiveRunPanel.jsx',
  ].map((path) => fs.readFileSync(path, 'utf8')).join('\n');
  for (const label of ['Preparing', 'Streaming', 'Completed', 'Stopped', 'Jump to latest', 'Input tokens', 'Response ID']) {
    assert.match(files, new RegExp(label, 'i'));
  }
});

test('dynamic destructive actions and counters render in Thai', () => {
  assert.equal(translate('th', 'Move DEMO_PROMPT to Trash?'), 'ย้าย DEMO_PROMPT ไปถังขยะหรือไม่?');
  assert.equal(translate('th', 'Delete DEMO_PROMPT forever? This cannot be undone.'), 'ลบ DEMO_PROMPT ถาวรหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้');
  assert.equal(translate('th', 'RES 7'), 'ผลลัพธ์ 7');
  assert.equal(translate('th', '3 runs · 2 excellent'), '3 รัน · ยอดเยี่ยม 2 ครั้ง');
});

test('the HTML document defaults to Thai before client hydration', () => {
  const layout = fs.readFileSync(new URL('../app/layout.jsx', import.meta.url), 'utf8');
  assert.match(layout, /<html lang="th">/);
  assert.match(layout, /พื้นที่พัฒนาพรอมต์/);
});

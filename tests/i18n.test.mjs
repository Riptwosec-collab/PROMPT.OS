import test from 'node:test';
import assert from 'node:assert/strict';

async function loadI18n() {
  try {
    return await import('../lib/i18n/runtime.mjs');
  } catch {
    return null;
  }
}

test('Thai is the default language and only TH/EN are accepted', async () => {
  const i18n = await loadI18n();
  assert.ok(i18n, 'Expected lib/i18n/runtime.mjs to exist');
  assert.equal(i18n.DEFAULT_LANGUAGE, 'th');
  assert.equal(i18n.normalizeLanguage(undefined), 'th');
  assert.equal(i18n.normalizeLanguage('th'), 'th');
  assert.equal(i18n.normalizeLanguage('en'), 'en');
  assert.equal(i18n.normalizeLanguage('jp'), 'th');
});

test('core navigation is fully available in Thai and English', async () => {
  const i18n = await loadI18n();
  assert.ok(i18n, 'Expected lib/i18n/runtime.mjs to exist');
  assert.equal(i18n.translate('th', 'Prompt Library'), 'คลังพรอมต์');
  assert.equal(i18n.translate('en', 'Prompt Library'), 'Prompt Library');
  assert.equal(i18n.translate('th', 'Dashboard'), 'แดชบอร์ด');
  assert.equal(i18n.translate('th', 'New Prompt'), 'พรอมต์ใหม่');
  assert.equal(i18n.translate('th', 'Search prompts...'), 'ค้นหาพรอมต์...');
});

test('cloud sync, confirmations, and statuses have Thai translations', async () => {
  const i18n = await loadI18n();
  assert.ok(i18n, 'Expected lib/i18n/runtime.mjs to exist');
  assert.equal(i18n.translate('th', 'Cloud Sync'), 'ซิงก์คลาวด์');
  assert.equal(i18n.translate('th', 'Send Magic Link'), 'ส่งลิงก์เข้าสู่ระบบ');
  assert.equal(i18n.translate('th', 'Push to Cloud'), 'อัปโหลดขึ้นคลาวด์');
  assert.equal(i18n.translate('th', 'Pull from Cloud'), 'ดึงข้อมูลจากคลาวด์');
  assert.equal(i18n.translate('th', 'Sign Out'), 'ออกจากระบบ');
  assert.equal(i18n.translate('th', 'Replace the local database with the cloud copy?'), 'แทนที่ฐานข้อมูลในเครื่องด้วยข้อมูลจากคลาวด์หรือไม่?');
});

test('translation supports dynamic values and safe fallback', async () => {
  const i18n = await loadI18n();
  assert.ok(i18n, 'Expected lib/i18n/runtime.mjs to exist');
  assert.equal(i18n.translate('th', 'Run #{{number}}', { number: 12 }), 'รัน #12');
  assert.equal(i18n.translate('en', 'Run #{{number}}', { number: 12 }), 'Run #12');
  assert.equal(i18n.translate('th', 'UNKNOWN_TEXT'), 'UNKNOWN_TEXT');
});

test('language preference storage key is stable', async () => {
  const i18n = await loadI18n();
  assert.ok(i18n, 'Expected lib/i18n/runtime.mjs to exist');
  assert.equal(i18n.LANGUAGE_STORAGE_KEY, 'prompt-os-language');
});

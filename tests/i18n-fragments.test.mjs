import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../lib/i18n/runtime.mjs';

test('React-split counter and status fragments still translate to Thai', () => {
  assert.equal(translate('th', 'RUN'), 'รัน');
  assert.equal(translate('th', 'RES'), 'ผลลัพธ์');
  assert.equal(translate('th', 'Run #'), 'รัน #');
  assert.equal(translate('th', 'Deleted'), 'ลบเมื่อ');
  assert.equal(translate('th', 'chars'), 'ตัวอักษร');
  assert.equal(translate('th', 'runs ·'), 'รัน ·');
  assert.equal(translate('th', 'excellent'), 'ยอดเยี่ยม');
});

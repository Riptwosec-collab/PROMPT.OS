import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../components/control/ControlCenter.jsx', import.meta.url), 'utf8');

test('Control Center presents repository-derived metrics and explicit unavailable states', () => {
  for (const token of ['Runs Today', '7 days', '30 days', 'Saved Results', 'Pending Sync', 'Failure Center', 'Recent Activity', 'Unavailable']) {
    assert.ok(source.includes(token), `missing ${token}`);
  }
  assert.match(source, /metrics/);
  assert.match(source, /activity/);
  assert.match(source, /failures/);
});

test('Control Center does not manufacture KPI values or fake cloud state', () => {
  assert.doesNotMatch(source, /Math\.random|fake|mock metric|placeholder kpi/i);
  assert.doesNotMatch(source, /cloud.*online.*true/i);
  assert.doesNotMatch(source, /quality.*%/i);
});

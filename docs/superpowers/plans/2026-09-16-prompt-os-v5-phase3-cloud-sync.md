# Prompt.OS V5 Phase 3 Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual whole-document cloud sync with a Cloud-first, revision-checked, recoverable Supabase model that preserves V4 data.

**Architecture:** Introduce a normalized V5 schema and a pure sync state machine before changing UI behavior. Keep `prompt_os_state` intact as the V4 fallback. Browser sync uses authenticated RLS-protected tables, immediate local cache writes, debounced cloud writes, offline queueing, snapshots, and Realtime as invalidation—not as the authority mechanism.

**Tech Stack:** Supabase Postgres/Auth/Realtime, `@supabase/supabase-js` 2.116.0, React 19.3, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-prompt-os-v5-design.md`

## Global Constraints

- Read current Supabase docs/changelog before DDL or Realtime implementation.
- Never expose service-role/secret keys to browser code.
- Enable RLS on every new exposed table.
- User-owned UPDATE policies require `USING` and `WITH CHECK` ownership checks.
- Keep `public.prompt_os_state` during V5.0.
- Snapshot before cloud overwrite, migration, restore, bulk destructive actions.
- Normal delete remains soft delete.

---

### Task 1: Pure revision and queue engine

**Files:**
- Create: `lib/sync/revision.mjs`
- Create: `lib/sync/offline-queue.mjs`
- Create: `lib/sync/snapshots.mjs`
- Test: `tests/v5-sync-engine.test.mjs`

**Interfaces:**
- `decideSync({ localBaseRevision, cloudRevision, hasPendingLocal })` -> `'push' | 'pull' | 'recover_then_pull' | 'noop'`
- `enqueueMutation(queue, mutation)` -> queue
- `markMutationApplied(queue, id)` -> queue
- `trimSnapshots(snapshots, max = 20)` -> snapshots.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { decideSync } from '../lib/sync/revision.mjs';

test('stale pending local state must recover before cloud pull', () => {
  assert.equal(decideSync({ localBaseRevision: 4, cloudRevision: 5, hasPendingLocal: true }), 'recover_then_pull');
});

test('matching revision with pending data can push', () => {
  assert.equal(decideSync({ localBaseRevision: 5, cloudRevision: 5, hasPendingLocal: true }), 'push');
});
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/v5-sync-engine.test.mjs
```

- [ ] **Step 3: Implement deterministic state helpers**

Mutation record shape:

```js
{ id, operation, entityType, entityId, baseRevision, payload, createdAt }
```

Never discard stale mutations; return them to recovery storage.

- [ ] **Step 4: Verify focused tests**

```bash
node --test tests/v5-sync-engine.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add lib/sync tests/v5-sync-engine.test.mjs
git commit -m "feat: add revision-based sync engine"
```

### Task 2: V5 Supabase schema and RLS contract

**Files:**
- Create: `supabase/v5-schema.sql`
- Modify: `supabase/schema.sql`
- Test: `tests/supabase-v5-schema.test.mjs`

**Interfaces:**
- Tables: `prompt_os_user_settings`, `prompt_os_workspaces`, `prompt_os_folders`, `prompt_os_prompts`, `prompt_os_prompt_versions`, `prompt_os_evaluation_suites`, `prompt_os_evaluation_cases`, `prompt_os_evaluation_runs`, `prompt_os_evaluation_results`, `prompt_os_usage_events`, `prompt_os_snapshots`, `prompt_os_sync_meta`.

- [ ] **Step 1: Write a failing SQL contract test**

```js
const sql = fs.readFileSync('supabase/v5-schema.sql', 'utf8');
for (const table of ['prompt_os_workspaces','prompt_os_prompts','prompt_os_prompt_versions','prompt_os_sync_meta','prompt_os_snapshots']) {
  assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
}
assert.match(sql, /enable row level security/gi);
assert.match(sql, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/supabase-v5-schema.test.mjs
```

- [ ] **Step 3: Write idempotent schema SQL**

Every user-owned table includes `user_id uuid not null references auth.users(id) on delete cascade`. Add explicit authenticated grants for only required operations. Add indexes for user ownership, workspace/folder ordering, prompt updated time, usage created time, and snapshot created time. `prompt_os_sync_meta` has one row per user with integer `revision`, `schema_version`, `migration_version`, `last_synced_at`.

Add `prompt_os_prompts.deleted_at` and `archived_at`; do not use hard delete for normal trash flow.

- [ ] **Step 4: Verify SQL contract**

```bash
node --test tests/supabase-v5-schema.test.mjs
```

- [ ] **Step 5: Commit schema files but do not apply to production yet**

```bash
git add supabase/v5-schema.sql supabase/schema.sql tests/supabase-v5-schema.test.mjs
git commit -m "feat: define V5 cloud data model"
```

### Task 3: V4-to-V5 migration mapper

**Files:**
- Create: `lib/sync/migrate-v4.mjs`
- Test: `tests/v4-v5-migration.test.mjs`

**Interfaces:**
- `mapV4PayloadToV5(payload, userId)` -> `{ workspaceRows, folderRows, promptRows, versionRows, snapshot }`
- `verifyV5Migration(sourcePayload, mapped)` -> `{ valid, errors }`.

- [ ] **Step 1: Write failing migration tests**

```js
const source = { prompts: [{ id: 'p1', title: 'A', prompt: 'Hello', versions: [{ version: '1.0', prompt: 'Hello' }], favorite: true }] };
const mapped = mapV4PayloadToV5(source, '00000000-0000-0000-0000-000000000001');
assert.equal(mapped.promptRows.length, 1);
assert.equal(mapped.versionRows.length, 1);
assert.equal(mapped.promptRows[0].favorite, true);
assert.equal(verifyV5Migration(source, mapped).valid, true);
```

- [ ] **Step 2: Verify failure**

```bash
node --test tests/v4-v5-migration.test.mjs
```

- [ ] **Step 3: Implement deterministic mapping**

Use stable IDs from existing prompt IDs when UUID-safe mapping is available; otherwise generate IDs once during migration and keep an in-memory source-to-target map for all relationships. Always create a legacy snapshot payload before rows are written.

- [ ] **Step 4: Verify focused tests**

```bash
node --test tests/v4-v5-migration.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add lib/sync/migrate-v4.mjs tests/v4-v5-migration.test.mjs
git commit -m "feat: add V4 to V5 cloud migration mapper"
```

### Task 4: Cloud client, autosync, snapshots, and Realtime invalidation

**Files:**
- Create: `lib/cloud/v5-client.js`
- Create: `lib/cloud/v5-realtime.js`
- Modify: `lib/cloud/sync-client.js`
- Create: `components/sync/SyncProvider.jsx`
- Create: `components/sync/SyncCenter.jsx`
- Modify: `components/CloudSyncPanel.jsx`
- Modify: `components/PromptOS.jsx`
- Test: `tests/v5-cloud-client-contract.test.mjs`

**Interfaces:**
- `readCloudRevision(client, userId)`
- `writePromptMutation(client, mutation, expectedRevision)` returns `{ revision }`
- `createCloudSnapshot(client, snapshot)`
- `subscribeUserInvalidation(client, userId, callback)` returns unsubscribe.

- [ ] **Step 1: Write failing contract tests**

Assert browser code imports the existing Supabase browser client, filters by authenticated `user_id`, exposes unsubscribe, and does not contain `service_role` or `SUPABASE_SECRET`.

- [ ] **Step 2: Verify failure**

```bash
node --test tests/v5-cloud-client-contract.test.mjs
```

- [ ] **Step 3: Implement Cloud-first flow**

`SyncProvider` sequence:

```text
load local cache -> resolve authenticated user -> read cloud revision -> decideSync -> snapshot if needed -> pull/push -> subscribe invalidation
```

Local edits write cache immediately and schedule cloud sync after 1000 ms. Offline writes enqueue mutations. Reconnect re-reads cloud revision before replay. Realtime callback only marks cloud as changed and triggers a revision check; it does not blindly apply event payloads.

- [ ] **Step 4: Run focused and full tests**

```bash
node --test tests/v5-cloud-client-contract.test.mjs tests/v5-sync-engine.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add lib/cloud components/sync components/CloudSyncPanel.jsx components/PromptOS.jsx tests/v5-cloud-client-contract.test.mjs
git commit -m "feat: add Cloud-first autosync and recovery UI"
```

### Task 5: Apply and verify Supabase schema safely

**Files:**
- Database migration only; no source change unless advisor findings require a follow-up commit.

**Interfaces:**
- Production/staging Supabase project selected explicitly before DDL.

- [ ] **Step 1: Re-read current Supabase changelog/docs for RLS, Data API grants, and Postgres Changes**

Use the Supabase documentation tool before execution; do not rely on cached assumptions.

- [ ] **Step 2: Apply schema to a development/staging project first**

Use the exact SQL from `supabase/v5-schema.sql`. Do not delete `prompt_os_state`.

- [ ] **Step 3: Run verification queries**

Verify all new tables exist, RLS is enabled, and a test authenticated user cannot access another user's rows.

- [ ] **Step 4: Run Supabase advisors**

Run security and performance advisors. Fix actionable findings before production application.

- [ ] **Step 5: Final Phase 3 verification**

```bash
npm test
npm run build
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

Expected: PASS; V4 fallback remains available; sync HUD reports revision/pending/last sync.
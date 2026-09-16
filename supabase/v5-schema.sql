-- Prompt.OS V5 normalized cloud schema.
-- This file is additive. It intentionally does NOT drop public.prompt_os_state,
-- which remains the V4 fallback during the V5.0 rollout.
--
-- Security model:
-- - browser uses a Supabase publishable key + authenticated user JWT
-- - every exposed table has RLS enabled
-- - every policy scopes rows to (select auth.uid()) = user_id
-- - grants are explicit for authenticated only

create table if not exists public.prompt_os_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'th',
  budget_warning numeric(14,6),
  hard_budget_limit numeric(14,6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompt_os_workspaces (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prompt_os_workspaces_id_user_unique unique (id, user_id)
);

create table if not exists public.prompt_os_folders (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null,
  name text not null,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prompt_os_folders_workspace_owner_fk
    foreign key (workspace_id, user_id)
    references public.prompt_os_workspaces(id, user_id)
    on delete cascade,
  constraint prompt_os_folders_id_user_unique unique (id, user_id)
);

create table if not exists public.prompt_os_prompts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null,
  folder_id uuid,
  legacy_id text,
  title text not null,
  description text not null default '',
  favorite boolean not null default false,
  pinned boolean not null default false,
  archived_at timestamptz,
  deleted_at timestamptz,
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prompt_os_prompts_workspace_owner_fk
    foreign key (workspace_id, user_id)
    references public.prompt_os_workspaces(id, user_id),
  constraint prompt_os_prompts_folder_owner_fk
    foreign key (folder_id, user_id)
    references public.prompt_os_folders(id, user_id)
    on delete set null,
  constraint prompt_os_prompts_id_user_unique unique (id, user_id),
  constraint prompt_os_prompts_user_legacy_unique unique (user_id, legacy_id)
);

create table if not exists public.prompt_os_prompt_versions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_id uuid not null,
  version text not null,
  body text not null default '',
  variable_schema jsonb not null default '{}'::jsonb,
  change_note text,
  created_at timestamptz not null default now(),
  constraint prompt_os_prompt_versions_prompt_owner_fk
    foreign key (prompt_id, user_id)
    references public.prompt_os_prompts(id, user_id)
    on delete cascade,
  constraint prompt_os_prompt_versions_schema_object
    check (jsonb_typeof(variable_schema) = 'object'),
  constraint prompt_os_prompt_versions_id_user_unique unique (id, user_id),
  constraint prompt_os_prompt_versions_number_unique unique (user_id, prompt_id, version)
);

create table if not exists public.prompt_os_evaluation_suites (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  rubric jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prompt_os_evaluation_suites_rubric_object
    check (jsonb_typeof(rubric) = 'object'),
  constraint prompt_os_evaluation_suites_id_user_unique unique (id, user_id)
);

create table if not exists public.prompt_os_evaluation_cases (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  suite_id uuid not null,
  name text not null,
  input jsonb not null default '{}'::jsonb,
  expected_output text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint prompt_os_evaluation_cases_suite_owner_fk
    foreign key (suite_id, user_id)
    references public.prompt_os_evaluation_suites(id, user_id)
    on delete cascade,
  constraint prompt_os_evaluation_cases_input_object
    check (jsonb_typeof(input) = 'object'),
  constraint prompt_os_evaluation_cases_id_user_unique unique (id, user_id)
);

create table if not exists public.prompt_os_evaluation_runs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  suite_id uuid not null,
  status text not null default 'pending',
  estimated_tokens bigint not null default 0,
  estimated_cost numeric(14,6) not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint prompt_os_evaluation_runs_suite_owner_fk
    foreign key (suite_id, user_id)
    references public.prompt_os_evaluation_suites(id, user_id)
    on delete cascade,
  constraint prompt_os_evaluation_runs_id_user_unique unique (id, user_id)
);

create table if not exists public.prompt_os_evaluation_results (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  case_id uuid not null,
  prompt_id uuid not null,
  prompt_version_id uuid not null,
  provider text not null,
  model text not null,
  output text not null default '',
  status text not null default 'ready',
  rubric_scores jsonb not null default '{}'::jsonb,
  latency_ms bigint not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  estimated_cost numeric(14,6) not null default 0,
  created_at timestamptz not null default now(),
  constraint prompt_os_evaluation_results_run_owner_fk
    foreign key (run_id, user_id)
    references public.prompt_os_evaluation_runs(id, user_id)
    on delete cascade,
  constraint prompt_os_evaluation_results_case_owner_fk
    foreign key (case_id, user_id)
    references public.prompt_os_evaluation_cases(id, user_id)
    on delete cascade,
  constraint prompt_os_evaluation_results_prompt_owner_fk
    foreign key (prompt_id, user_id)
    references public.prompt_os_prompts(id, user_id)
    on delete cascade,
  constraint prompt_os_evaluation_results_version_owner_fk
    foreign key (prompt_version_id, user_id)
    references public.prompt_os_prompt_versions(id, user_id)
    on delete cascade,
  constraint prompt_os_evaluation_results_scores_object
    check (jsonb_typeof(rubric_scores) = 'object')
);

create table if not exists public.prompt_os_usage_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_id uuid,
  prompt_version_id uuid,
  evaluation_run_id uuid,
  provider text not null,
  model text not null,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  latency_ms bigint not null default 0,
  estimated_cost numeric(14,6) not null default 0,
  status text not null default 'ready',
  error_code text,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint prompt_os_usage_events_prompt_owner_fk
    foreign key (prompt_id, user_id)
    references public.prompt_os_prompts(id, user_id)
    on delete set null,
  constraint prompt_os_usage_events_version_owner_fk
    foreign key (prompt_version_id, user_id)
    references public.prompt_os_prompt_versions(id, user_id)
    on delete set null,
  constraint prompt_os_usage_events_eval_run_owner_fk
    foreign key (evaluation_run_id, user_id)
    references public.prompt_os_evaluation_runs(id, user_id)
    on delete set null,
  constraint prompt_os_usage_events_pricing_object
    check (jsonb_typeof(pricing_snapshot) = 'object')
);

create table if not exists public.prompt_os_snapshots (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  schema_version integer not null,
  revision bigint not null default 0,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint prompt_os_snapshots_payload_object check (jsonb_typeof(payload) = 'object')
);

create table if not exists public.prompt_os_sync_meta (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0,
  schema_version integer not null default 5,
  migration_version text,
  last_synced_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint prompt_os_sync_meta_revision_nonnegative check (revision >= 0)
);

-- Explicit browser-role grants. No V5 table is granted to anon.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.prompt_os_user_settings to authenticated;
grant select, insert, update, delete on table public.prompt_os_workspaces to authenticated;
grant select, insert, update, delete on table public.prompt_os_folders to authenticated;
grant select, insert, update, delete on table public.prompt_os_prompts to authenticated;
grant select, insert, update, delete on table public.prompt_os_prompt_versions to authenticated;
grant select, insert, update, delete on table public.prompt_os_evaluation_suites to authenticated;
grant select, insert, update, delete on table public.prompt_os_evaluation_cases to authenticated;
grant select, insert, update, delete on table public.prompt_os_evaluation_runs to authenticated;
grant select, insert, update, delete on table public.prompt_os_evaluation_results to authenticated;
grant select, insert, update, delete on table public.prompt_os_usage_events to authenticated;
grant select, insert, update, delete on table public.prompt_os_snapshots to authenticated;
grant select, insert, update, delete on table public.prompt_os_sync_meta to authenticated;

-- Row Level Security.
alter table public.prompt_os_user_settings enable row level security;
alter table public.prompt_os_workspaces enable row level security;
alter table public.prompt_os_folders enable row level security;
alter table public.prompt_os_prompts enable row level security;
alter table public.prompt_os_prompt_versions enable row level security;
alter table public.prompt_os_evaluation_suites enable row level security;
alter table public.prompt_os_evaluation_cases enable row level security;
alter table public.prompt_os_evaluation_runs enable row level security;
alter table public.prompt_os_evaluation_results enable row level security;
alter table public.prompt_os_usage_events enable row level security;
alter table public.prompt_os_snapshots enable row level security;
alter table public.prompt_os_sync_meta enable row level security;

-- Policies are dropped first so this file can be re-applied safely while iterating.
drop policy if exists "prompt_os_user_settings_select_own" on public.prompt_os_user_settings;
drop policy if exists "prompt_os_user_settings_insert_own" on public.prompt_os_user_settings;
drop policy if exists "prompt_os_user_settings_update_own" on public.prompt_os_user_settings;
drop policy if exists "prompt_os_user_settings_delete_own" on public.prompt_os_user_settings;
create policy "prompt_os_user_settings_select_own" on public.prompt_os_user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_user_settings_insert_own" on public.prompt_os_user_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_user_settings_update_own" on public.prompt_os_user_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_user_settings_delete_own" on public.prompt_os_user_settings for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_workspaces_select_own" on public.prompt_os_workspaces;
drop policy if exists "prompt_os_workspaces_insert_own" on public.prompt_os_workspaces;
drop policy if exists "prompt_os_workspaces_update_own" on public.prompt_os_workspaces;
drop policy if exists "prompt_os_workspaces_delete_own" on public.prompt_os_workspaces;
create policy "prompt_os_workspaces_select_own" on public.prompt_os_workspaces for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_workspaces_insert_own" on public.prompt_os_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_workspaces_update_own" on public.prompt_os_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_workspaces_delete_own" on public.prompt_os_workspaces for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_folders_select_own" on public.prompt_os_folders;
drop policy if exists "prompt_os_folders_insert_own" on public.prompt_os_folders;
drop policy if exists "prompt_os_folders_update_own" on public.prompt_os_folders;
drop policy if exists "prompt_os_folders_delete_own" on public.prompt_os_folders;
create policy "prompt_os_folders_select_own" on public.prompt_os_folders for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_folders_insert_own" on public.prompt_os_folders for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_folders_update_own" on public.prompt_os_folders for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_folders_delete_own" on public.prompt_os_folders for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_prompts_select_own" on public.prompt_os_prompts;
drop policy if exists "prompt_os_prompts_insert_own" on public.prompt_os_prompts;
drop policy if exists "prompt_os_prompts_update_own" on public.prompt_os_prompts;
drop policy if exists "prompt_os_prompts_delete_own" on public.prompt_os_prompts;
create policy "prompt_os_prompts_select_own" on public.prompt_os_prompts for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_prompts_insert_own" on public.prompt_os_prompts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_prompts_update_own" on public.prompt_os_prompts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_prompts_delete_own" on public.prompt_os_prompts for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_prompt_versions_select_own" on public.prompt_os_prompt_versions;
drop policy if exists "prompt_os_prompt_versions_insert_own" on public.prompt_os_prompt_versions;
drop policy if exists "prompt_os_prompt_versions_update_own" on public.prompt_os_prompt_versions;
drop policy if exists "prompt_os_prompt_versions_delete_own" on public.prompt_os_prompt_versions;
create policy "prompt_os_prompt_versions_select_own" on public.prompt_os_prompt_versions for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_prompt_versions_insert_own" on public.prompt_os_prompt_versions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_prompt_versions_update_own" on public.prompt_os_prompt_versions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_prompt_versions_delete_own" on public.prompt_os_prompt_versions for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_evaluation_suites_select_own" on public.prompt_os_evaluation_suites;
drop policy if exists "prompt_os_evaluation_suites_insert_own" on public.prompt_os_evaluation_suites;
drop policy if exists "prompt_os_evaluation_suites_update_own" on public.prompt_os_evaluation_suites;
drop policy if exists "prompt_os_evaluation_suites_delete_own" on public.prompt_os_evaluation_suites;
create policy "prompt_os_evaluation_suites_select_own" on public.prompt_os_evaluation_suites for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_suites_insert_own" on public.prompt_os_evaluation_suites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_suites_update_own" on public.prompt_os_evaluation_suites for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_suites_delete_own" on public.prompt_os_evaluation_suites for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_evaluation_cases_select_own" on public.prompt_os_evaluation_cases;
drop policy if exists "prompt_os_evaluation_cases_insert_own" on public.prompt_os_evaluation_cases;
drop policy if exists "prompt_os_evaluation_cases_update_own" on public.prompt_os_evaluation_cases;
drop policy if exists "prompt_os_evaluation_cases_delete_own" on public.prompt_os_evaluation_cases;
create policy "prompt_os_evaluation_cases_select_own" on public.prompt_os_evaluation_cases for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_cases_insert_own" on public.prompt_os_evaluation_cases for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_cases_update_own" on public.prompt_os_evaluation_cases for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_cases_delete_own" on public.prompt_os_evaluation_cases for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_evaluation_runs_select_own" on public.prompt_os_evaluation_runs;
drop policy if exists "prompt_os_evaluation_runs_insert_own" on public.prompt_os_evaluation_runs;
drop policy if exists "prompt_os_evaluation_runs_update_own" on public.prompt_os_evaluation_runs;
drop policy if exists "prompt_os_evaluation_runs_delete_own" on public.prompt_os_evaluation_runs;
create policy "prompt_os_evaluation_runs_select_own" on public.prompt_os_evaluation_runs for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_runs_insert_own" on public.prompt_os_evaluation_runs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_runs_update_own" on public.prompt_os_evaluation_runs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_runs_delete_own" on public.prompt_os_evaluation_runs for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_evaluation_results_select_own" on public.prompt_os_evaluation_results;
drop policy if exists "prompt_os_evaluation_results_insert_own" on public.prompt_os_evaluation_results;
drop policy if exists "prompt_os_evaluation_results_update_own" on public.prompt_os_evaluation_results;
drop policy if exists "prompt_os_evaluation_results_delete_own" on public.prompt_os_evaluation_results;
create policy "prompt_os_evaluation_results_select_own" on public.prompt_os_evaluation_results for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_results_insert_own" on public.prompt_os_evaluation_results for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_results_update_own" on public.prompt_os_evaluation_results for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_evaluation_results_delete_own" on public.prompt_os_evaluation_results for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_usage_events_select_own" on public.prompt_os_usage_events;
drop policy if exists "prompt_os_usage_events_insert_own" on public.prompt_os_usage_events;
drop policy if exists "prompt_os_usage_events_update_own" on public.prompt_os_usage_events;
drop policy if exists "prompt_os_usage_events_delete_own" on public.prompt_os_usage_events;
create policy "prompt_os_usage_events_select_own" on public.prompt_os_usage_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_usage_events_insert_own" on public.prompt_os_usage_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_usage_events_update_own" on public.prompt_os_usage_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_usage_events_delete_own" on public.prompt_os_usage_events for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_snapshots_select_own" on public.prompt_os_snapshots;
drop policy if exists "prompt_os_snapshots_insert_own" on public.prompt_os_snapshots;
drop policy if exists "prompt_os_snapshots_update_own" on public.prompt_os_snapshots;
drop policy if exists "prompt_os_snapshots_delete_own" on public.prompt_os_snapshots;
create policy "prompt_os_snapshots_select_own" on public.prompt_os_snapshots for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_snapshots_insert_own" on public.prompt_os_snapshots for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_snapshots_update_own" on public.prompt_os_snapshots for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_snapshots_delete_own" on public.prompt_os_snapshots for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prompt_os_sync_meta_select_own" on public.prompt_os_sync_meta;
drop policy if exists "prompt_os_sync_meta_insert_own" on public.prompt_os_sync_meta;
drop policy if exists "prompt_os_sync_meta_update_own" on public.prompt_os_sync_meta;
drop policy if exists "prompt_os_sync_meta_delete_own" on public.prompt_os_sync_meta;
create policy "prompt_os_sync_meta_select_own" on public.prompt_os_sync_meta for select to authenticated using ((select auth.uid()) = user_id);
create policy "prompt_os_sync_meta_insert_own" on public.prompt_os_sync_meta for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "prompt_os_sync_meta_update_own" on public.prompt_os_sync_meta for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "prompt_os_sync_meta_delete_own" on public.prompt_os_sync_meta for delete to authenticated using ((select auth.uid()) = user_id);

-- Ownership and query-path indexes.
create index if not exists prompt_os_workspaces_user_order_idx on public.prompt_os_workspaces(user_id, sort_order);
create index if not exists prompt_os_folders_user_workspace_order_idx on public.prompt_os_folders(user_id, workspace_id, sort_order);
create index if not exists prompt_os_prompts_user_updated_idx on public.prompt_os_prompts(user_id, updated_at desc);
create index if not exists prompt_os_prompts_user_location_idx on public.prompt_os_prompts(user_id, workspace_id, folder_id);
create index if not exists prompt_os_prompts_user_deleted_idx on public.prompt_os_prompts(user_id, deleted_at);
create index if not exists prompt_os_prompt_versions_user_prompt_created_idx on public.prompt_os_prompt_versions(user_id, prompt_id, created_at desc);
create index if not exists prompt_os_eval_cases_user_suite_order_idx on public.prompt_os_evaluation_cases(user_id, suite_id, sort_order);
create index if not exists prompt_os_eval_runs_user_created_idx on public.prompt_os_evaluation_runs(user_id, created_at desc);
create index if not exists prompt_os_eval_results_user_run_idx on public.prompt_os_evaluation_results(user_id, run_id, created_at);
create index if not exists prompt_os_usage_events_user_created_idx on public.prompt_os_usage_events(user_id, created_at desc);
create index if not exists prompt_os_usage_events_user_prompt_idx on public.prompt_os_usage_events(user_id, prompt_id, created_at desc);
create index if not exists prompt_os_snapshots_user_created_idx on public.prompt_os_snapshots(user_id, created_at desc);

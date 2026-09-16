-- Prompt.OS cloud state: one JSONB document per authenticated user.
create table if not exists public.prompt_os_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint prompt_os_state_payload_is_object check (jsonb_typeof(payload) = 'object')
);

alter table public.prompt_os_state enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.prompt_os_state to authenticated;

drop policy if exists "prompt_os_state_select_own" on public.prompt_os_state;
drop policy if exists "prompt_os_state_insert_own" on public.prompt_os_state;
drop policy if exists "prompt_os_state_update_own" on public.prompt_os_state;
drop policy if exists "prompt_os_state_delete_own" on public.prompt_os_state;

create policy "prompt_os_state_select_own"
on public.prompt_os_state
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "prompt_os_state_insert_own"
on public.prompt_os_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "prompt_os_state_update_own"
on public.prompt_os_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "prompt_os_state_delete_own"
on public.prompt_os_state
for delete
to authenticated
using ((select auth.uid()) = user_id);

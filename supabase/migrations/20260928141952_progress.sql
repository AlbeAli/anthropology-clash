create table public.progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scenario_id text not null check (scenario_id ~ '^scenario_[0-9]{3}$'),
  level text not null check (level in ('neofita', 'studente')),
  choice text not null check (choice ~ '^[a-d]$'),
  completed_on date not null,
  primary key (user_id, scenario_id)
);

create table public.streaks (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  streak_count integer not null default 0 check (streak_count >= 0),
  last_day date
);

alter table public.progress enable row level security;
alter table public.streaks enable row level security;

revoke all on public.progress, public.streaks from anon, authenticated;
grant select, insert, update, delete on public.progress, public.streaks to authenticated;
grant all on public.progress, public.streaks to service_role;

create policy "progress_select_own" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "progress_insert_own" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progress_update_own" on public.progress
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progress_delete_own" on public.progress
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "streaks_select_own" on public.streaks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "streaks_insert_own" on public.streaks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "streaks_update_own" on public.streaks
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "streaks_delete_own" on public.streaks
  for delete to authenticated using ((select auth.uid()) = user_id);

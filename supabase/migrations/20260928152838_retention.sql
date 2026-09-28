create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.streaks add column updated_at timestamptz not null default now();

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger streaks_touch_updated_at
  before update on public.streaks
  for each row execute function private.touch_updated_at();

create function private.delete_inactive_accounts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  delete from auth.users u
  where greatest(
    u.created_at,
    coalesce(u.last_sign_in_at, u.created_at),
    coalesce((select s.updated_at from public.streaks s where s.user_id = u.id), u.created_at)
  ) < now() - interval '24 months';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function private.delete_inactive_accounts() from public, anon, authenticated;
revoke all on function private.touch_updated_at() from public, anon, authenticated;

select cron.schedule(
  'delete-inactive-accounts',
  '0 3 1 * *',
  $$ select private.delete_inactive_accounts(); $$
);

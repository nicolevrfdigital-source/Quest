-- Quest HQ — initial schema
-- Run once in the Supabase SQL editor (or with `supabase db push`).
-- Every table is private to its owner through Row Level Security.

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Habit logs: one row per calendar day. Independent of quests, so creating,
-- extending or finishing a quest never touches habit history.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.habit_logs (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  nourish    boolean not null default false,
  move       boolean not null default false,
  water      boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create trigger habit_logs_updated_at
  before update on public.habit_logs
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Quests: date ranges that frame progress. At most one active quest per user.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.quests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'active' check (status in ('active', 'finished')),
  finished_at timestamptz,
  created_at  timestamptz not null default now(),
  constraint quests_dates_ordered check (end_date >= start_date)
);

create unique index if not exists quests_one_active_per_user
  on public.quests (user_id) where status = 'active';
create index if not exists quests_user_idx on public.quests (user_id);

-- ─────────────────────────────────────────────────────────────
-- Countdowns: either a fixed target date, or linked to the active quest's end.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.countdowns (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title           text not null default '' check (char_length(title) <= 60),
  target_date     date,
  linked_to_quest boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  constraint countdowns_has_target check (linked_to_quest or target_date is not null)
);

create index if not exists countdowns_user_idx on public.countdowns (user_id);

-- ─────────────────────────────────────────────────────────────
-- Settings: the single sticky note and the photo's storage path.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.user_settings (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  sticky_note text not null default '' check (char_length(sticky_note) <= 5000),
  photo_path  text,
  updated_at  timestamptz not null default now()
);

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security: owner-only access everywhere.
-- ─────────────────────────────────────────────────────────────
alter table public.habit_logs    enable row level security;
alter table public.quests        enable row level security;
alter table public.countdowns    enable row level security;
alter table public.user_settings enable row level security;

-- Anonymous visitors get nothing at all.
revoke all on public.habit_logs, public.quests, public.countdowns, public.user_settings from anon;

do $$
declare
  t text;
begin
  foreach t in array array['habit_logs', 'quests', 'countdowns', 'user_settings'] loop
    execute format('create policy "%1$s: owner select" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: owner insert" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: owner update" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: owner delete" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Realtime: lets the iPad and phone see each other's edits live.
-- (Realtime respects the RLS policies above.)
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime
  add table public.habit_logs, public.quests, public.countdowns, public.user_settings;

-- ─────────────────────────────────────────────────────────────
-- Import: replaces the caller's habit logs, quests, countdowns and sticky note
-- in one transaction (all-or-nothing). Runs with the caller's permissions, so
-- RLS still applies.
-- ─────────────────────────────────────────────────────────────
create or replace function public.import_backup(payload jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  delete from public.habit_logs where user_id = uid;
  delete from public.quests     where user_id = uid;
  delete from public.countdowns where user_id = uid;

  insert into public.habit_logs (user_id, day, nourish, move, water)
  select uid,
         (x ->> 'day')::date,
         coalesce((x ->> 'nourish')::boolean, false),
         coalesce((x ->> 'move')::boolean, false),
         coalesce((x ->> 'water')::boolean, false)
  from jsonb_array_elements(coalesce(payload -> 'habit_logs', '[]'::jsonb)) as x;

  insert into public.quests (user_id, name, start_date, end_date, status, finished_at)
  select uid,
         x ->> 'name',
         (x ->> 'start_date')::date,
         (x ->> 'end_date')::date,
         coalesce(x ->> 'status', 'finished'),
         (x ->> 'finished_at')::timestamptz
  from jsonb_array_elements(coalesce(payload -> 'quests', '[]'::jsonb)) as x;

  insert into public.countdowns (user_id, title, target_date, linked_to_quest, sort_order)
  select uid,
         coalesce(x ->> 'title', ''),
         (x ->> 'target_date')::date,
         coalesce((x ->> 'linked_to_quest')::boolean, false),
         coalesce((x ->> 'sort_order')::integer, 0)
  from jsonb_array_elements(coalesce(payload -> 'countdowns', '[]'::jsonb)) as x;

  insert into public.user_settings (user_id, sticky_note)
  values (uid, coalesce(payload ->> 'sticky_note', ''))
  on conflict (user_id) do update set sticky_note = excluded.sticky_note;
end;
$$;

revoke execute on function public.import_backup(jsonb) from public, anon;
grant execute on function public.import_backup(jsonb) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Private photo bucket. Files live under "<user id>/..." and only that user
-- can read or write them. The app shows the photo through short-lived signed URLs.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "photos: owner select" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

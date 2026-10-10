-- Quest HQ — health stats & mood
-- Daily numbers (steps, calories burned/consumed, weight) arrive from the phone
-- through the "HC Webhook" Android app, which reads Health Connect and POSTs
-- JSON to public.ingest_health. Moods and manual numbers are written by the app.
-- Run once in the Supabase SQL editor. Safe to run more than once.

-- ─────────────────────────────────────────────────────────────
-- Daily values. One row per day, kind and source app ("origin").
-- origin = 'manual' rows are typed in Quest HQ and always win.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.daily_health (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  kind       text not null check (kind in ('steps', 'calories_burned', 'calories_consumed', 'weight')),
  origin     text not null check (char_length(origin) between 1 and 200),
  value      double precision not null check (value >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day, kind, origin)
);

-- Raw records behind the summed kinds, so re-sent records replace instead of double counting.
create table if not exists public.health_samples (
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null,
  origin     text not null,
  start_time timestamptz not null,
  end_time   timestamptz not null,
  label      text not null default '',
  value      double precision not null,
  primary key (user_id, kind, origin, start_time, end_time, label)
);

-- Mood: 1 (rough) … 5 (amazing), one per day.
create table if not exists public.moods (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  mood       smallint not null check (mood between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

drop trigger if exists moods_updated_at on public.moods;
create trigger moods_updated_at
  before update on public.moods
  for each row execute function public.set_updated_at();

-- The phone's secret key (only its SHA-256 is stored) and the time zone used to assign days.
create table if not exists public.health_ingest_tokens (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  token_hash   text not null unique,
  time_zone    text not null default 'UTC',
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

-- Which source app to trust per kind, e.g. {"calories_burned": "com.fitbit.FitbitMobile"}.
alter table public.user_settings
  add column if not exists health_sources jsonb not null default '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.daily_health         enable row level security;
alter table public.health_samples       enable row level security;
alter table public.moods                enable row level security;
alter table public.health_ingest_tokens enable row level security;

revoke all on public.daily_health, public.health_samples, public.moods, public.health_ingest_tokens from anon;

do $$
declare
  t text;
begin
  foreach t in array array['daily_health', 'moods'] loop
    execute format('drop policy if exists "%1$s: owner select" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: owner insert" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: owner update" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: owner delete" on public.%1$I', t);
    execute format('create policy "%1$s: owner select" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: owner insert" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: owner update" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: owner delete" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- Samples and tokens are only written by the functions below; the owner may read their own.
drop policy if exists "health_samples: owner select" on public.health_samples;
create policy "health_samples: owner select" on public.health_samples
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "health_ingest_tokens: owner select" on public.health_ingest_tokens;
create policy "health_ingest_tokens: owner select" on public.health_ingest_tokens
  for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.health_samples, public.health_ingest_tokens from authenticated;

do $$
begin
  alter publication supabase_realtime add table public.daily_health, public.moods;
exception when duplicate_object then null;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Creates (or replaces) the phone's secret key. Returns it once; only its hash is kept.
-- ─────────────────────────────────────────────────────────────
create or replace function public.create_health_token(tz text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  token text;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if tz is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = tz) then
    tz := 'UTC';
  end if;
  token := 'qhq_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.health_ingest_tokens (user_id, token_hash, time_zone)
  values (uid, encode(sha256(convert_to(token, 'UTF8')), 'hex'), tz)
  on conflict (user_id) do update
    set token_hash = excluded.token_hash, time_zone = excluded.time_zone, created_at = now(), last_used_at = null;
  return token;
end;
$$;

revoke execute on function public.create_health_token(text) from public, anon;
grant execute on function public.create_health_token(text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Webhook receiver. The phone POSTs the HC Webhook JSON body to
--   /rest/v1/rpc/ingest_health
-- with headers  apikey: <publishable key>  and  x-quest-token: <secret key>.
-- ─────────────────────────────────────────────────────────────
create or replace function public.ingest_health(jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  payload jsonb := $1;
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  token text := headers ->> 'x-quest-token';
  uid uuid;
  tz text;
  r jsonb;
  rec record;
  s timestamptz;
  d date;
  days date[] := '{}';
  n int := 0;
begin
  if token is null or token = '' then
    raise exception 'Missing x-quest-token header' using errcode = '28000';
  end if;
  select user_id, time_zone into uid, tz
  from public.health_ingest_tokens
  where token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex');
  if uid is null then
    raise exception 'Unknown token' using errcode = '28000';
  end if;
  update public.health_ingest_tokens set last_used_at = now() where user_id = uid;

  -- Steps arrive as one total per local day (already de-duplicated by Health Connect).
  -- A bucket starting at midnight is the whole day so far; an older, clipped bucket
  -- only covers part of a day, so it may raise the count but never lower it.
  for r in select * from jsonb_array_elements(coalesce(payload -> 'steps', '[]'::jsonb)) loop
    s := (r ->> 'start_time')::timestamptz;
    d := (s at time zone tz)::date;
    insert into public.daily_health (user_id, day, kind, origin, value)
    values (uid, d, 'steps', 'health_connect', (r ->> 'count')::double precision)
    on conflict (user_id, day, kind, origin) do update
      set value = case
            when (s at time zone tz)::time = '00:00' then excluded.value
            else greatest(public.daily_health.value, excluded.value)
          end,
          updated_at = now();
    n := n + 1;
  end loop;

  -- Raw records: calories burned, food, weight.
  for rec in
    select x, 'calories_burned' as kind, (x ->> 'calories')::double precision as v, '' as label,
           (x ->> 'start_time')::timestamptz as st, (x ->> 'end_time')::timestamptz as et
    from jsonb_array_elements(coalesce(payload -> 'total_calories', '[]'::jsonb)) as x
    union all
    select x, 'calories_consumed', (x ->> 'calories')::double precision, coalesce(x ->> 'name', ''),
           (x ->> 'start_time')::timestamptz, (x ->> 'end_time')::timestamptz
    from jsonb_array_elements(coalesce(payload -> 'nutrition', '[]'::jsonb)) as x
    union all
    select x, 'weight', (x ->> 'kilograms')::double precision, '',
           (x ->> 'time')::timestamptz, (x ->> 'time')::timestamptz
    from jsonb_array_elements(coalesce(payload -> 'weight', '[]'::jsonb)) as x
  loop
    continue when rec.v is null or rec.st is null;
    insert into public.health_samples (user_id, kind, origin, start_time, end_time, label, value)
    values (
      uid,
      rec.kind,
      coalesce(rec.x -> 'metadata' ->> 'data_origin', 'unknown'),
      rec.st,
      coalesce(rec.et, rec.st),
      rec.label,
      greatest(rec.v, 0)
    )
    on conflict (user_id, kind, origin, start_time, end_time, label) do update set value = excluded.value;
    days := array_append(days, (rec.st at time zone tz)::date);
    n := n + 1;
  end loop;

  if array_length(days, 1) > 0 then
    -- Calories: the day's sum per source app.
    insert into public.daily_health (user_id, day, kind, origin, value)
    select uid, (start_time at time zone tz)::date, kind, origin, sum(value)
    from public.health_samples
    where user_id = uid
      and kind in ('calories_burned', 'calories_consumed')
      and (start_time at time zone tz)::date = any (days)
    group by 2, 3, 4
    on conflict (user_id, day, kind, origin) do update set value = excluded.value, updated_at = now();

    -- Weight: the day's last reading per source app.
    insert into public.daily_health (user_id, day, kind, origin, value)
    select distinct on ((start_time at time zone tz)::date, origin)
           uid, (start_time at time zone tz)::date, 'weight', origin, value
    from public.health_samples
    where user_id = uid and kind = 'weight' and (start_time at time zone tz)::date = any (days)
    order by (start_time at time zone tz)::date, origin, start_time desc
    on conflict (user_id, day, kind, origin) do update set value = excluded.value, updated_at = now();
  end if;

  return jsonb_build_object('ok', true, 'records', n);
end;
$$;

revoke execute on function public.ingest_health(jsonb) from public;
grant execute on function public.ingest_health(jsonb) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Import now also restores moods (older backups without them leave moods empty).
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
  delete from public.moods      where user_id = uid;

  insert into public.habit_logs (user_id, day, nourish, move, water, challenge)
  select uid,
         (x ->> 'day')::date,
         coalesce((x ->> 'nourish')::boolean, false),
         coalesce((x ->> 'move')::boolean, false),
         coalesce((x ->> 'water')::boolean, false),
         coalesce((x ->> 'challenge')::boolean, false)
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

  insert into public.moods (user_id, day, mood)
  select uid, (x ->> 'day')::date, (x ->> 'mood')::smallint
  from jsonb_array_elements(coalesce(payload -> 'moods', '[]'::jsonb)) as x;

  insert into public.user_settings (user_id, sticky_note)
  values (uid, coalesce(payload ->> 'sticky_note', ''))
  on conflict (user_id) do update set sticky_note = excluded.sticky_note;
end;
$$;

revoke execute on function public.import_backup(jsonb) from public, anon;
grant execute on function public.import_backup(jsonb) to authenticated;

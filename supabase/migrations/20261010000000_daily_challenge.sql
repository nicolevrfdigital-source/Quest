-- Quest HQ — daily movement challenge
-- Adds a fourth daily check-in. Which challenge appears on a given day is
-- decided by the app from the date, so only "done or not" is stored.
-- Safe to run more than once.

alter table public.habit_logs
  add column if not exists challenge boolean not null default false;

-- Import now restores the challenge too (older backups without it import as "not done").
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

  insert into public.user_settings (user_id, sticky_note)
  values (uid, coalesce(payload ->> 'sticky_note', ''))
  on conflict (user_id) do update set sticky_note = excluded.sticky_note;
end;
$$;

revoke execute on function public.import_backup(jsonb) from public, anon;
grant execute on function public.import_backup(jsonb) to authenticated;

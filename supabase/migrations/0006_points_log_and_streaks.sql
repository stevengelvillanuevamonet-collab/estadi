-- Points ledger (enables weekly/monthly leaderboards) + daily streak system
-- with escalating rewards and up to 3 auto-applied "streak savers" per week.

create table if not exists public.points_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null, -- positive = earned, negative = spent on a perk
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists points_log_user_created_idx on public.points_log (user_id, created_at desc);

alter table public.points_log enable row level security;
create policy "points_log: read own" on public.points_log for select using (auth.uid() = user_id);
-- No insert/update/delete policy for regular users — rows are only ever
-- written by the SECURITY DEFINER functions below.

alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_active_date date,
  add column if not exists streak_freezes_available integer not null default 3,
  add column if not exists freeze_week_start date not null default current_date;

-- Replace increment_points so every earn is also logged to points_log,
-- and reject non-positive amounts (spending uses spend_points instead).
drop function if exists public.increment_points(uuid, integer);

create or replace function public.increment_points(p_user_id uuid, p_amount integer, p_reason text default 'activity')
returns integer as $$
declare
  new_total integer;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'not authorized';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.profiles
  set points = points + p_amount
  where id = p_user_id
  returning points into new_total;

  insert into public.points_log (user_id, amount, reason) values (p_user_id, p_amount, p_reason);

  return new_total;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.increment_points(uuid, integer, text) to authenticated;

-- Spends points on a functional perk. Floors at zero — never lets a user go negative.
create or replace function public.spend_points(p_user_id uuid, p_amount integer, p_reason text)
returns integer as $$
declare
  current_total integer;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'not authorized';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  select points into current_total from public.profiles where id = p_user_id for update;
  if current_total < p_amount then
    raise exception 'not enough points';
  end if;

  update public.profiles set points = points - p_amount where id = p_user_id;
  insert into public.points_log (user_id, amount, reason) values (p_user_id, -p_amount, p_reason);

  return current_total - p_amount;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.spend_points(uuid, integer, text) to authenticated;

-- Records a day of activity and updates the streak. Idempotent per calendar
-- day. If exactly one day was missed and a streak freeze is available, the
-- freeze is auto-consumed and the streak continues instead of resetting.
-- Freeze allowance resets to 3 at the start of each week.
create or replace function public.record_streak_activity(p_user_id uuid)
returns table (current_streak integer, longest_streak integer, streak_saved boolean, is_new_day boolean) as $$
declare
  row_last_active date;
  row_current_streak integer;
  row_longest_streak integer;
  row_freezes integer;
  row_freeze_week date;
  today date := current_date;
  result_streak integer;
  result_saved boolean := false;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'not authorized';
  end if;

  select p.last_active_date, p.current_streak, p.longest_streak, p.streak_freezes_available, p.freeze_week_start
  into row_last_active, row_current_streak, row_longest_streak, row_freezes, row_freeze_week
  from public.profiles p
  where p.id = p_user_id
  for update;

  if row_last_active = today then
    return query select row_current_streak, row_longest_streak, false, false;
    return;
  end if;

  if row_freeze_week is null or date_trunc('week', today::timestamp) <> date_trunc('week', row_freeze_week::timestamp) then
    row_freezes := 3;
    row_freeze_week := today;
  end if;

  if row_last_active = today - 1 then
    result_streak := row_current_streak + 1;
  elsif row_last_active = today - 2 and row_freezes > 0 then
    result_streak := row_current_streak + 1;
    row_freezes := row_freezes - 1;
    result_saved := true;
  else
    result_streak := 1;
  end if;

  row_longest_streak := greatest(row_longest_streak, result_streak);

  update public.profiles
  set current_streak = result_streak,
      longest_streak = row_longest_streak,
      last_active_date = today,
      streak_freezes_available = row_freezes,
      freeze_week_start = row_freeze_week
  where id = p_user_id;

  return query select result_streak, row_longest_streak, result_saved, true;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.record_streak_activity(uuid) to authenticated;

-- Buy an extra streak freeze with points (a functional perk).
create or replace function public.buy_streak_saver(p_user_id uuid, p_cost integer)
returns integer as $$
declare
  new_freezes integer;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'not authorized';
  end if;

  perform public.spend_points(p_user_id, p_cost, 'streak_saver_purchase');

  update public.profiles
  set streak_freezes_available = streak_freezes_available + 1
  where id = p_user_id
  returning streak_freezes_available into new_freezes;

  return new_freezes;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.buy_streak_saver(uuid, integer) to authenticated;

-- Fixes a real bug: rank was computed from the spendable points balance,
-- so buying anything (a theme, a streak saver, a perk) could demote your
-- rank. Ranks should reflect total effort ever put in, not current
-- unspent balance. lifetime_points only ever goes up; `points` remains
-- the spendable balance used for affordability checks.

alter table public.profiles
  add column if not exists lifetime_points integer not null default 0;

-- Backfill from the points ledger where available (sum of all positive
-- entries = everything ever earned), falling back to the current balance
-- for any row with no ledger history yet.
update public.profiles p
set lifetime_points = coalesce(
  (select sum(amount) from public.points_log pl where pl.user_id = p.id and pl.amount > 0),
  p.points
);

-- increment_points now bumps both columns; spend_points is untouched on
-- purpose, since spending should never reduce lifetime_points.
drop function if exists public.increment_points(uuid, integer, text);

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
  set points = points + p_amount,
      lifetime_points = lifetime_points + p_amount
  where id = p_user_id
  returning points into new_total;

  insert into public.points_log (user_id, amount, reason) values (p_user_id, p_amount, p_reason);

  return new_total;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.increment_points(uuid, integer, text) to authenticated;

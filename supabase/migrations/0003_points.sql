-- StudBud points system: earn points for correct quiz answers

alter table public.profiles
  add column if not exists points integer not null default 0;

-- Atomically increments the caller's own points. SECURITY DEFINER bypasses
-- RLS for the update, so the auth.uid() check below is what keeps a user
-- from incrementing anyone else's score.
create or replace function public.increment_points(p_user_id uuid, p_amount integer)
returns integer as $$
declare
  new_total integer;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'not authorized';
  end if;

  update public.profiles
  set points = points + p_amount
  where id = p_user_id
  returning points into new_total;

  return new_total;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.increment_points(uuid, integer) to authenticated;

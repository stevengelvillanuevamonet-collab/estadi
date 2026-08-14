-- StudBud rewards: spend points to unlock accent color themes

alter table public.profiles
  add column if not exists unlocked_themes text[] not null default '{}',
  add column if not exists active_theme text not null default 'default';

-- Atomically spends points to unlock a theme. Re-checks everything server-side
-- (ownership, sufficient balance, not already owned) so the client can't just
-- call this with a fabricated cost or someone else's user id.
create or replace function public.unlock_theme(p_user_id uuid, p_theme text, p_cost integer)
returns table (points integer, unlocked_themes text[]) as $$
declare
  current_points integer;
  current_themes text[];
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'not authorized';
  end if;

  select p.points, p.unlocked_themes into current_points, current_themes
  from public.profiles p
  where p.id = p_user_id
  for update;

  if current_themes @> array[p_theme] then
    raise exception 'theme already unlocked';
  end if;

  if current_points < p_cost then
    raise exception 'not enough points';
  end if;

  update public.profiles
  set points = points - p_cost,
      unlocked_themes = array_append(unlocked_themes, p_theme)
  where id = p_user_id
  returning profiles.points, profiles.unlocked_themes into current_points, current_themes;

  return query select current_points, current_themes;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.unlock_theme(uuid, text, integer) to authenticated;

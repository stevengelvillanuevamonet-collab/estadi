-- Fixes a bug in unlock_theme: RETURNS TABLE (points, unlocked_themes) created
-- PL/pgSQL variables literally named "points" and "unlocked_themes", which
-- collided with the identically-named columns on public.profiles inside the
-- function body ("column reference "points" is ambiguous"). Renaming the
-- output columns removes the collision entirely.

-- Changing a function's RETURNS TABLE shape requires dropping it first —
-- CREATE OR REPLACE can't alter the output row type.
drop function if exists public.unlock_theme(uuid, text, integer);

create or replace function public.unlock_theme(p_user_id uuid, p_theme text, p_cost integer)
returns table (new_points integer, new_unlocked_themes text[]) as $$
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

  update public.profiles as prof
  set points = prof.points - p_cost,
      unlocked_themes = array_append(prof.unlocked_themes, p_theme)
  where prof.id = p_user_id
  returning prof.points, prof.unlocked_themes into current_points, current_themes;

  return query select current_points, current_themes;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.unlock_theme(uuid, text, integer) to authenticated;

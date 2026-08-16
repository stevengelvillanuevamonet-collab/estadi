-- Companion (capybara) system: a naming, evolves with rank (lifetime_points,
-- via the existing RANKS ladder), and wears purchasable accessories.

alter table public.profiles
  add column if not exists pet_name text not null default 'Bara',
  add column if not exists unlocked_accessories text[] not null default '{}',
  add column if not exists equipped_accessories jsonb not null default '{}'::jsonb;
  -- equipped_accessories shape: { "face": "reading_glasses", "head": "graduation_cap", ... }
  -- keyed by slot so equipping a new item in a slot just overwrites that key.

-- Atomically unlocks an accessory with points, same safety pattern as
-- unlock_theme: re-validates ownership, balance, and "not already owned"
-- server-side. Output columns are deliberately NOT named the same as the
-- profiles columns they read/write (see 0005's fix) to avoid PL/pgSQL
-- treating a bare column reference as ambiguous with the OUT parameter.
create or replace function public.unlock_accessory(p_user_id uuid, p_accessory text, p_cost integer)
returns table (new_points integer, new_unlocked_accessories text[]) as $$
declare
  current_points integer;
  current_accessories text[];
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'not authorized';
  end if;

  select p.points, p.unlocked_accessories into current_points, current_accessories
  from public.profiles p
  where p.id = p_user_id
  for update;

  if current_accessories @> array[p_accessory] then
    raise exception 'accessory already unlocked';
  end if;

  if current_points < p_cost then
    raise exception 'not enough points';
  end if;

  update public.profiles as prof
  set points = prof.points - p_cost,
      unlocked_accessories = array_append(prof.unlocked_accessories, p_accessory)
  where prof.id = p_user_id
  returning prof.points, prof.unlocked_accessories into current_points, current_accessories;

  insert into public.points_log (user_id, amount, reason) values (p_user_id, -p_cost, 'accessory_unlock');

  return query select current_points, current_accessories;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.unlock_accessory(uuid, text, integer) to authenticated;

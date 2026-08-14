-- Friends system + weekly/monthly leaderboard among friends

create table if not exists public.friendships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_no_self check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);
create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

create policy "friendships: read own" on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships: create request" on public.friendships for insert
  with check (auth.uid() = requester_id);

create policy "friendships: respond or update own" on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships: delete own" on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Looks up a user's public summary by exact email, for sending friend
-- requests. Returns nothing if no match — never exposes anything beyond
-- id/name/avatar, and requires the caller to already know the exact email.
create or replace function public.find_user_by_email(p_email text)
returns table (id uuid, full_name text, avatar_url text) as $$
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  return query
    select u.id, p.full_name, p.avatar_url
    from auth.users u
    join public.profiles p on p.id = u.id
    where lower(u.email) = lower(p_email)
    limit 1;
end;
$$ language plpgsql security definer set search_path = public, auth;

grant execute on function public.find_user_by_email(text) to authenticated;

-- Returns the caller's pending/accepted friendships with the other party's
-- name/avatar attached. A SECURITY DEFINER function is used here (rather
-- than loosening the profiles RLS policy) so a pending request can show who
-- sent it without giving every authenticated user broad read access to
-- everyone else's profile.
create or replace function public.get_friend_requests()
returns table (
  friendship_id uuid,
  other_user_id uuid,
  other_full_name text,
  other_avatar_url text,
  status text,
  direction text, -- 'incoming' or 'outgoing'
  created_at timestamptz
) as $$
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  return query
    select
      f.id,
      case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end,
      coalesce(p.full_name, 'Student'),
      p.avatar_url,
      f.status,
      case when f.requester_id = auth.uid() then 'outgoing' else 'incoming' end,
      f.created_at
    from public.friendships f
    join public.profiles p
      on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
    where f.requester_id = auth.uid() or f.addressee_id = auth.uid()
    order by f.created_at desc;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.get_friend_requests() to authenticated;

-- Weekly or monthly points leaderboard among accepted friends (+ yourself).
-- Ranks by points *earned* in the period (ignores spending on perks, so
-- buying a perk never hurts your rank) alongside each person's all-time total.
create or replace function public.get_friend_leaderboard(p_period text)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  is_self boolean,
  period_points bigint,
  total_points integer
) as $$
declare
  period_start timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if p_period = 'week' then
    period_start := date_trunc('week', now());
  elsif p_period = 'month' then
    period_start := date_trunc('month', now());
  else
    raise exception 'invalid period';
  end if;

  return query
    with friend_ids as (
      select case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end as fid
      from public.friendships f
      where f.status = 'accepted'
        and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
      union
      select auth.uid()
    )
    select
      p.id,
      coalesce(p.full_name, 'Student') as full_name,
      p.avatar_url,
      p.id = auth.uid() as is_self,
      coalesce(sum(pl.amount) filter (where pl.created_at >= period_start and pl.amount > 0), 0) as period_points,
      p.points as total_points
    from friend_ids fi
    join public.profiles p on p.id = fi.fid
    left join public.points_log pl on pl.user_id = p.id
    group by p.id, p.full_name, p.avatar_url, p.points
    order by period_points desc, total_points desc;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.get_friend_leaderboard(text) to authenticated;

-- StudBud wellbeing schema: daily mood check-ins + stress journal
-- Run via: supabase db push (or paste into the Supabase SQL editor)

create table if not exists public.mood_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null default (now()::date),
  mood smallint not null check (mood between 1 and 5), -- 1 = awful ... 5 = great
  stress_level smallint not null check (stress_level between 0 and 100),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);
create index if not exists mood_entries_user_date_idx on public.mood_entries (user_id, entry_date desc);

alter table public.mood_entries enable row level security;

create policy "mood_entries: all own" on public.mood_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- keep updated_at current on edits
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists mood_entries_set_updated_at on public.mood_entries;
create trigger mood_entries_set_updated_at
  before update on public.mood_entries
  for each row execute procedure public.set_updated_at();

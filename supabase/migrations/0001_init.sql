-- StudBud initial schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "uuid-ossp";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- subjects ----------
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#D68A2E',
  icon text not null default 'book',
  created_at timestamptz not null default now()
);
create index if not exists subjects_user_id_idx on public.subjects (user_id);

-- ---------- topics (used for weak-topic tracking) ----------
create table if not exists public.topics (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (subject_id, name)
);
create index if not exists topics_subject_id_idx on public.topics (subject_id);

-- ---------- materials (notes) ----------
create table if not exists public.materials (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null default '',
  source_type text not null default 'text' check (source_type in ('text', 'file')),
  file_path text,
  file_type text,
  created_at timestamptz not null default now()
);
create index if not exists materials_subject_id_idx on public.materials (subject_id);

-- ---------- flashcards ----------
create table if not exists public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  topic_id uuid references public.topics (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  front text not null,
  back text not null,
  ease_factor real not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists flashcards_subject_id_idx on public.flashcards (subject_id);
create index if not exists flashcards_due_at_idx on public.flashcards (user_id, due_at);

-- ---------- quizzes ----------
create table if not exists public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  status text not null default 'ready' check (status in ('generating', 'ready', 'failed')),
  created_at timestamptz not null default now()
);
create index if not exists quizzes_subject_id_idx on public.quizzes (subject_id);

create table if not exists public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  question text not null,
  options jsonb not null,
  correct_index integer not null,
  explanation text,
  created_at timestamptz not null default now()
);
create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions (quiz_id);

create table if not exists public.quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  score integer not null default 0,
  total integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts (user_id);

create table if not exists public.quiz_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  selected_index integer,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists quiz_answers_attempt_id_idx on public.quiz_answers (attempt_id);
create index if not exists quiz_answers_topic_id_idx on public.quiz_answers (topic_id);

-- ---------- study sessions (progress tracking) ----------
create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  activity text not null check (activity in ('flashcards', 'quiz', 'reading')),
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists study_sessions_user_id_idx on public.study_sessions (user_id, created_at);

-- ============ Row Level Security ============
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.materials enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.study_sessions enable row level security;

create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);

create policy "subjects: all own" on public.subjects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "topics: all own" on public.topics for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "materials: all own" on public.materials for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "flashcards: all own" on public.flashcards for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quizzes: all own" on public.quizzes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quiz_questions: all own via quiz" on public.quiz_questions for all
  using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid()))
  with check (exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid()));

create policy "quiz_attempts: all own" on public.quiz_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quiz_answers: all own via attempt" on public.quiz_answers for all
  using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

create policy "study_sessions: all own" on public.study_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- storage bucket for uploaded study material files
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

create policy "materials bucket: user can manage own folder"
  on storage.objects for all
  using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

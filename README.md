# Estadi

Upload your notes, organize them by subject, drill with flashcards, generate
AI quizzes from what you wrote, and see exactly which topics need more work.

**Stack:** Next.js 14 (App Router) · React · TypeScript · Tailwind CSS ·
Supabase (Postgres, Auth, Storage) · Zod · Google Gemini API (free tier —
quiz generation) · Framer Motion · next-themes

## Features

- **Subjects** — organize everything by course/subject, color-coded.
- **Notes** — paste text or attach a file per subject; notes can be tagged with a topic.
- **Flashcards** — front/back cards reviewed on a simplified SM-2 spaced-repetition
  schedule (`src/lib/utils.ts` → `scheduleReview`).
- **AI quiz generation** — pick a note, Estadi sends its content to Claude and
  gets back multiple-choice questions, each tagged with a topic label.
- **Weak-topic tracking** — every quiz answer is recorded against its topic;
  the Progress page rolls this up into per-topic accuracy and flags anything
  under 70%.
- **Study progress** — quiz history and accuracy at a glance.
- **File upload with automatic reading** — attach a PDF, DOCX, TXT, or MD file
  to a note and Estadi extracts the text automatically, so you don't have to
  paste it in by hand before generating a quiz or flashcards from it.
- **AI flashcard generation** — same free Gemini pipeline as quiz generation,
  but produces front/back flashcard pairs instead of multiple-choice
  questions, tagged with topics the same way.
- **Daily streaks with escalating rewards** — a visible flame counter tracks
  consecutive days of activity (quiz, flashcard, or check-in). The daily
  bonus grows the longer the streak runs (2 → 5 → 8 → 12 → 20 pts/day).
  Missing exactly one day auto-consumes a "streak saver" instead of resetting
  the streak — everyone gets 3 free savers a week, and extra ones are
  purchasable with points.
- **Friends leaderboard** — add friends by email, then compare weekly and
  monthly points earned (not lifetime totals, so a slow starter can st  ill
  win a given week).
- **Functional perks** — spend points mid-quiz on a 50/50 hint or a retry on
  a question you got wrong, not just cosmetics.
- **Daily mood check-in** — a 30-second face + stress-slider check-in, one per
  day, shown on the dashboard until completed.
- **Stress journal** — the optional note on a check-in becomes a journal entry,
  browsable on the Wellbeing → Journal tab.
- **Self-care recommendations** — a small rule-based library
  (`src/lib/data/self-care.ts`) picks 3 activities based on your latest mood
  and stress reading — no AI call needed for this one.
- **Weekly mood report** — a combined mood/stress chart plus a trend summary
  ("Mood improving/declining/steady/unstable") over the last 7–14 days.
- **Light, dark, and pink themes** — the toggle (sun/moon/heart icon) cycles
  through all three, with the choice persisted across visits. Light and dark
  follow the system preference until manually overridden; pink is a
  manual-only third option with a soft pink-and-white palette and a vivid
  magenta accent.
- **Subtle motion throughout** — a real 3D flip on flashcards, crossfading tab
  content, a sliding active-tab/nav indicator, and gentle entrance/tap
  animations, all kept minimal rather than showy.
- **Mobile-friendly** — a bottom tab bar and top header replace the sidebar
  below the `md` breakpoint; forms, grids, and the mood check-in reflow for
  narrow screens.
- **Points** — earn 10 points for every correct quiz answer, 3–6 for a
  flashcard review depending on how well you recalled it, and 5 for your
  first check-in of the day, each with a floating "+N" popup and a running
  session counter.
- **Rewards** — a rank system with fun academic titles (Freshman → Scholar
  Emeritus) that levels up as points accumulate, plus a shop where points
  unlock alternate accent color themes (Ocean, Forest, Rose, Violet) for the
  whole app.

## Project structure

```
src/
  app/
    (dashboard)/          protected routes: dashboard, subjects, wellbeing, progress
    actions/               server actions (subjects, materials, flashcards, quizzes, mood)
    auth/callback/          OAuth + email confirmation handler
    login/, signup/         auth pages
  components/              UI, grouped by feature
  lib/
    supabase/               browser / server / middleware Supabase clients
    validations/            Zod schemas
    ai/quiz-generator.ts    Anthropic call + response validation
    types/database.types.ts hand-written types matching the schema
    utils.ts                SM-2 scheduler, date/class helpers
supabase/migrations/0001_init.sql   full schema + RLS policies
```

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the files in `supabase/migrations/` **in order**
   (0001 through 0007). Together they create every table, enable Row Level
   Security with per-user policies, add a `materials` storage bucket for file
   uploads, a trigger that creates a `profiles` row on signup, the points
   system (earn/spend functions + a ledger for time-windowed leaderboards),
   the daily streak system, and the friends/leaderboard functions.
3. **Enable Google OAuth**: Authentication → Providers → Google. You'll need a
   Google Cloud OAuth client (Authorized redirect URI:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`). Supabase's docs
   walk through this: https://supabase.com/docs/guides/auth/social-login/auth-google
4. Email/password sign-in is on by default (Authentication → Providers → Email).
5. Copy your Project URL, anon key, and service role key from
   Project Settings → API.

## 2. Get a free Gemini API key

Quiz generation calls Google's Gemini API, which has a genuinely free tier —
no credit card required. Create a key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey) and keep it
server-side — it's only ever used inside a server action
(`src/lib/ai/quiz-generator.ts`), never exposed to the browser. The app uses
`gemini-2.5-flash`, which as of writing has a free daily quota generous enough
for normal personal use; check
[ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing)
for current limits, and swap the model string in that file if Google
renames or retires it later.

## 3. Local development

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY

npm install
npm run dev
```

Visit `http://localhost:3000`.

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same environment variables from `.env.local` in
   Project Settings → Environment Variables.
4. Set `NEXT_PUBLIC_SITE_URL` to your production URL, and add
   `https://<your-vercel-domain>/auth/callback` as an additional redirect URL
   in Supabase Auth → URL Configuration.
5. Deploy.

## Notes on what's scaffolded vs. what you'll want to extend

- **Flashcard topic tagging** currently has to be set manually when creating a
  card, or inherited if you generate cards from a quiz-tagged topic later —
  there's no auto-tagging of manually written flashcards yet.
- **File uploads** are stored in Supabase Storage but their content isn't
  extracted into `materials.content` automatically (e.g. no PDF text
  extraction yet) — quizzes are generated from the typed/pasted note content.
  A natural next step is a server action that extracts text from an uploaded
  file and appends it to `content`.
- **Study streak / daily activity** isn't tracked yet beyond `study_sessions`
  existing in the schema — wire up session logging in the flashcard/quiz flows
  if you want streaks on the dashboard.
- The quiz generator calls `gemini-2.5-flash`; swap the model string in
  `src/lib/ai/quiz-generator.ts` if Google changes free-tier availability or
  you'd rather use a different model (e.g. `gemini-2.5-flash-lite` for a
  higher daily request quota at slightly lower quality).
- **Mood check-ins are one per day** (enforced by a unique constraint on
  `user_id, entry_date`) — submitting again the same day updates that day's
  entry rather than creating a new one.
- **Self-care recommendations are rule-based**, not AI-generated, so they're
  instant and free to compute. If you want them personalized further, swap
  `recommendSelfCare` in `src/lib/data/self-care.ts` for an AI call the same
  way `quiz-generator.ts` does.
- There's no reminder/notification system yet to nudge a daily check-in beyond
  the dashboard prompt — a good candidate for a scheduled Supabase Edge
  Function + email/push if you want it.
- **Theme** follows system preference by default and is stored client-side by
  `next-themes` (a `theme` value in `localStorage`, not synced to Supabase) —
  if you want it to persist per-account across devices, store it on `profiles`
  instead.
- **Animations** use Framer Motion for interactive moments (flashcard flip,
  tab transitions, tap feedback) and plain CSS keyframes (`animate-fade-in-up`,
  `animate-scale-in` in `tailwind.config.ts`) for page-load entrances, so most
  of the app has zero added JS animation cost.
- **Points are earned from quizzes, flashcards, and daily check-ins** via the
  `increment_points` Postgres function so totals can't be spoofed from the
  client. Flashcard points scale with recall quality (`pointsForGrade` in
  `src/app/actions/flashcards.ts`); daily check-in points only fire on the
  first check-in of a given day (`src/app/actions/mood.ts`), not on edits.
- **The rewards shop is accent-color-only for now** (rank titles + 4
  unlockable themes in `src/lib/data/rewards.ts`). The `unlock_theme`
  Postgres function is atomic and re-validates cost/balance server-side, so
  it's safe to add more purchasable items the same way — a new theme is just
  a new entry in `ACCENT_THEMES` plus a `.theme-{id}` CSS block in
  `globals.css`.
- **Mobile nav is a fixed 5-item bottom bar** (Dashboard, Subjects, Wellbeing,
  Progress, Rewards) matching the desktop sidebar's sections — if you add a
  6th top-level route later, consider moving overflow items into a "More" tab
  instead of extending the bar further.
- **File text extraction covers PDF, DOCX, TXT, and MD** (`src/lib/files/extract-text.ts`).
  Scanned/image-only PDFs won't extract any text since there's no OCR step —
  the note still saves, but with a warning telling the user to paste the text
  manually. Other file types (images, pptx, xlsx, etc.) get the same warning
  rather than failing the upload.
- **Extracted text is capped at 50,000 characters** per file to keep AI
  requests and database rows reasonable; longer documents get truncated, not
  rejected.
- **The rewards shop, leaderboard, and friends list now live together** in a
  3-tab `/rewards` page (`src/components/rewards/rewards-hub.tsx`) rather than
  as separate nav items, to keep the sidebar/mobile bar at 5 items.
- **Streaks are "any qualifying activity" based** — a quiz answer, a
  flashcard review, or a mood check-in all call `recordDailyActivity` in
  `src/app/actions/streaks.ts`, which is idempotent per calendar day (calling
  it multiple times the same day is harmless). The escalating bonus schedule
  and streak-saver logic live in `src/lib/data/streaks.ts` and the
  `record_streak_activity` Postgres function — change one, keep the other in
  sync if you tune the schedule.
- **Streak savers auto-apply** — there's no "use a saver?" prompt; if exactly
  one day was missed and a saver is available, it's consumed automatically
  and the streak continues. Missing 2+ days always resets it, savers only
  bridge a single missed day.
- **Friends are added by exact email**, looked up via a `SECURITY DEFINER`
  function (`find_user_by_email`) rather than a broader profiles search, so
  no user can browse or enumerate other users — you have to already know the
  email. Pending/accepted friendships and their display names are read
  through `get_friend_requests` for the same reason: the `profiles` table's
  RLS policy still only allows reading your own row directly.
- **Leaderboard ranks by points *earned* in the period**, not net-of-spending
  — so buying a perk with points never hurts your weekly/monthly rank. It
  reads from `points_log`, a ledger written by `increment_points` /
  `spend_points`, not from the running `profiles.points` total.
- **Perk costs live in `PERK_COSTS`** (`src/lib/data/streaks.ts`): 10 pts for
  a quiz hint, 15 for a quiz retry, 30 for an extra streak saver. The hint is
  computed entirely client-side (the correct answer is already present in
  the question data sent to the client for post-answer highlighting), so
  there's nothing server-side to fake there beyond the point spend itself,
  which *is* enforced server-side via `spend_points`.
- **The pink theme is a full mode, not a Rewards-shop accent theme** — it
  lives in `src/app/globals.css` as a `.pink` class toggled on `<html>` by
  `next-themes` (`src/components/theme-toggle.tsx`), separate from the
  `.theme-{id}` accent classes the Rewards shop applies to the dashboard
  wrapper. The two compose: e.g. pink mode + the Ocean accent theme both
  apply, with the accent theme's `--color-amber`/`--color-rust` overriding
  pink's within the dashboard subtree since it's the more deeply nested
  class. Add a fourth full mode the same way — new CSS class, add its name to
  the `themes` array in `src/app/layout.tsx`, add it to `ORDER`/`ICONS`/
  `LABELS` in `theme-toggle.tsx`.

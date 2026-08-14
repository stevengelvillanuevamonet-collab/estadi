import Link from "next/link";
import { Sparkles, Flame, Layers, Library, BookOpen, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewSubjectForm } from "@/components/subjects/new-subject-form";
import { MOOD_EMOJI } from "@/lib/validations/mood";
import { getNextMilestone, getStreakBonus } from "@/lib/data/streaks";
import { IconBadge } from "@/components/ui/icon-badge";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("points, full_name, current_streak, longest_streak, streak_freezes_available")
    .eq("id", user!.id)
    .maybeSingle();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, color")
    .order("created_at", { ascending: false });

  const { count: dueCount } = await supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .lte("due_at", new Date().toISOString());

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todayMood } = await supabase
    .from("mood_entries")
    .select("mood, stress_level")
    .eq("user_id", user!.id)
    .eq("entry_date", todayStr)
    .maybeSingle();

  const { data: recentAttempts } = await supabase
    .from("quiz_attempts")
    .select("id, score, total, completed_at, quizzes(title)")
    .eq("user_id", user!.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(3);

  const firstName = profile?.full_name?.split(" ")[0];
  const streak = profile?.current_streak ?? 0;

  return (
    <div className="mx-auto max-w-4xl animate-fade-in-up space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Hey{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="mt-1 text-ink/60">Here's where things stand today.</p>
        </div>
        <Link
          href="/rewards"
          className="flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3.5 py-1.5 text-sm font-semibold text-amber-dark transition-colors hover:bg-amber/20"
        >
          <Sparkles size={15} />
          {profile?.points ?? 0} pts
        </Link>
      </div>

      {todayMood ? (
        <div className="card flex items-center justify-between p-4">
          <p className="text-sm">
            <span className="mr-2 text-lg">{MOOD_EMOJI[todayMood.mood]}</span>
            Today's check-in is done — stress at {todayMood.stress_level}%.
          </p>
          <Link href="/wellbeing" className="text-sm text-rust underline underline-offset-2">
            View wellbeing
          </Link>
        </div>
      ) : (
        <div className="notebook-page flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <IconBadge icon={Sparkles} color="pink" size="lg" />
            <div>
              <p className="font-medium">How are you feeling today?</p>
              <p className="text-sm text-ink/60">
                A 30-second check-in helps Estadi suggest the right break.
              </p>
            </div>
          </div>
          <Link href="/wellbeing" className="btn-primary shrink-0">
            Daily check-in
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5 transition-transform hover:-translate-y-0.5">
          <IconBadge icon={Flame} color="orange" />
          <p className="mt-3 font-mono text-3xl font-semibold text-orange-500">
            {streak}
            <span className="ml-1 font-body text-sm font-normal text-ink/50">
              {streak === 1 ? "day" : "days"}
            </span>
          </p>
          {(() => {
            const next = getNextMilestone(streak);
            return (
              <p className="mt-1 text-sm text-ink/60">
                +{getStreakBonus(streak)} pts/day
                {next && ` · ${next.days - streak} days to next tier`}
              </p>
            );
          })()}
          <p className="mt-1 text-xs text-ink/40">
            {profile?.streak_freezes_available ?? 0} streak savers left this week
          </p>
        </div>
        <div className="card p-5 transition-transform hover:-translate-y-0.5">
          <IconBadge icon={Layers} color="violet" />
          <p className="mt-3 font-mono text-3xl font-semibold text-violet-500">{dueCount ?? 0}</p>
          <p className="mt-1 text-sm text-ink/60">flashcards waiting across all subjects</p>
        </div>
        <div className="card p-5 transition-transform hover:-translate-y-0.5">
          <IconBadge icon={Library} color="sky" />
          <p className="mt-3 font-mono text-3xl font-semibold text-sky-500">
            {subjects?.length ?? 0}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            <Link href="/progress" className="underline underline-offset-2">
              see your weak topics
            </Link>
          </p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Your subjects</h2>
          <NewSubjectForm />
        </div>
        {subjects && subjects.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/subjects/${s.id}`}
                className="card flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: s.color }}
                >
                  <BookOpen size={16} />
                </span>
                <span className="font-medium">{s.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/60">
            No subjects yet — add your first one to start uploading notes.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Recent quiz results</h2>
        {recentAttempts && recentAttempts.length > 0 ? (
          <div className="space-y-2">
            {recentAttempts.map((a) => {
              const pct = a.total > 0 ? a.score / a.total : 0;
              const color = pct >= 0.8 ? "emerald" : pct >= 0.5 ? "amber" : "rose";
              return (
                <div key={a.id} className="card flex items-center gap-3 p-4">
                  <IconBadge icon={Trophy} color={color} size="sm" />
                  <span className="flex-1 truncate font-medium">
                    {(a as unknown as { quizzes: { title: string } | null }).quizzes?.title ?? "Quiz"}
                  </span>
                  <span className="shrink-0 font-mono text-sm text-ink/70">
                    {a.score}/{a.total}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink/60">No quizzes taken yet.</p>
        )}
      </section>
    </div>
  );
}

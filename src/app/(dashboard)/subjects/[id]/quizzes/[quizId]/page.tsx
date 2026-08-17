import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuizRunner } from "@/components/quizzes/quiz-runner";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("lifetime_points, last_active_date, current_streak, equipped_accessories")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <QuizRunner
        subjectId={id}
        quiz={quiz}
        questions={questions ?? []}
        companion={{
          lifetimePoints: profile?.lifetime_points ?? 0,
          lastActiveDate: profile?.last_active_date ?? null,
          currentStreak: profile?.current_streak ?? 0,
          equippedAccessories: (profile?.equipped_accessories as Record<string, string>) ?? {},
        }}
      />
    </div>
  );
}

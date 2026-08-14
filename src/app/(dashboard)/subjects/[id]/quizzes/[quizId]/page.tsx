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

  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <QuizRunner subjectId={id} quiz={quiz} questions={questions ?? []} />
    </div>
  );
}

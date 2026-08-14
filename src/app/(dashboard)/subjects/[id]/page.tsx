import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubjectHub } from "@/components/subjects/subject-hub";

export default async function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: subject } = await supabase.from("subjects").select("*").eq("id", id).single();
  if (!subject) notFound();

  const [{ data: topics }, { data: materials }, { data: flashcards }, { data: quizzes }] =
    await Promise.all([
      supabase.from("topics").select("*").eq("subject_id", id).order("name"),
      supabase.from("materials").select("*").eq("subject_id", id).order("created_at", { ascending: false }),
      supabase.from("flashcards").select("*").eq("subject_id", id).order("created_at", { ascending: false }),
      supabase.from("quizzes").select("*, quiz_questions(count)").eq("subject_id", id).order("created_at", { ascending: false }),
    ]);

  return (
    <SubjectHub
      subject={subject}
      topics={topics ?? []}
      materials={materials ?? []}
      flashcards={flashcards ?? []}
      quizzes={quizzes ?? []}
    />
  );
}

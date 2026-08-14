import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudySession } from "@/components/flashcards/study-session";

export default async function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: subject } = await supabase.from("subjects").select("id, name").eq("id", id).single();
  if (!subject) notFound();

  const { data: dueCards } = await supabase
    .from("flashcards")
    .select("*")
    .eq("subject_id", id)
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(30);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold">Studying: {subject.name}</h1>
      <StudySession subjectId={id} cards={dueCards ?? []} />
    </div>
  );
}

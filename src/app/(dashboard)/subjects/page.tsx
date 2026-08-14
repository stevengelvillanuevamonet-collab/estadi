import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewSubjectForm } from "@/components/subjects/new-subject-form";
import { DeleteSubjectButton } from "@/components/subjects/delete-subject-button";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, color, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Subjects</h1>
        <NewSubjectForm />
      </div>

      {subjects && subjects.length > 0 ? (
        <ul className="space-y-2">
          {subjects.map((s) => (
            <li key={s.id} className="card flex items-center justify-between p-4">
              <Link href={`/subjects/${s.id}`} className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-medium">{s.name}</span>
              </Link>
              <DeleteSubjectButton subjectId={s.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink/60">
          Nothing here yet. Add a subject to start organizing your notes.
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Material, Quiz } from "@/lib/types/database.types";
import { generateQuiz } from "@/app/actions/quizzes";
import { formatDate } from "@/lib/utils";

type QuizWithCount = Quiz & { quiz_questions: { count: number }[] };

export function QuizzesTab({
  subjectId,
  materials,
  quizzes,
}: {
  subjectId: string;
  materials: Material[];
  quizzes: QuizWithCount[];
}) {
  const router = useRouter();
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [questionCount, setQuestionCount] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    if (!materialId) {
      setError("Add a note first — quizzes are generated from your notes.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await generateQuiz({
        subject_id: subjectId,
        material_id: materialId,
        question_count: questionCount,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="notebook-page space-y-3 p-5">
        <p className="text-sm font-medium">Generate a quiz from your notes</p>
        {materials.length === 0 ? (
          <p className="text-sm text-ink/60">Add a note in the Notes tab first.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label" htmlFor="material">
                Note
              </label>
              <select
                id="material"
                className="input"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="count">
                Questions
              </label>
              <input
                id="count"
                type="number"
                min={3}
                max={30}
                className="input w-20"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
              />
            </div>
            <button onClick={handleGenerate} disabled={isPending} className="btn-primary">
              {isPending ? "Generating…" : "Generate quiz"}
            </button>
          </div>
        )}
        {error && <p className="text-sm text-rust">{error}</p>}
      </div>

      {quizzes.length > 0 ? (
        <div className="space-y-2">
          {quizzes.map((q) => (
            <div key={q.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{q.title}</p>
                <p className="text-xs text-ink/50">
                  {q.quiz_questions?.[0]?.count ?? 0} questions · {formatDate(q.created_at)}
                </p>
              </div>
              {q.status === "ready" && (
                <Link href={`/subjects/${subjectId}/quizzes/${q.id}`} className="btn-secondary">
                  Take quiz
                </Link>
              )}
              {q.status === "generating" && (
                <span className="text-sm text-amber-dark">Generating…</span>
              )}
              {q.status === "failed" && <span className="text-sm text-rust">Failed</span>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink/60">No quizzes yet.</p>
      )}
    </div>
  );
}

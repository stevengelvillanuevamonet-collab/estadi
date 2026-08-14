"use client";

import { useTransition } from "react";
import { deleteSubject } from "@/app/actions/subjects";

export function DeleteSubjectButton({ subjectId }: { subjectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm("Delete this subject and everything in it? This can't be undone.")) return;
        startTransition(async () => {
          await deleteSubject(subjectId);
        });
      }}
      disabled={isPending}
      className="text-sm text-ink/40 hover:text-rust"
    >
      {isPending ? "Removing…" : "Delete"}
    </button>
  );
}

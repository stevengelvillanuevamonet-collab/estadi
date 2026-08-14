"use client";

import { useTransition } from "react";
import type { MoodEntry } from "@/lib/types/database.types";
import { MOOD_EMOJI, MOOD_LABELS } from "@/lib/validations/mood";
import { deleteMoodEntry } from "@/app/actions/mood";
import { formatDate } from "@/lib/utils";

export function StressJournal({ entries }: { entries: MoodEntry[] }) {
  const journaled = entries.filter((e) => e.note && e.note.trim().length > 0);

  if (journaled.length === 0) {
    return (
      <p className="text-sm text-ink/60">
        No journal entries yet. Anything you add to the note field on a check-in shows up here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {journaled.map((entry) => (
        <JournalEntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function JournalEntryCard({ entry }: { entry: MoodEntry }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span>{MOOD_EMOJI[entry.mood]}</span>
            <span className="text-sm font-medium">{MOOD_LABELS[entry.mood]}</span>
            <span className="text-xs text-ink/40">· stress {entry.stress_level}%</span>
          </div>
          <p className="mt-1 text-xs text-ink/50">{formatDate(entry.entry_date)}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">{entry.note}</p>
        </div>
        <button
          onClick={() => {
            if (!confirm("Delete this journal entry?")) return;
            startTransition(async () => {
              await deleteMoodEntry(entry.id);
            });
          }}
          disabled={isPending}
          className="shrink-0 text-xs text-ink/40 hover:text-rust"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

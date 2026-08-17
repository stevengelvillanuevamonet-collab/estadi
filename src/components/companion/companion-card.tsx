"use client";

import { useState, useTransition } from "react";
import { Pencil, Check } from "lucide-react";
import { Capybara } from "@/components/companion/capybara";
import { getCompanionMood, getEvolutionStage, hasBirdCompanion, MOOD_LINES } from "@/lib/data/companion";
import { renamePet } from "@/app/actions/companion";

export function CompanionCard({
  petName,
  lifetimePoints,
  currentStreak,
  lastActiveDate,
  equippedAccessories,
}: {
  petName: string;
  lifetimePoints: number;
  currentStreak: number;
  lastActiveDate: string | null;
  equippedAccessories: Record<string, string>;
}) {
  const [name, setName] = useState(petName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(petName);
  const [isPending, startTransition] = useTransition();

  const stage = getEvolutionStage(lifetimePoints);
  const mood = getCompanionMood(lastActiveDate);
  const bird = hasBirdCompanion(lifetimePoints);

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await renamePet(trimmed);
      if (!result?.error) setName(trimmed);
      setEditing(false);
    });
  }

  return (
    <div className="notebook-page flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:text-left">
      <Capybara stage={stage} mood={mood} equipped={equippedAccessories} hasBird={bird} size={130} />
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center justify-center gap-1.5 sm:justify-start">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              maxLength={24}
              className="input h-7 w-32 px-2 py-0 text-sm font-medium"
            />
            <button onClick={handleSave} disabled={isPending} className="text-ink/50 hover:text-moss">
              <Check size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
            className="group flex items-center justify-center gap-1.5 font-display text-lg font-semibold sm:justify-start"
          >
            {name}
            <Pencil size={12} className="text-ink/30 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
        <p className="mt-0.5 text-sm text-ink/60">{MOOD_LINES[mood](currentStreak)}</p>
      </div>
    </div>
  );
}

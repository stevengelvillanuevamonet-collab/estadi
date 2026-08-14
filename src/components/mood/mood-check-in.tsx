"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Sparkles, Flame } from "lucide-react";
import { submitMoodEntry } from "@/app/actions/mood";
import type { StreakResult } from "@/app/actions/streaks";
import { MOOD_EMOJI, MOOD_LABELS } from "@/lib/validations/mood";
import { cn } from "@/lib/utils";
import type { MoodEntry } from "@/lib/types/database.types";

export function MoodCheckIn({ todayEntry }: { todayEntry: MoodEntry | null }) {
  const [mood, setMood] = useState(todayEntry?.mood ?? 3);
  const [stress, setStress] = useState(todayEntry?.stress_level ?? 40);
  const [note, setNote] = useState(todayEntry?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [streakNotice, setStreakNotice] = useState<StreakResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await submitMoodEntry({ mood, stress_level: stress, note });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setPointsEarned(result?.pointsAwarded ?? 0);
      if (result?.streak?.isNewDay) setStreakNotice(result.streak);
    });
  }

  return (
    <div className="notebook-page animate-fade-in-up space-y-5 p-6">
      <div>
        <p className="label">How are you feeling today?</p>
        <div className="mt-2 flex justify-between gap-1 sm:gap-2">
          {[1, 2, 3, 4, 5].map((m) => (
            <motion.button
              key={m}
              onClick={() => setMood(m)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -2 }}
              animate={mood === m ? { scale: 1.05 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg border py-2.5 text-xl sm:py-3 sm:text-2xl",
                mood === m ? "border-rust bg-rust/10" : "border-margin/60 hover:bg-parchment"
              )}
            >
              <span>{MOOD_EMOJI[m]}</span>
              <span className="text-[10px] font-medium text-ink/60 sm:text-[11px]">{MOOD_LABELS[m]}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="stress">
            Stress level
          </label>
          <span className="font-mono text-sm text-rust">{stress}%</span>
        </div>
        <input
          id="stress"
          type="range"
          min={0}
          max={100}
          value={stress}
          onChange={(e) => setStress(Number(e.target.value))}
          className="w-full accent-rust"
        />
      </div>

      <div>
        <label className="label" htmlFor="note">
          Stress journal — what's on your mind? (optional)
        </label>
        <textarea
          id="note"
          rows={3}
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything you want to get out of your head before you study…"
        />
      </div>

      {error && <p className="text-sm text-rust">{error}</p>}
      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : todayEntry ? "Update check-in" : "Save today's check-in"}
        </button>
        {saved && pointsEarned > 0 && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 text-sm font-medium text-amber-dark"
          >
            <Sparkles size={14} /> +{pointsEarned} pts
          </motion.span>
        )}
        {saved && pointsEarned === 0 && <span className="text-sm text-moss">Saved</span>}
      </div>
      {streakNotice && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-sm font-medium text-rust"
        >
          <Flame size={14} />
          {streakNotice.streakSaved
            ? `Streak saver used — day ${streakNotice.currentStreak} continues`
            : `Day ${streakNotice.currentStreak} streak · +${streakNotice.bonusAwarded} bonus`}
        </motion.p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MoodEntry } from "@/lib/types/database.types";
import { cn } from "@/lib/utils";
import { MoodCheckIn } from "@/components/mood/mood-check-in";
import { MoodWeekStrip } from "@/components/mood/mood-week-strip";
import { SelfCareRecommendations } from "@/components/mood/self-care-recommendations";
import { StressJournal } from "@/components/mood/stress-journal";
import { WeeklyMoodReport } from "@/components/mood/weekly-mood-report";

const TABS = ["Check-in", "Journal", "Weekly report"] as const;

export function WellbeingHub({
  entries,
  todayEntry,
}: {
  entries: MoodEntry[];
  todayEntry: MoodEntry | null;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Check-in");
  const latest = todayEntry ?? entries[0] ?? null;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Wellbeing</h1>
        <p className="mt-1 text-ink/60">
          A quick daily check-in helps Estadi tell you when to push and when to rest.
        </p>
      </div>

      <div className="card p-5">
        <p className="label mb-3">This week</p>
        <MoodWeekStrip entries={entries} />
      </div>

      <div className="flex gap-1 border-b border-margin/50">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "text-ink" : "text-ink/50 hover:text-ink/80"
            )}
          >
            {t}
            {tab === t && (
              <motion.span
                layoutId="wellbeing-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-rust"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "Check-in" && (
            <div className="space-y-6">
              <MoodCheckIn todayEntry={todayEntry} />
              <div>
                <h2 className="mb-3 font-display text-xl font-semibold">Self-care recommendations</h2>
                {latest ? (
                  <SelfCareRecommendations mood={latest.mood} stressLevel={latest.stress_level} />
                ) : (
                  <p className="text-sm text-ink/60">Check in once to get personalized suggestions.</p>
                )}
              </div>
            </div>
          )}

          {tab === "Journal" && <StressJournal entries={entries} />}

          {tab === "Weekly report" && <WeeklyMoodReport entries={entries} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import type { MoodEntry } from "@/lib/types/database.types";
import { MOOD_EMOJI } from "@/lib/validations/mood";

const MOOD_COLORS: Record<number, string> = {
  1: "#B5533C",
  2: "#D68A2E",
  3: "#F0B865",
  4: "#8FAE8F",
  5: "#4B6B53",
};

function lastSevenDays(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function MoodWeekStrip({ entries }: { entries: MoodEntry[] }) {
  const byDate = new Map(entries.map((e) => [e.entry_date, e]));
  const days = lastSevenDays();

  return (
    <div className="flex justify-between gap-2">
      {days.map((dateStr) => {
        const entry = byDate.get(dateStr);
        const label = new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
          weekday: "narrow",
        });
        return (
          <div key={dateStr} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-xs text-ink/40">{label}</span>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-lg"
              style={{
                backgroundColor: entry ? MOOD_COLORS[entry.mood] : "#F1ECE0",
                border: entry ? "none" : "1px dashed #C9C2AE",
              }}
              title={entry ? `Mood ${entry.mood}, stress ${entry.stress_level}%` : "No check-in"}
            >
              {entry ? MOOD_EMOJI[entry.mood] : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

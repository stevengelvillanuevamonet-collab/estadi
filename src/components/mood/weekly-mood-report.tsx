"use client";

import {
  Line,
  Bar,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { MoodEntry } from "@/lib/types/database.types";

function describeMoodTrend(entries: MoodEntry[]): string {
  if (entries.length < 2) return "Not enough check-ins yet";
  const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const half = Math.floor(sorted.length / 2);
  const firstAvg = average(sorted.slice(0, half).map((e) => e.mood));
  const secondAvg = average(sorted.slice(half).map((e) => e.mood));
  const delta = secondAvg - firstAvg;
  if (delta > 0.4) return "Mood improving";
  if (delta < -0.4) return "Mood declining";
  const variance = average(sorted.map((e) => Math.abs(e.mood - average(sorted.map((x) => x.mood)))));
  if (variance > 0.9) return "Mood unstable";
  return "Mood steady";
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function WeeklyMoodReport({ entries }: { entries: MoodEntry[] }) {
  const last7 = entries.slice(0, 7);
  const avgStress = last7.length ? Math.round(average(last7.map((e) => e.stress_level))) : null;
  const trendLabel = describeMoodTrend(last7);

  const chartData = [...entries]
    .slice(0, 14)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    .map((e) => ({
      date: new Date(e.entry_date + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      mood: e.mood,
      stress: e.stress_level,
    }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="label">Last 7 days</p>
          <p className="mt-1 font-display text-xl font-semibold">{trendLabel}</p>
        </div>
        <div className="card p-5">
          <p className="label">Average stress level</p>
          <p className="mt-1 font-mono text-3xl font-semibold text-rust">
            {avgStress !== null ? `${avgStress}%` : "—"}
          </p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="card p-4" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ left: -12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C9C2AE55" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="mood" domain={[1, 5]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="stress" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar yAxisId="stress" dataKey="stress" fill="#F0B86580" radius={[3, 3, 0, 0]} />
              <Line
                yAxisId="mood"
                type="monotone"
                dataKey="mood"
                stroke="#4B6B53"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-ink/60">Check in for a few days to see your weekly report.</p>
      )}
    </div>
  );
}

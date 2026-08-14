"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { LeaderboardRow } from "@/lib/types/database.types";
import { cn } from "@/lib/utils";

const MEDAL = ["🥇", "🥈", "🥉"];

export function LeaderboardTab({
  weekly,
  monthly,
}: {
  weekly: LeaderboardRow[];
  monthly: LeaderboardRow[];
}) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const rows = period === "week" ? weekly : monthly;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-full border border-margin/50 bg-parchment/50 p-1 text-sm">
        {(["week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 font-medium capitalize transition-colors",
              period === p ? "bg-ink text-paper" : "text-ink/60 hover:text-ink"
            )}
          >
            This {p}
          </button>
        ))}
      </div>

      {rows.length <= 1 ? (
        <div className="card p-6 text-center">
          <Trophy size={22} className="mx-auto text-amber" />
          <p className="mt-2 text-sm text-ink/60">
            Add friends in the Friends tab to see how you stack up. Right now it's just you.
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, i) => (
            <motion.li
              key={row.user_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "card flex items-center gap-3 p-3",
                row.is_self && "border-amber/50 bg-amber/5"
              )}
            >
              <span className="w-6 shrink-0 text-center font-mono text-sm text-ink/50">
                {MEDAL[i] ?? i + 1}
              </span>
              <span className={cn("flex-1 truncate text-sm", row.is_self && "font-semibold")}>
                {row.full_name}
                {row.is_self && " (you)"}
              </span>
              <span className="shrink-0 font-mono text-sm font-medium text-amber-dark">
                {row.period_points} pts
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}

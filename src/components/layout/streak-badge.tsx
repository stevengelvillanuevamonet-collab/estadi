import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakBadge({ streak, size = "sm" }: { streak: number; size?: "sm" | "md" }) {
  if (streak <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-orange-300/50 bg-orange-100 font-semibold text-orange-500 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <Flame size={size === "sm" ? 12 : 14} className="fill-orange-300/50" />
      {streak}
    </span>
  );
}

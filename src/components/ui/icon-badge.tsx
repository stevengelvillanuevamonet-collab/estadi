import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const COLOR_STYLES = {
  orange: "bg-orange-100 text-orange-500 dark:bg-orange-500/15 dark:text-orange-300",
  violet: "bg-violet-100 text-violet-500 dark:bg-violet-500/15 dark:text-violet-300",
  sky: "bg-sky-100 text-sky-500 dark:bg-sky-500/15 dark:text-sky-300",
  emerald: "bg-emerald-100 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300",
  pink: "bg-pink-100 text-pink-500 dark:bg-pink-500/15 dark:text-pink-300",
  teal: "bg-teal-100 text-teal-500 dark:bg-teal-500/15 dark:text-teal-300",
} as const;

export type BadgeColor = keyof typeof COLOR_STYLES;

export function IconBadge({
  icon: Icon,
  color,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  color: BadgeColor;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 22 : 18;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        dims,
        COLOR_STYLES[color],
        className
      )}
    >
      <Icon size={iconSize} strokeWidth={2.25} />
    </span>
  );
}

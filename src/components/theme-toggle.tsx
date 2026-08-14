"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const ORDER = ["light", "dark", "pink"] as const;
type Mode = (typeof ORDER)[number];

const ICONS: Record<Mode, typeof Sun> = { light: Sun, dark: Moon, pink: Heart };
const LABELS: Record<Mode, string> = { light: "light", dark: "dark", pink: "pink" };

function nextMode(current: string | undefined): Mode {
  const idx = ORDER.indexOf(current as Mode);
  return ORDER[(idx + 1) % ORDER.length] ?? "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn("h-9 w-9 rounded-lg", className)} aria-hidden />;
  }

  const current = (resolvedTheme as Mode) ?? "light";
  const upcoming = nextMode(current);
  const Icon = ICONS[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(upcoming)}
      aria-label={`Switch to ${LABELS[upcoming]} mode`}
      className={cn(
        "flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-margin/60 bg-parchment/50 text-ink transition-colors hover:bg-parchment active:scale-[0.94]",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          <Icon size={16} className={current === "pink" ? "fill-current" : undefined} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

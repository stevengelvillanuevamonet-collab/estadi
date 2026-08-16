"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Sparkles, Flame, Zap, RotateCcw } from "lucide-react";
import { ACCENT_THEMES, getRank } from "@/lib/data/rewards";
import { PERK_COSTS } from "@/lib/data/streaks";
import { unlockTheme, setActiveTheme } from "@/app/actions/rewards";
import { buyStreakSaver } from "@/app/actions/streaks";
import { cn } from "@/lib/utils";

export function ShopTab({
  points,
  lifetimePoints,
  unlockedThemes,
  activeTheme,
  streakFreezesAvailable,
}: {
  points: number;
  lifetimePoints: number;
  unlockedThemes: string[];
  activeTheme: string;
  streakFreezesAvailable: number;
}) {
  const { current, next, progress } = getRank(lifetimePoints);
  const [unlocked, setUnlocked] = useState(new Set(["default", ...unlockedThemes]));
  const [active, setActive] = useState(activeTheme);
  const [pointsLeft, setPointsLeft] = useState(points);
  const [freezes, setFreezes] = useState(streakFreezesAvailable);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saverPending, startSaverTransition] = useTransition();

  function handleUnlock(themeId: string, cost: number) {
    setError(null);
    setPendingId(themeId);
    startTransition(async () => {
      const result = await unlockTheme(themeId);
      setPendingId(null);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setUnlocked((prev) => new Set(prev).add(themeId));
      setPointsLeft((p) => p - cost);
    });
  }

  function handleSelect(themeId: string) {
    setError(null);
    const previous = active;
    setActive(themeId); // optimistic — feels instant
    startTransition(async () => {
      const result = await setActiveTheme(themeId);
      if (result?.error) {
        setActive(previous);
        setError(result.error);
      }
    });
  }

  function handleBuySaver() {
    setError(null);
    startSaverTransition(async () => {
      const result = await buyStreakSaver();
      if (result?.error) {
        setError(result.error);
        return;
      }
      setFreezes(result.freezesAvailable ?? freezes + 1);
      setPointsLeft((p) => p - PERK_COSTS.streakSaver);
    });
  }

  return (
    <div className="space-y-8">
      <div className="notebook-page p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label">Current rank</p>
            <h2 className="font-display text-2xl font-semibold">{current.name}</h2>
            <p className="text-sm text-ink/60">{current.blurb}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3.5 py-1.5 text-sm font-semibold text-amber-dark">
            <Sparkles size={15} />
            {pointsLeft} pts
          </div>
        </div>

        {next && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-ink/50">
              <span>{current.name}</span>
              <span>{next.name}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-parchment">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-amber"
              />
            </div>
            <p className="mt-1 text-xs text-ink/50">
              {next.threshold - lifetimePoints} pts to {next.name}
            </p>
          </div>
        )}
        <p className="mt-3 text-xs text-ink/40">
          Rank tracks everything you've ever earned — spending on the shop below never lowers it.
        </p>
      </div>

      {error && <p className="text-sm text-rust">{error}</p>}

      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">Perks</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <Flame size={16} className="text-rust" />
            <h3 className="mt-2 font-medium">Streak saver</h3>
            <p className="mt-1 text-sm text-ink/60">
              Protects your streak if you miss a day. You have {freezes} right now (3 refresh
              free each week).
            </p>
            <button
              onClick={handleBuySaver}
              disabled={saverPending || pointsLeft < PERK_COSTS.streakSaver}
              className="btn-secondary mt-3 text-xs disabled:cursor-not-allowed"
            >
              {saverPending ? "Buying…" : `Buy for ${PERK_COSTS.streakSaver} pts`}
            </button>
          </div>
          <div className="card p-4">
            <Zap size={16} className="text-amber-dark" />
            <h3 className="mt-2 font-medium">50/50 hint</h3>
            <p className="mt-1 text-sm text-ink/60">
              Eliminates two wrong options on a quiz question. Use it right from the quiz screen
              for {PERK_COSTS.quizHint} pts.
            </p>
          </div>
          <div className="card p-4">
            <RotateCcw size={16} className="text-moss" />
            <h3 className="mt-2 font-medium">Retry question</h3>
            <p className="mt-1 text-sm text-ink/60">
              Got one wrong? Spend {PERK_COSTS.quizRetry} pts right there to try it again instead
              of moving on.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">Accent themes</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCENT_THEMES.map((theme) => {
            const isUnlocked = unlocked.has(theme.id);
            const isActive = active === theme.id;
            const canAfford = pointsLeft >= theme.cost;
            return (
              <div key={theme.id} className="card p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: theme.swatch[0] }}
                  />
                  <span
                    className="-ml-3 h-5 w-5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: theme.swatch[1] }}
                  />
                  <h3 className="font-medium">{theme.name}</h3>
                  {isActive && <Check size={15} className="ml-auto text-moss" />}
                </div>
                <p className="mt-2 text-sm text-ink/60">{theme.description}</p>
                <div className="mt-3">
                  {isUnlocked ? (
                    <button
                      onClick={() => handleSelect(theme.id)}
                      disabled={isActive || isPending}
                      className={cn("btn-secondary text-xs", isActive && "opacity-50")}
                    >
                      {isActive ? "Active" : "Select"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlock(theme.id, theme.cost)}
                      disabled={!canAfford || isPending}
                      className="btn-primary text-xs disabled:cursor-not-allowed"
                    >
                      {pendingId === theme.id ? (
                        "Unlocking…"
                      ) : (
                        <>
                          <Lock size={12} /> Unlock for {theme.cost} pts
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

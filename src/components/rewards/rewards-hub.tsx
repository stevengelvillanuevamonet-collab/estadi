"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LeaderboardRow } from "@/lib/types/database.types";
import { cn } from "@/lib/utils";
import { ShopTab } from "@/components/rewards/shop-tab";
import { LeaderboardTab } from "@/components/rewards/leaderboard-tab";
import { FriendsTab, type FriendRequestRow } from "@/components/rewards/friends-tab";

const TABS = ["Shop", "Leaderboard", "Friends"] as const;

export function RewardsHub({
  points,
  lifetimePoints,
  unlockedThemes,
  activeTheme,
  streakFreezesAvailable,
  weeklyLeaderboard,
  monthlyLeaderboard,
  friendRequests,
}: {
  points: number;
  lifetimePoints: number;
  unlockedThemes: string[];
  activeTheme: string;
  streakFreezesAvailable: number;
  weeklyLeaderboard: LeaderboardRow[];
  monthlyLeaderboard: LeaderboardRow[];
  friendRequests: FriendRequestRow[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Shop");
  const incomingCount = friendRequests.filter(
    (r) => r.direction === "incoming" && r.status === "pending"
  ).length;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Rewards</h1>
        <p className="mt-1 text-ink/60">
          Earn points from quizzes, flashcards, and daily check-ins — spend them, or see how you
          compare to friends.
        </p>
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
            {t === "Friends" && incomingCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rust text-[10px] font-semibold text-white">
                {incomingCount}
              </span>
            )}
            {tab === t && (
              <motion.span
                layoutId="rewards-tab-underline"
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
          {tab === "Shop" && (
            <ShopTab
              points={points}
              lifetimePoints={lifetimePoints}
              unlockedThemes={unlockedThemes}
              activeTheme={activeTheme}
              streakFreezesAvailable={streakFreezesAvailable}
            />
          )}
          {tab === "Leaderboard" && (
            <LeaderboardTab weekly={weeklyLeaderboard} monthly={monthlyLeaderboard} />
          )}
          {tab === "Friends" && <FriendsTab requests={friendRequests} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

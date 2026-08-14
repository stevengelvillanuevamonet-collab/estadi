"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStreakBonus, PERK_COSTS } from "@/lib/data/streaks";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  streakSaved: boolean;
  isNewDay: boolean;
  bonusAwarded: number;
}

/**
 * Records today's activity for the streak counter and, on a genuinely new
 * day, awards the escalating streak bonus. Safe to call from any
 * point-earning action (quiz answer, flashcard review, mood check-in) —
 * it's idempotent per calendar day.
 */
export async function recordDailyActivity(userId: string): Promise<StreakResult | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("record_streak_activity", { p_user_id: userId });
  if (error) return null;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  let bonusAwarded = 0;
  if (row.is_new_day) {
    bonusAwarded = getStreakBonus(row.current_streak);
    await supabase.rpc("increment_points", {
      p_user_id: userId,
      p_amount: bonusAwarded,
      p_reason: "daily_streak_bonus",
    });
  }

  return {
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    streakSaved: row.streak_saved,
    isNewDay: row.is_new_day,
    bonusAwarded,
  };
}

export async function buyStreakSaver() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { data, error } = await supabase.rpc("buy_streak_saver", {
    p_user_id: user.id,
    p_cost: PERK_COSTS.streakSaver,
  });

  if (error) {
    if (error.message.includes("not enough points")) {
      return { error: "Not enough points yet — keep studying!" };
    }
    return { error: error.message };
  }

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { success: true, freezesAvailable: data as number };
}

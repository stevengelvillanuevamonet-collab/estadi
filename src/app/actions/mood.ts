"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { moodEntrySchema } from "@/lib/validations/mood";
import { recordDailyActivity, type StreakResult } from "@/app/actions/streaks";

const DAILY_CHECK_IN_POINTS = 5;

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/** Creates or updates today's mood check-in (one entry per user per day). */
export async function submitMoodEntry(input: { mood: number; stress_level: number; note?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = moodEntrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid check-in." };

  const today = todayDateString();
  const { data: existing } = await supabase
    .from("mood_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("entry_date", today)
    .maybeSingle();

  const { error } = await supabase.from("mood_entries").upsert(
    {
      user_id: user.id,
      entry_date: today,
      mood: parsed.data.mood,
      stress_level: parsed.data.stress_level,
      note: parsed.data.note || null,
    },
    { onConflict: "user_id,entry_date" }
  );
  if (error) return { error: error.message };

  // Only reward the first check-in of the day, so editing today's entry
  // (or resubmitting) can't be used to farm points.
  let pointsAwarded = 0;
  if (!existing) {
    const { error: pointsError } = await supabase.rpc("increment_points", {
      p_user_id: user.id,
      p_amount: DAILY_CHECK_IN_POINTS,
      p_reason: "daily_checkin",
    });
    if (!pointsError) pointsAwarded = DAILY_CHECK_IN_POINTS;
  }

  const streak: StreakResult | null = await recordDailyActivity(user.id);

  revalidatePath("/dashboard");
  revalidatePath("/wellbeing");
  return { success: true, pointsAwarded, streak };
}

export async function deleteMoodEntry(entryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("mood_entries").delete().eq("id", entryId);
  if (error) return { error: error.message };

  revalidatePath("/wellbeing");
  return { success: true };
}

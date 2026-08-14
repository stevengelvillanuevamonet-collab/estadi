"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTheme } from "@/lib/data/rewards";

export async function unlockTheme(themeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const theme = getTheme(themeId);
  if (theme.id === "default") return { error: "That theme is already unlocked." };

  const { data, error } = await supabase.rpc("unlock_theme", {
    p_user_id: user.id,
    p_theme: theme.id,
    p_cost: theme.cost,
  });

  if (error) {
    if (error.message.includes("not enough points")) {
      return { error: "Not enough points yet — keep studying!" };
    }
    if (error.message.includes("already unlocked")) {
      return { error: "You've already unlocked this theme." };
    }
    return { error: error.message };
  }

  revalidatePath("/rewards");
  const row = Array.isArray(data) ? data[0] : data;
  return { success: true, points: row?.new_points as number | undefined };
}

export async function setActiveTheme(themeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const theme = getTheme(themeId);

  if (theme.id !== "default") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("unlocked_themes")
      .eq("id", user.id)
      .single();
    if (!profile?.unlocked_themes?.includes(theme.id)) {
      return { error: "Unlock this theme before selecting it." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ active_theme: theme.id })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { success: true };
}

import { createClient } from "@/lib/supabase/server";
import { RewardsHub } from "@/components/rewards/rewards-hub";
import type { LeaderboardRow } from "@/lib/types/database.types";

export default async function RewardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: weekly }, { data: monthly }, { data: requests }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "points, lifetime_points, unlocked_themes, active_theme, streak_freezes_available, last_active_date, unlocked_accessories, equipped_accessories"
        )
        .eq("id", user!.id)
        .single(),
      supabase.rpc("get_friend_leaderboard", { p_period: "week" }),
      supabase.rpc("get_friend_leaderboard", { p_period: "month" }),
      supabase.rpc("get_friend_requests"),
    ]);

  return (
    <RewardsHub
      points={profile?.points ?? 0}
      lifetimePoints={profile?.lifetime_points ?? profile?.points ?? 0}
      unlockedThemes={profile?.unlocked_themes ?? []}
      activeTheme={profile?.active_theme ?? "default"}
      streakFreezesAvailable={profile?.streak_freezes_available ?? 0}
      lastActiveDate={profile?.last_active_date ?? null}
      unlockedAccessories={profile?.unlocked_accessories ?? []}
      equippedAccessories={(profile?.equipped_accessories as Record<string, string>) ?? {}}
      weeklyLeaderboard={(weekly ?? []) as LeaderboardRow[]}
      monthlyLeaderboard={(monthly ?? []) as LeaderboardRow[]}
      friendRequests={
        (requests ?? []) as Array<{
          friendship_id: string;
          other_user_id: string;
          other_full_name: string;
          other_avatar_url: string | null;
          status: "pending" | "accepted" | "declined";
          direction: "incoming" | "outgoing";
          created_at: string;
        }>
      }
    />
  );
}

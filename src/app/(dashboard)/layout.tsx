import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_theme, current_streak")
    .eq("id", user.id)
    .maybeSingle();

  const activeTheme = profile?.active_theme ?? "default";
  const currentStreak = profile?.current_streak ?? 0;

  return (
    <div
      className={cn(
        "min-h-screen bg-paper md:flex",
        activeTheme !== "default" && `theme-${activeTheme}`
      )}
    >
      <Sidebar email={user.email ?? null} streak={currentStreak} />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader streak={currentStreak} />
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-5 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

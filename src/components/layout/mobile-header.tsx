"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { StreakBadge } from "@/components/layout/streak-badge";

export function MobileHeader({ streak }: { streak: number }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-margin/50 bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="font-display text-lg font-semibold">
          Estadi
        </Link>
        <StreakBadge streak={streak} />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-margin/60 bg-parchment/50 text-ink transition-colors hover:bg-parchment active:scale-[0.94]"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

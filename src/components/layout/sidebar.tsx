"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, HeartPulse, BarChart3, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { StreakBadge } from "@/components/layout/streak-badge";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Home, color: "text-sky-500" },
  { href: "/subjects", label: "Subjects", icon: BookOpen, color: "text-violet-500" },
  { href: "/wellbeing", label: "Wellbeing", icon: HeartPulse, color: "text-rose-500" },
  { href: "/progress", label: "Progress", icon: BarChart3, color: "text-emerald-500" },
  { href: "/rewards", label: "Rewards", icon: Award, color: "text-amber-500" },
];

export function Sidebar({ email, streak }: { email: string | null; streak: number }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden h-screen w-56 shrink-0 flex-col border-r border-margin/50 bg-parchment/40 px-4 py-6 md:flex">
      <div className="mb-8 flex items-center justify-between px-2">
        <Link href="/dashboard" className="font-display text-xl font-semibold">
          Estadi
        </Link>
        <ThemeToggle />
      </div>
      {streak > 0 && (
        <div className="mb-4 px-2">
          <StreakBadge streak={streak} size="md" />
        </div>
      )}
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "text-ink" : "text-ink/60 hover:text-ink"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-lg bg-amber/20"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <Icon size={16} className={cn("relative shrink-0", link.color, !active && "opacity-60")} />
              <span className="relative">{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-margin/50 pt-4">
        {email && <p className="truncate px-2 text-xs text-ink/40">{email}</p>}
        <button onClick={handleSignOut} className="mt-2 w-full px-2 text-left text-sm text-rust">
          Sign out
        </button>
      </div>
    </aside>
  );
}

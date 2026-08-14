"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, HeartPulse, BarChart3, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: Home, color: "text-sky-500" },
  { href: "/subjects", label: "Subjects", icon: BookOpen, color: "text-violet-500" },
  { href: "/wellbeing", label: "Wellbeing", icon: HeartPulse, color: "text-rose-500" },
  { href: "/progress", label: "Progress", icon: BarChart3, color: "text-emerald-500" },
  { href: "/rewards", label: "Rewards", icon: Award, color: "text-amber-500" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-margin/50 bg-paper/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium"
          >
            {active && (
              <motion.span
                layoutId="mobile-nav-active"
                className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-rust"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <Icon size={20} className={cn(link.color, !active && "opacity-50")} />
            <span className={cn(active ? "text-ink" : "text-ink/50")}>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

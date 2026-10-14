"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";

// Desktop-only sidebar. The mobile experience deliberately mirrors banking
// apps (see bottom-nav.tsx), but a phone-sized column stretched across a
// desktop viewport serves nobody — this gives wide screens a real app shell.
export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <div className="px-2">
        <p className="font-display text-sm text-gold-dark">Business Insight</p>
        <p className="mt-0.5 text-xs text-body">AI-powered SME BI</p>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-navy" : "text-body hover:bg-canvas hover:text-ink"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-navy-light"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} className="relative" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-body hover:bg-canvas hover:text-ink"
      >
        <LogOut size={18} strokeWidth={1.8} />
        Log out
      </button>
    </aside>
  );
}

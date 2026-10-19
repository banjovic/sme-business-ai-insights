"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LogOut, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";
import { useGetBusinessQuery } from "@/store/api";

export function SidebarNav() {
  const pathname = usePathname();
  const { data: business } = useGetBusinessQuery();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    // Hard navigate to clear Redux in-memory cache and cookies cleanly
    window.location.href = "/login";
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

      <div className="border-t border-line pt-4 space-y-3">
        {business && (
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy">
              <Building2 size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{business.name}</p>
              <p className="truncate text-[11px] text-body">{business.sector}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-canvas hover:text-ink transition-colors"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Log out
        </button>
      </div>
    </aside>
  );
}

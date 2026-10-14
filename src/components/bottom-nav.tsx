"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";

// A bottom tab bar on mobile — mirroring the mobile money/banking apps
// (Moniepoint, OPay, etc.) that this platform's target users already know
// how to use, lowering the interface-learning barrier flagged in Chapter 2's
// adoption literature. On larger screens this gives way to a sidebar
// (see sidebar-nav.tsx) so the desktop view isn't a stretched phone screen.
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={cn("relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium", active ? "text-navy" : "text-body")}>
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-gold"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

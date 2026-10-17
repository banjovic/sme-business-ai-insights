"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";

function ClerkAccount() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded || !isSignedIn) return null;
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <UserButton afterSignOutUrl="/login" />
      <p className="truncate text-xs font-medium text-ink">
        {user.fullName || user.primaryEmailAddress?.emailAddress}
      </p>
    </div>
  );
}

function ClerkSidebar() {
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();
  return <SidebarContent account={<ClerkAccount />} onSignOut={isSignedIn ? () => signOut() : undefined} />;
}

export function SidebarNav() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? <ClerkSidebar />
    : <SidebarContent />;
}

function SidebarContent({ account, onSignOut }: { account?: React.ReactNode; onSignOut?: () => Promise<unknown> }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await onSignOut?.();
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

      <div className="border-t border-line pt-4 space-y-2">
        {account}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-canvas hover:text-ink"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Log out
        </button>
      </div>
    </aside>
  );
}

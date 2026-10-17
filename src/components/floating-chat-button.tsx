"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, MessageSquareText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function FloatingChatButton() {
  const pathname = usePathname();

  // Hide the floating button when already on the chat page
  if (pathname === "/chat") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-20 right-4 z-40 lg:bottom-8 lg:right-8"
      >
        <Link
          href="/chat"
          className="group flex items-center gap-2.5 rounded-full border border-gold/30 bg-navy px-4 py-3 text-white shadow-popover transition-all hover:border-gold hover:bg-navy-dark hover:shadow-xl active:scale-95"
          aria-label="Ask AI about your business"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gold text-ink shadow-sm transition-transform group-hover:scale-110">
            <Sparkles size={15} className="animate-pulse" />
          </span>
          <div className="flex flex-col text-left">
            <span className="font-display text-xs font-semibold tracking-wide text-gold">
              Ask AI
            </span>
            <span className="hidden text-[10px] text-white/80 sm:inline">
              Chat with business
            </span>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, TrendingDown, HelpCircle, MessagesSquare, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGetInsightsQuery } from "@/store/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const SEVERITY_STYLES: Record<string, { border: string; iconBg: string; Icon: typeof AlertTriangle }> = {
  critical: { border: "border-l-alert-red", iconBg: "bg-alert-red", Icon: AlertTriangle },
  warning: { border: "border-l-alert-amber", iconBg: "bg-alert-amber", Icon: TrendingDown },
  info: { border: "border-l-gold", iconBg: "bg-gold", Icon: HelpCircle },
};

const TYPE_LABEL: Record<string, string> = {
  stockout: "Stockout Risk",
  slow_period: "Slow-Selling Period",
  anomaly: "Unusual Spending",
  summary: "Today's Summary",
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: insights, isLoading } = useGetInsightsQuery();

  const summary = insights?.find((i) => i.type === "summary");
  const alerts = insights?.filter((i) => i.type !== "summary") ?? [];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="px-5 pb-8 pt-8 lg:px-8 lg:pt-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-sm text-gold-dark">Good to see you</p>
          <h1 className="font-display text-2xl font-medium text-ink lg:text-3xl">Your Business Today</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button aria-label="Log out" className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-body hover:bg-canvas lg:hidden">
              <LogOut size={18} />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log out?</DialogTitle>
              <DialogDescription>You&apos;ll need to sign back in to see your business data.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={logout}>Log out</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      )}

      {!isLoading && alerts.length === 0 && !summary && (
        <p className="mt-8 text-[15px] text-body">No activity logged yet. Head to the Log tab to record your first sale, stock item, or expense.</p>
      )}

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <AnimatePresence>
          {alerts.map((insight, idx) => {
            const style = SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.warning;
            const Icon = style.Icon;
            return (
              <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }}>
                <Card className={`h-full border-l-4 ${style.border} transition-shadow hover:shadow-popover`}>
                  <CardContent className="flex gap-3 pt-4">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}>
                      <Icon size={16} className="text-white" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{TYPE_LABEL[insight.type] ?? insight.type}</p>
                      <p className="mt-0.5 text-[14px] leading-snug text-body">{insight.message}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="mt-5 rounded-lg bg-navy p-4 text-white lg:p-6">
          <p className="font-display text-base font-medium">Today&apos;s Summary</p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-white/85">{summary.message}</p>
        </motion.div>
      )}

      <Link href="/chat" className="mt-5 block lg:inline-block lg:w-auto">
        <Button variant="accent" size="lg" className="w-full lg:w-auto lg:px-8">
          <MessagesSquare size={18} />
          Ask about your business
        </Button>
      </Link>
    </div>
  );
}

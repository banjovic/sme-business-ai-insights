"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
  Receipt,
  HelpCircle,
  MessagesSquare,
  LogOut,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetBusinessQuery,
  useGetInsightsQuery,
  useGetSalesQuery,
  useGetStockItemsQuery,
  useGetExpensesQuery,
} from "@/store/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatNaira } from "@/lib/utils";
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

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatShortDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (isSameDay(d, now)) return "Today";
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const { data: business } = useGetBusinessQuery();
  const { data: insights, isLoading: isInsightsLoading } = useGetInsightsQuery();
  const { data: sales, isLoading: isSalesLoading } = useGetSalesQuery();
  const { data: stockItems, isLoading: isStockLoading } = useGetStockItemsQuery();
  const { data: expenses, isLoading: isExpensesLoading } = useGetExpensesQuery();

  const isMetricsLoading = isSalesLoading || isStockLoading || isExpensesLoading;

  const summary = insights?.find((i) => i.type === "summary");
  const alerts = insights?.filter((i) => i.type !== "summary") ?? [];

  // Compute Sales Metrics
  const salesMetrics = useMemo(() => {
    if (!sales || sales.length === 0) return { total: 0, todayTotal: 0, count: 0 };
    const now = new Date();
    let total = 0;
    let todayTotal = 0;
    for (const s of sales) {
      total += s.amount;
      if (isSameDay(new Date(s.date), now)) {
        todayTotal += s.amount;
      }
    }
    return { total, todayTotal, count: sales.length };
  }, [sales]);

  // Compute Stock / Inventory Metrics
  const stockMetrics = useMemo(() => {
    if (!stockItems || stockItems.length === 0) {
      return { totalUnits: 0, productCount: 0, lowStockItems: [], sortedItems: [] };
    }
    let totalUnits = 0;
    const lowStockItems = [];
    for (const item of stockItems) {
      totalUnits += item.quantityOnHand;
      if (item.quantityOnHand <= item.reorderPoint) {
        lowStockItems.push(item);
      }
    }
    // Sort low stock items to the top for the snapshot
    const sortedItems = [...stockItems].sort((a, b) => {
      const aLow = a.quantityOnHand <= a.reorderPoint ? 1 : 0;
      const bLow = b.quantityOnHand <= b.reorderPoint ? 1 : 0;
      return bLow - aLow;
    });

    return {
      totalUnits,
      productCount: stockItems.length,
      lowStockItems,
      sortedItems,
    };
  }, [stockItems]);

  // Compute Expense Metrics
  const expenseMetrics = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { total: 0, todayTotal: 0, count: 0, topCategory: null };
    }
    const now = new Date();
    let total = 0;
    let todayTotal = 0;
    const categoryTotals: Record<string, number> = {};
    for (const e of expenses) {
      total += e.amount;
      if (isSameDay(new Date(e.date), now)) {
        todayTotal += e.amount;
      }
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }
    let topCategory = null;
    let topAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > topAmount) {
        topAmount = amt;
        topCategory = cat;
      }
    }
    return { total, todayTotal, count: expenses.length, topCategory };
  }, [expenses]);

  const netCashFlow = salesMetrics.total - expenseMetrics.total;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="px-5 pb-8 pt-8 lg:px-8 lg:pt-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-sm text-gold-dark">Good to see you</p>
          <h1 className="font-display text-2xl font-medium text-ink lg:text-3xl">
            {business?.name || "Your Business Today"}
          </h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button
              aria-label="Log out"
              className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-body hover:bg-canvas lg:hidden"
            >
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
              <Button variant="destructive" onClick={logout}>
                Log out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* SECTION 1: At-a-glance Metric Cards */}
      {isMetricsLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Sales Card */}
            <Card className="transition-all hover:border-teal/40 hover:shadow-card">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-body">Total Sales</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pearl-aqua/20 text-swatch-dark-teal">
                    <TrendingUp size={16} />
                  </span>
                </div>
                <div className="mt-2">
                  <p className="font-display text-2xl font-semibold text-ink">
                    {formatNaira(salesMetrics.total)}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-body">
                    {salesMetrics.todayTotal > 0 ? (
                      <span className="font-medium text-swatch-dark-teal">
                        +{formatNaira(salesMetrics.todayTotal)} today
                      </span>
                    ) : (
                      <span>{salesMetrics.count} sales logged</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock / Inventory Card */}
            <Card className="transition-all hover:border-teal/40 hover:shadow-card">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-body">Inventory</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-light text-navy">
                    <Package size={16} />
                  </span>
                </div>
                <div className="mt-2">
                  <p className="font-display text-2xl font-semibold text-ink">
                    {stockMetrics.totalUnits}{" "}
                    <span className="text-base font-normal text-body">units</span>
                  </p>
                  <div className="mt-1.5 flex items-center">
                    {stockMetrics.lowStockItems.length > 0 ? (
                      <Badge variant="warning" className="gap-1 px-2 py-0 text-[11px] font-medium">
                        <AlertTriangle size={11} />
                        {stockMetrics.lowStockItems.length} low on stock
                      </Badge>
                    ) : (
                      <Badge variant="success" className="gap-1 px-2 py-0 text-[11px] font-medium">
                        <CheckCircle2 size={11} />
                        {stockMetrics.productCount} products healthy
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses Card */}
            <Card className="transition-all hover:border-teal/40 hover:shadow-card">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-body">Total Expenses</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-light text-alert-amber">
                    <Receipt size={16} />
                  </span>
                </div>
                <div className="mt-2">
                  <p className="font-display text-2xl font-semibold text-ink">
                    {formatNaira(expenseMetrics.total)}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-body">
                    {expenseMetrics.topCategory ? (
                      <span className="truncate">
                        Top: <strong className="font-medium text-ink">{expenseMetrics.topCategory}</strong>
                      </span>
                    ) : (
                      <span>{expenseMetrics.count} expenses logged</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Net Flow Strip */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-canvas/70 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-body">Net Operating Balance:</span>
              <span
                className={`font-semibold tabular ${
                  netCashFlow >= 0 ? "text-swatch-dark-teal" : "text-alert-red"
                }`}
              >
                {netCashFlow >= 0 ? "+" : ""}
                {formatNaira(netCashFlow)}
              </span>
              <span className="hidden text-[11px] text-body/75 sm:inline">(Sales minus Expenses)</span>
            </div>
            <Link
              href="/log"
              className="flex items-center gap-1 font-medium text-teal hover:text-teal-dark"
            >
              Log transactions <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* SECTION 2: Business Snapshot (Tabs for Sales, Stock, Expenses) */}
      <div className="mt-7">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-base font-medium text-ink">Business Activity Snapshot</h2>
          <Link href="/log" className="flex items-center gap-1 text-xs font-medium text-teal hover:underline">
            View full log <ArrowRight size={12} />
          </Link>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
            <TabsTrigger value="sales">Recent Sales</TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-1.5">
              Stock Watch
              {stockMetrics.lowStockItems.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-alert-amber text-[10px] font-bold text-white">
                  {stockMetrics.lowStockItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
          </TabsList>

          <Card className="mt-3">
            <CardContent className="pt-4">
              {/* Sales Tab */}
              <TabsContent value="sales" className="mt-0 space-y-2.5">
                {isSalesLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : !sales || sales.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-body">No sales logged yet.</p>
                    <Link href="/log">
                      <Button variant="outline" size="sm" className="mt-2 text-xs">
                        Record your first sale
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-line/60">
                    {sales.slice(0, 4).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                        <div>
                          <p className="font-medium text-ink">{sale.itemName}</p>
                          <p className="text-xs text-body">
                            Qty: {sale.quantitySold} • {formatShortDate(sale.date)}
                          </p>
                        </div>
                        <span className="font-medium text-swatch-dark-teal tabular">
                          +{formatNaira(sale.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Stock Tab */}
              <TabsContent value="stock" className="mt-0 space-y-2.5">
                {isStockLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : !stockItems || stockItems.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-body">No stock items added yet.</p>
                    <Link href="/log">
                      <Button variant="outline" size="sm" className="mt-2 text-xs">
                        Add inventory item
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-line/60">
                    {stockMetrics.sortedItems.slice(0, 4).map((item) => {
                      const isLow = item.quantityOnHand <= item.reorderPoint;
                      return (
                        <div key={item.id} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                          <div>
                            <p className="font-medium text-ink">{item.name}</p>
                            <p className="text-xs text-body">
                              Reorder at {item.reorderPoint} • Unit: {formatNaira(item.unitPrice)}
                            </p>
                          </div>
                          <div>
                            {isLow ? (
                              <Badge variant="warning" className="gap-1 text-xs font-medium">
                                <AlertTriangle size={11} /> {item.quantityOnHand} left
                              </Badge>
                            ) : (
                              <Badge variant="neutral" className="text-xs font-medium">
                                {item.quantityOnHand} in stock
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="mt-0 space-y-2.5">
                {isExpensesLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : !expenses || expenses.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-body">No expenses logged yet.</p>
                    <Link href="/log">
                      <Button variant="outline" size="sm" className="mt-2 text-xs">
                        Record an expense
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-line/60">
                    {expenses.slice(0, 4).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                        <div>
                          <p className="font-medium text-ink">{expense.category}</p>
                          <p className="text-xs text-body">{formatShortDate(expense.date)}</p>
                        </div>
                        <span className="font-medium text-alert-red tabular">
                          -{formatNaira(expense.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      {/* SECTION 3: AI Insights & Strategic Recommendations */}
      <div className="mt-8">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-gold" />
          <h2 className="font-display text-lg font-medium text-ink">AI Insights & Advisory</h2>
        </div>
        <p className="mt-0.5 text-xs text-body">
          Automated intelligence generated from your operational transactions
        </p>

        {isInsightsLoading && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        )}

        {!isInsightsLoading && alerts.length === 0 && !summary && (
          <p className="mt-4 text-[14px] text-body">
            No active AI alerts. Log more transactions to see automated risk detection and forecasts.
          </p>
        )}

        {/* Alert Cards */}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <AnimatePresence>
            {alerts.map((insight, idx) => {
              const style = SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.warning;
              const Icon = style.Icon;
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card
                    className={`h-full border-l-4 ${style.border} transition-shadow hover:shadow-popover`}
                  >
                    <CardContent className="flex gap-3 pt-4">
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
                      >
                        <Icon size={16} className="text-white" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {TYPE_LABEL[insight.type] ?? insight.type}
                        </p>
                        <p className="mt-0.5 text-[14px] leading-snug text-body">{insight.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Today's Summary Banner */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mt-4 rounded-lg bg-navy p-4 text-white lg:p-6"
          >
            <p className="font-display text-base font-medium">Today&apos;s Summary</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/85">{summary.message}</p>
          </motion.div>
        )}

        {/* CTA to Chat */}
        <Link href="/chat" className="mt-5 block lg:inline-block lg:w-auto">
          <Button variant="accent" size="lg" className="w-full lg:w-auto lg:px-8">
            <MessagesSquare size={18} />
            Ask about your business
          </Button>
        </Link>
      </div>
    </div>
  );
}

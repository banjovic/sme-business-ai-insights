// Plain-Language Insight Generation Engine
// ------------------------------------------
// Design basis: Chapter 3 (Fig. 3.2 "AI/Machine Learning Layer" +
// "Plain-Language Insight Generation Engine") and Chapter 4, Section 4.5.3.
// Runs the three predictive models against a business's logged activity,
// converts their structured output into short natural-language alerts, and
// persists them to the Insight table so the dashboard and conversational
// interface can both read from the same source of truth.

import { prisma } from "@/lib/prisma";
import { predictStockouts, type StockItemWithSales } from "@/lib/ai/stockout";
import { detectSlowPeriods } from "@/lib/ai/slowPeriod";
import { detectAnomalousExpenses } from "@/lib/ai/anomaly";

export async function generateAndPersistInsights(businessId: string) {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: {
      stockItems: { include: { sales: true } },
      expenses: true,
    },
  });

  const now = new Date();
  const newInsights: { type: string; severity: string; message: string; meta?: string }[] = [];

  const stockItems: StockItemWithSales[] = business.stockItems.map((item: any) => ({
    id: item.id,
    name: item.name,
    quantityOnHand: item.quantityOnHand,
    reorderPoint: item.reorderPoint,
    sales: item.sales.map((s: any) => ({ quantitySold: s.quantitySold, date: s.date })),
  }));
  const stockoutResults = predictStockouts(stockItems, now);
  for (const r of stockoutResults) {
    if (r.riskLevel !== "none") {
      newInsights.push({
        type: "stockout",
        severity: r.riskLevel === "critical" ? "critical" : "warning",
        message: r.message,
        meta: JSON.stringify({ itemId: r.itemId, daysOfStockLeft: r.daysOfStockLeft }),
      });
    }
  }

  for (const item of business.stockItems) {
    const result = detectSlowPeriods(
      item.name,
      item.sales.map((s: any) => ({ quantitySold: s.quantitySold, amount: 0, date: s.date })),
      now
    );
    if (result.isSlow) {
      newInsights.push({
        type: "slow_period",
        severity: "warning",
        message: result.message,
        meta: JSON.stringify({ itemId: item.id, percentOfBaseline: result.percentOfBaseline }),
      });
    }
  }

  const anomalyResults = detectAnomalousExpenses(
    business.expenses.map((e: any) => ({ id: e.id, category: e.category, amount: e.amount, date: e.date }))
  );
  for (const r of anomalyResults) {
    if (r.isAnomalous) {
      newInsights.push({
        type: "anomaly",
        severity: "warning",
        message: r.message,
        meta: JSON.stringify({ expenseId: r.expenseId, zScore: r.zScore }),
      });
    }
  }

  const critical = newInsights.filter((i) => i.severity === "critical").length;
  const warnings = newInsights.filter((i) => i.severity === "warning").length;
  let summary: string;
  if (newInsights.length === 0) {
    summary = "Everything looks steady today — no stockout risks, slow patches, or unusual spending detected.";
  } else {
    const parts: string[] = [];
    if (critical > 0) parts.push(`${critical} item${critical > 1 ? "s need" : " needs"} urgent restocking`);
    if (warnings > 0) parts.push(`${warnings} other thing${warnings > 1 ? "s" : ""} worth a look`);
    summary = `Heads up: ${parts.join(" and ")} today. See the alerts below for details.`;
  }
  newInsights.push({ type: "summary", severity: "info", message: summary });

  await prisma.$transaction([
    prisma.insight.deleteMany({ where: { businessId } }),
    prisma.insight.createMany({ data: newInsights.map((i) => ({ ...i, businessId })) }),
  ]);

  return prisma.insight.findMany({
    where: { businessId },
    orderBy: [{ severity: "asc" }, { generatedAt: "desc" }],
  });
}

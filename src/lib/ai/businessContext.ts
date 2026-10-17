// Business Context Aggregator
// -----------------------------
// Extracts an operational snapshot of a business (inventory, 7-day sales velocities,
// stockout risk alerts, slow periods, total expenditure, expense categories, and anomalies)
// to ground the LLM in the firm's real data and prevent hallucination.

import { prisma } from "@/lib/prisma";
import { predictStockouts, type StockItemWithSales } from "./stockout";
import { detectSlowPeriods } from "./slowPeriod";
import { detectAnomalousExpenses } from "./anomaly";

export type BusinessSnapshot = {
  businessName: string;
  sector: string;
  location: string;
  total7DayRevenue: number;
  total7DayUnits: number;
  itemPerformance: {
    id: string;
    name: string;
    unitsSold7d: number;
    revenue7d: number;
    currentStock: number;
    unitPrice: number;
    reorderPoint: number;
  }[];
  stockoutAlerts: { itemName: string; message: string; riskLevel: string; daysOfStockLeft: number | null }[];
  slowPeriods: { itemName: string; message: string }[];
  totalExpenses: number;
  expenseByCategory: Record<string, number>;
  recentExpenses: { category: string; amount: number; date: string }[];
  anomalies: { category: string; amount: number; message: string }[];
};

export async function getBusinessSnapshot(businessId: string): Promise<BusinessSnapshot> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: {
      stockItems: { include: { sales: true } },
      expenses: { orderBy: { date: "desc" } },
    },
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Stock & Stockout predictions
  const stockItems: StockItemWithSales[] = business.stockItems.map((item: any) => ({
    id: item.id,
    name: item.name,
    quantityOnHand: item.quantityOnHand,
    reorderPoint: item.reorderPoint,
    sales: item.sales.map((s: any) => ({ quantitySold: s.quantitySold, date: s.date })),
  }));
  const stockoutResults = predictStockouts(stockItems, now);
  const stockoutAlerts = stockoutResults
    .filter((r) => r.riskLevel !== "none")
    .map((r) => ({
      itemName: r.itemName,
      message: r.message,
      riskLevel: r.riskLevel,
      daysOfStockLeft: r.daysOfStockLeft,
    }));

  // 2. Recent sales & velocities
  let total7DayRevenue = 0;
  let total7DayUnits = 0;
  const itemPerformance = business.stockItems.map((item: any) => {
    const recentSales = item.sales.filter((s: any) => new Date(s.date) >= sevenDaysAgo);
    const units = recentSales.reduce((acc: number, s: any) => acc + s.quantitySold, 0);
    const revenue = recentSales.reduce((acc: number, s: any) => acc + s.amount, 0);
    total7DayRevenue += revenue;
    total7DayUnits += units;
    return {
      id: item.id,
      name: item.name,
      unitsSold7d: units,
      revenue7d: revenue,
      currentStock: item.quantityOnHand,
      unitPrice: item.unitPrice,
      reorderPoint: item.reorderPoint,
    };
  });

  // 3. Slow periods
  const slowPeriods = business.stockItems
    .map((item: any) =>
      detectSlowPeriods(
        item.name,
        item.sales.map((s: any) => ({ quantitySold: s.quantitySold, amount: s.amount, date: s.date })),
        now
      )
    )
    .filter((r: any) => r.isSlow)
    .map((r: any) => ({ itemName: r.itemName, message: r.message }));

  // 4. Expenses & Anomalies
  const totalExpenses = business.expenses.reduce((acc: number, e: any) => acc + e.amount, 0);
  const expenseByCategory: Record<string, number> = {};
  for (const e of business.expenses) {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  }
  const anomalies = detectAnomalousExpenses(
    business.expenses.map((e: any) => ({ id: e.id, category: e.category, amount: e.amount, date: e.date }))
  )
    .filter((r) => r.isAnomalous)
    .map((r) => ({ category: r.category, amount: r.amount, message: r.message }));

  const recentExpenses = business.expenses.slice(0, 5).map((e: any) => ({
    category: e.category,
    amount: e.amount,
    date: new Date(e.date).toLocaleDateString("en-NG"),
  }));

  return {
    businessName: business.name,
    sector: business.sector,
    location: business.location,
    total7DayRevenue,
    total7DayUnits,
    itemPerformance,
    stockoutAlerts,
    slowPeriods,
    totalExpenses,
    expenseByCategory,
    recentExpenses,
    anomalies,
  };
}

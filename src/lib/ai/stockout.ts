// Stockout Prediction Model
// -------------------------
// Design basis: Chapter 3, Section 3.6.3. Framed as estimating whether a
// stock item will fall to/below a safety threshold within a forecast
// horizon. Consistent with Liu, Kalaitzi, Wang & Papanagnou (2025), the
// primary signals used are CURRENT STOCK LEVEL and RECENT (short-window)
// SALES VELOCITY rather than long historical series, since early-stage SME
// users of the platform will have limited transaction history.

export type StockItemWithSales = {
  id: string;
  name: string;
  quantityOnHand: number;
  reorderPoint: number;
  sales: { quantitySold: number; date: Date }[];
};

export type StockoutResult = {
  itemId: string;
  itemName: string;
  dailyVelocity: number;
  daysOfStockLeft: number | null;
  riskLevel: "critical" | "warning" | "none";
  message: string;
};

const FORECAST_WINDOW_DAYS = 7;
const CRITICAL_DAYS_THRESHOLD = 3;
const WARNING_DAYS_THRESHOLD = 7;

export function predictStockouts(items: StockItemWithSales[], asOf: Date = new Date()): StockoutResult[] {
  const windowStart = new Date(asOf);
  windowStart.setDate(windowStart.getDate() - FORECAST_WINDOW_DAYS);

  return items.map((item) => {
    const recentSales = item.sales.filter((s) => s.date >= windowStart && s.date <= asOf);
    const totalSoldInWindow = recentSales.reduce((sum, s) => sum + s.quantitySold, 0);
    const dailyVelocity = totalSoldInWindow / FORECAST_WINDOW_DAYS;

    let daysOfStockLeft: number | null = null;
    let riskLevel: StockoutResult["riskLevel"] = "none";
    let message = `${item.name} is adequately stocked based on recent sales.`;

    if (dailyVelocity > 0) {
      daysOfStockLeft = item.quantityOnHand / dailyVelocity;
      if (daysOfStockLeft <= CRITICAL_DAYS_THRESHOLD) {
        riskLevel = "critical";
        message = `${item.name} may run out in about ${Math.max(0, Math.round(daysOfStockLeft))} day(s) at the current sales pace.`;
      } else if (daysOfStockLeft <= WARNING_DAYS_THRESHOLD) {
        riskLevel = "warning";
        message = `${item.name} has roughly ${Math.round(daysOfStockLeft)} days of stock left — worth reordering soon.`;
      }
    } else if (item.quantityOnHand <= item.reorderPoint) {
      riskLevel = "warning";
      message = `${item.name} is at or below its reorder point (${item.reorderPoint} units).`;
    }

    return {
      itemId: item.id,
      itemName: item.name,
      dailyVelocity: Number(dailyVelocity.toFixed(2)),
      daysOfStockLeft: daysOfStockLeft === null ? null : Number(daysOfStockLeft.toFixed(1)),
      riskLevel,
      message,
    };
  });
}

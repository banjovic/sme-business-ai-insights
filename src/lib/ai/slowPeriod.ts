// Slow-Selling Period Detection Model
// ------------------------------------
// Design basis: Chapter 3, Section 3.6.3. Compares a recent window of sales
// against an item's own historical baseline — a lightweight, SME-appropriate
// substitute for the safety-stock/demand-forecasting techniques discussed
// in the literature, which assume more data history than an early-stage
// SME user is likely to have logged.

export type SaleForTrend = { quantitySold: number; amount: number; date: Date };

export type SlowPeriodResult = {
  itemName: string;
  recentTotal: number;
  baselineAverage: number;
  percentOfBaseline: number | null;
  isSlow: boolean;
  message: string;
};

const RECENT_WINDOW_DAYS = 7;
const BASELINE_WINDOWS = 4;
const SLOW_THRESHOLD_PCT = 60;

export function detectSlowPeriods(
  itemName: string,
  sales: SaleForTrend[],
  asOf: Date = new Date()
): SlowPeriodResult {
  const recentStart = new Date(asOf);
  recentStart.setDate(recentStart.getDate() - RECENT_WINDOW_DAYS);

  const recentTotal = sales
    .filter((s) => s.date >= recentStart && s.date <= asOf)
    .reduce((sum, s) => sum + s.quantitySold, 0);

  const baselineTotals: number[] = [];
  for (let w = 1; w <= BASELINE_WINDOWS; w++) {
    const end = new Date(recentStart);
    end.setDate(end.getDate() - (w - 1) * RECENT_WINDOW_DAYS);
    const start = new Date(end);
    start.setDate(start.getDate() - RECENT_WINDOW_DAYS);
    const total = sales
      .filter((s) => s.date >= start && s.date < end)
      .reduce((sum, s) => sum + s.quantitySold, 0);
    baselineTotals.push(total);
  }

  const validBaselines = baselineTotals.filter((t) => t > 0);
  const baselineAverage =
    validBaselines.length > 0
      ? validBaselines.reduce((a, b) => a + b, 0) / validBaselines.length
      : 0;

  let percentOfBaseline: number | null = null;
  let isSlow = false;
  let message = `${itemName} sales are tracking close to their usual pace.`;

  if (baselineAverage > 0) {
    percentOfBaseline = (recentTotal / baselineAverage) * 100;
    if (percentOfBaseline <= SLOW_THRESHOLD_PCT) {
      isSlow = true;
      message = `${itemName} sales are about ${Math.round(100 - percentOfBaseline)}% below their usual pace this week.`;
    }
  }

  return {
    itemName,
    recentTotal,
    baselineAverage: Number(baselineAverage.toFixed(1)),
    percentOfBaseline: percentOfBaseline === null ? null : Number(percentOfBaseline.toFixed(1)),
    isSlow,
    message,
  };
}

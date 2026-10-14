// Unusual Spending (Anomaly) Detection Model
// -------------------------------------------
// Design basis: Chapter 3, Section 3.6.3. Each new expense is compared
// against the business's own historical spending distribution *for that
// category*, using a simple z-score threshold — a statistically
// interpretable baseline appropriate for the limited data volumes expected
// from an early-stage SME user.

export type ExpenseForAnomaly = { id: string; category: string; amount: number; date: Date };

export type AnomalyResult = {
  expenseId: string;
  category: string;
  amount: number;
  categoryMean: number;
  categoryStdDev: number;
  zScore: number | null;
  isAnomalous: boolean;
  message: string;
};

const Z_SCORE_THRESHOLD = 2.0;
const MIN_HISTORY_FOR_STATS = 3;

export function detectAnomalousExpenses(expenses: ExpenseForAnomaly[]): AnomalyResult[] {
  const byCategory = new Map<string, ExpenseForAnomaly[]>();
  for (const e of [...expenses].sort((a, b) => a.date.getTime() - b.date.getTime())) {
    const list = byCategory.get(e.category) ?? [];
    list.push(e);
    byCategory.set(e.category, list);
  }

  const results: AnomalyResult[] = [];

  for (const [category, list] of byCategory) {
    for (let i = 0; i < list.length; i++) {
      const current = list[i];
      const history = list.slice(0, i);

      if (history.length < MIN_HISTORY_FOR_STATS) {
        results.push({
          expenseId: current.id, category, amount: current.amount,
          categoryMean: 0, categoryStdDev: 0, zScore: null, isAnomalous: false,
          message: `Not enough history in "${category}" yet to judge whether this is unusual.`,
        });
        continue;
      }

      const mean = history.reduce((sum, e) => sum + e.amount, 0) / history.length;
      const variance = history.reduce((sum, e) => sum + (e.amount - mean) ** 2, 0) / history.length;
      const stdDev = Math.sqrt(variance);

      let zScore: number | null = null;
      let isAnomalous = false;
      let message = `This "${category}" expense is in line with usual spending.`;

      if (stdDev > 0) {
        zScore = (current.amount - mean) / stdDev;
        if (zScore >= Z_SCORE_THRESHOLD) {
          isAnomalous = true;
          const multiple = (current.amount / mean).toFixed(1);
          message = `This "${category}" expense (₦${current.amount.toLocaleString()}) is about ${multiple}× the usual amount — worth a second look.`;
        }
      } else if (current.amount > mean * 1.5 && mean > 0) {
        isAnomalous = true;
        message = `This "${category}" expense is notably higher than every previous entry in this category.`;
      }

      results.push({
        expenseId: current.id, category, amount: current.amount,
        categoryMean: Number(mean.toFixed(2)), categoryStdDev: Number(stdDev.toFixed(2)),
        zScore: zScore === null ? null : Number(zScore.toFixed(2)), isAnomalous, message,
      });
    }
  }

  return results;
}

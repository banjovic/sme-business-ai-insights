// Conversational Query Engine
// -----------------------------
// Design basis: Chapter 3, Section 3.6.4, and Chapter 4, Section 4.5.5.
// The design calls for: (1) interpreting a user's natural-language question
// to extract intent and entities, (2) mapping that intent onto one of a
// defined set of underlying analytics functions, and (3) converting the
// result back into a short, plain-language response.
//
// IMPLEMENTATION NOTE: Step (1) uses an LLM via a constrained, function-calling
// interface (see llmIntent.ts) when ANTHROPIC_API_KEY is configured. When no key
// is set, or the call fails, it falls back to the keyword/pattern classifier
// below, over the same fixed set of intents. Everything downstream is decoupled
// from how the intent was extracted.

import { prisma } from "@/lib/prisma";
import { predictStockouts, type StockItemWithSales } from "@/lib/ai/stockout";
import { detectSlowPeriods } from "@/lib/ai/slowPeriod";
import { detectAnomalousExpenses } from "@/lib/ai/anomaly";
import { classifyIntentLLM } from "@/lib/ai/llmIntent";

export type Intent =
  | "stockout_check"
  | "slow_period_check"
  | "anomaly_check"
  | "sales_summary"
  | "greeting"
  | "unknown";

const INTENT_PATTERNS: { intent: Intent; patterns: RegExp[] }[] = [
  { intent: "stockout_check", patterns: [/run(ning)? out/i, /stock ?out/i, /restock/i, /low on stock/i, /about to (run|finish)/i] },
  { intent: "slow_period_check", patterns: [/slow/i, /quiet/i, /down this (week|month)/i, /sales? (drop|fall|decline)/i] },
  { intent: "anomaly_check", patterns: [/unusual/i, /strange/i, /weird/i, /suspicious/i, /expense/i, /spending/i, /spend/i] },
  { intent: "sales_summary", patterns: [/how (are|is) (sales|business|things)/i, /summary/i, /today/i, /how.*doing/i] },
  { intent: "greeting", patterns: [/^\s*(hi|hello|hey|good (morning|afternoon|evening))\s*[!.]?\s*$/i] },
];

export function classifyIntent(question: string): Intent {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(question))) return intent;
  }
  return "unknown";
}

// Uses the LLM classifier when ANTHROPIC_API_KEY is set; otherwise (or if the
// API call fails/times out) falls back to the offline regex classifier, so the
// prototype always stays runnable.
export async function resolveIntent(question: string): Promise<Intent> {
  const llmIntent = await classifyIntentLLM(question);
  return llmIntent ?? classifyIntent(question);
}

export async function answerQuestion(businessId: string, question: string): Promise<{ answer: string; intent: Intent }> {
  const intent = await resolveIntent(question);
  const now = new Date();

  switch (intent) {
    case "stockout_check": {
      const business = await prisma.business.findUniqueOrThrow({
        where: { id: businessId },
        include: { stockItems: { include: { sales: true } } },
      });
      const items: StockItemWithSales[] = business.stockItems.map((item: any) => ({
        id: item.id, name: item.name, quantityOnHand: item.quantityOnHand, reorderPoint: item.reorderPoint,
        sales: item.sales.map((s: any) => ({ quantitySold: s.quantitySold, date: s.date })),
      }));
      const results = predictStockouts(items, now).filter((r) => r.riskLevel !== "none");
      const answer = results.length === 0
        ? "Nothing looks close to running out right now — stock levels are healthy against recent sales."
        : results.map((r) => r.message).join(" ");
      return { answer, intent };
    }

    case "slow_period_check": {
      const business = await prisma.business.findUniqueOrThrow({
        where: { id: businessId },
        include: { stockItems: { include: { sales: true } } },
      });
      const slowOnes = business.stockItems
        .map((item: any) =>
          detectSlowPeriods(item.name, item.sales.map((s: any) => ({ quantitySold: s.quantitySold, amount: 0, date: s.date })), now)
        )
        .filter((r: any) => r.isSlow);
      const answer = slowOnes.length === 0
        ? "No — sales across your items are tracking close to their usual pace."
        : slowOnes.map((r: any) => r.message).join(" ");
      return { answer, intent };
    }

    case "anomaly_check": {
      const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId }, include: { expenses: true } });
      const anomalies = detectAnomalousExpenses(
        business.expenses.map((e: any) => ({ id: e.id, category: e.category, amount: e.amount, date: e.date }))
      ).filter((r) => r.isAnomalous);
      const answer = anomalies.length === 0
        ? "Nothing unusual — your recent expenses are all within their normal range."
        : anomalies.map((r) => r.message).join(" ");
      return { answer, intent };
    }

    case "sales_summary": {
      const latestSummary = await prisma.insight.findFirst({
        where: { businessId, type: "summary" },
        orderBy: { generatedAt: "desc" },
      });
      const answer = latestSummary?.message ?? "I don't have a summary yet — log a few sales, stock, and expense entries and check back.";
      return { answer, intent };
    }

    case "greeting":
      return { answer: "Hello! Ask me about stock levels, slow-selling periods, or unusual spending.", intent };

    default:
      return {
        answer: "I can help with three things right now: items close to running out, whether sales have been slow, and any unusual spending. Try asking about one of those.",
        intent,
      };
  }
}

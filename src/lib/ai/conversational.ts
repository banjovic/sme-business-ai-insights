// Conversational Query Engine
// -----------------------------
// Design basis: Chapter 3, Section 3.6.4, and Chapter 4, Section 4.5.5.
// Grounded In-Context Conversational Intelligence:
// 1. Fetches a live operational snapshot of the business.
// 2. If GEMINI_API_KEY (or ANTHROPIC_API_KEY) is configured, calls the LLM with
//    full in-context business data, allowing unconstrained, intuitive questions.
// 3. If no key is set or the API call fails, falls back to a rich deterministic
//    semantic responder that answers item-specific, revenue, expense, and restock questions.

import { getBusinessSnapshot, type BusinessSnapshot } from "./businessContext";
import { askLLMAssistant } from "./llmAssistant";

export type Intent =
  | "stockout_check"
  | "slow_period_check"
  | "anomaly_check"
  | "sales_summary"
  | "item_inquiry"
  | "expense_inquiry"
  | "business_advice"
  | "greeting"
  | "llm_grounded"
  | "unknown"
  | "general";

function analyzeDeterministically(snapshot: BusinessSnapshot, question: string): { answer: string; intent: Intent } {
  const q = question.toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|how far|kedu|bawo|sannu)\b/i.test(q)) {
    return {
      answer: `Hello! I'm your business assistant for ${snapshot.businessName}. You can ask me anything about your stock, weekly sales, expense breakdown, or what to reorder today.`,
      intent: "greeting",
    };
  }

  // 2. Specific item stock inquiries
  const matchedItem = snapshot.itemPerformance.find((item) =>
    q.includes(item.name.toLowerCase()) ||
    (q.includes("rice") && item.name.toLowerCase().includes("rice")) ||
    (q.includes("oil") && item.name.toLowerCase().includes("oil")) ||
    (q.includes("milk") && item.name.toLowerCase().includes("milk")) ||
    (q.includes("detergent") && item.name.toLowerCase().includes("detergent"))
  );

  if (matchedItem && (q.includes("stock") || q.includes("left") || q.includes("many") || q.includes("price") || q.includes("how much") || q.includes("unit"))) {
    const alert = snapshot.stockoutAlerts.find((a) => a.itemName === matchedItem.name);
    const alertNote = alert ? ` ⚠️ Alert: ${alert.message}` : " Stock level is currently healthy.";
    return {
      answer: `You currently have ${matchedItem.currentStock} units of ${matchedItem.name} in stock (₦${matchedItem.unitPrice.toLocaleString()} each). In the last 7 days, you sold ${matchedItem.unitsSold7d} units generating ₦${matchedItem.revenue7d.toLocaleString()}.${alertNote}`,
      intent: "item_inquiry",
    };
  }

  // 3. Top selling / Highest revenue item
  if (q.includes("top selling") || q.includes("best") || q.includes("highest") || q.includes("sell pass") || q.includes("most")) {
    const sortedByRevenue = [...snapshot.itemPerformance].sort((a, b) => b.revenue7d - a.revenue7d);
    const topItem = sortedByRevenue[0];
    if (topItem && topItem.revenue7d > 0) {
      return {
        answer: `Your highest-revenue item over the past 7 days is ${topItem.name}, bringing in ₦${topItem.revenue7d.toLocaleString()} (${topItem.unitsSold7d} units sold). You currently have ${topItem.currentStock} units remaining in stock.`,
        intent: "sales_summary",
      };
    }
  }

  // 4. Stockout & Restock inquiries
  if (/run(ning)? out/i.test(q) || /stock ?out/i.test(q) || /restock/i.test(q) || /low on stock/i.test(q) || /about to (run|finish)/i.test(q) || /wetin i suppose buy/i.test(q)) {
    if (snapshot.stockoutAlerts.length === 0) {
      return {
        answer: "Nothing looks close to running out right now — your stock levels are healthy against recent sales velocity.",
        intent: "stockout_check",
      };
    }
    const critical = snapshot.stockoutAlerts.filter((a) => a.riskLevel === "critical");
    const warnings = snapshot.stockoutAlerts.filter((a) => a.riskLevel === "warning");
    const parts: string[] = [];
    if (critical.length > 0) {
      parts.push(`Urgent: ${critical.map((c) => c.message).join(" ")}`);
    }
    if (warnings.length > 0) {
      parts.push(`Reorder soon: ${warnings.map((w) => w.message).join(" ")}`);
    }
    return {
      answer: parts.join("\n\n"),
      intent: "stockout_check",
    };
  }

  // 5. Sales performance & "How is business"
  if (/how (are|is) (sales|business|market|things)/i.test(q) || /revenue/i.test(q) || /total sales/i.test(q) || /summary/i.test(q) || /doing/i.test(q)) {
    const topItem = [...snapshot.itemPerformance].sort((a, b) => b.revenue7d - a.revenue7d)[0];
    const topNote = topItem ? ` Top performer was ${topItem.name} (₦${topItem.revenue7d.toLocaleString()}).` : "";
    const slowNote = snapshot.slowPeriods.length > 0 ? ` Note that ${snapshot.slowPeriods.map((s) => s.itemName).join(", ")} is selling slower than usual.` : "";
    return {
      answer: `Over the past 7 days, your total sales revenue reached ₦${snapshot.total7DayRevenue.toLocaleString()} across ${snapshot.total7DayUnits} items sold.${topNote}${slowNote}`,
      intent: "sales_summary",
    };
  }

  // 6. Slow period inquiry
  if (/slow/i.test(q) || /quiet/i.test(q) || /down this (week|month)/i.test(q) || /drop|fall|decline/i.test(q)) {
    if (snapshot.slowPeriods.length === 0) {
      return {
        answer: "Good news — all your items are currently selling near or above their usual pace.",
        intent: "slow_period_check",
      };
    }
    return {
      answer: `Sales slowdown detected: ${snapshot.slowPeriods.map((s) => s.message).join(" ")} Consider running a weekend discount or bundling to move stock.`,
      intent: "slow_period_check",
    };
  }

  // 7. Expenses & Unusual spending
  if (/unusual/i.test(q) || /strange/i.test(q) || /weird/i.test(q) || /suspicious/i.test(q) || /expense/i.test(q) || /spending/i.test(q) || /cost/i.test(q) || /spend/i.test(q)) {
    const breakdown = Object.entries(snapshot.expenseByCategory)
      .map(([cat, amt]) => `${cat}: ₦${amt.toLocaleString()}`)
      .join(", ");
    const anomalyMsg = snapshot.anomalies.length > 0
      ? ` 🚨 Flagged anomaly: ${snapshot.anomalies.map((a) => a.message).join(" ")}`
      : " All expenses appear within their normal statistical range.";

    return {
      answer: `Total recorded expenses are ₦${snapshot.totalExpenses.toLocaleString()} (${breakdown}).${anomalyMsg}`,
      intent: snapshot.anomalies.length > 0 ? "anomaly_check" : "expense_inquiry",
    };
  }

  // 8. Business advice / strategy
  if (/advice|tips|help|improve|grow|profit/i.test(q)) {
    const criticalItem = snapshot.stockoutAlerts.find((a) => a.riskLevel === "critical");
    const slowItem = snapshot.slowPeriods[0];
    const tips: string[] = [];
    if (criticalItem) {
      tips.push(`Prioritize restocking ${criticalItem.itemName} immediately to prevent lost sales.`);
    }
    if (slowItem) {
      tips.push(`Address slow sales on ${slowItem.itemName} with promotional pricing or better shelf placement.`);
    }
    if (snapshot.anomalies.length > 0) {
      tips.push(`Investigate recent anomalous spending in ${snapshot.anomalies[0].category} to protect cash flow.`);
    }
    if (tips.length === 0) {
      tips.push("Your operations are well-balanced right now. Focus on customer retention and keeping regular inventory logs.");
    }
    return {
      answer: `Actionable suggestions for ${snapshot.businessName}:\n` + tips.map((t, idx) => `${idx + 1}. ${t}`).join("\n"),
      intent: "business_advice",
    };
  }

  // 9. Default flexible summary
  return {
    answer: `Here is a quick snapshot of ${snapshot.businessName}: Past 7-day revenue is ₦${snapshot.total7DayRevenue.toLocaleString()} (${snapshot.total7DayUnits} items sold), with ₦${snapshot.totalExpenses.toLocaleString()} in total expenses. ${snapshot.stockoutAlerts.length > 0 ? `⚠️ Alert: ${snapshot.stockoutAlerts[0].message}` : "Stock is currently stable."} Feel free to ask about any specific item, sales trends, or costs!`,
    intent: "general",
  };
}

export async function answerQuestion(
  businessId: string,
  question: string
): Promise<{ answer: string; intent: string }> {
  // 1. Fetch live operational snapshot
  const snapshot = await getBusinessSnapshot(businessId);

  // 2. If Gemini or Claude API key is configured, get an unconstrained, intuitive answer
  const llmReply = await askLLMAssistant(snapshot, question);
  if (llmReply) {
    return { answer: llmReply, intent: "llm_grounded" };
  }

  // 3. Fallback to rich deterministic semantic responder
  return analyzeDeterministically(snapshot, question);
}

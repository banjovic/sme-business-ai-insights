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

  // Helper to detect if question is likely in Pidgin
  const isPidgin = /dey|wetin|sup|fit|make we|sharp-sharp|oga|abeg|choke|market|na so|kpa|kobo|palava|no be|wahala/i.test(q);

  // 1. Greetings
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|how far|kedu|bawo|sannu|wetin dey sup|how you dey)\b/i.test(q)) {
    return {
      answer: isPidgin
        ? `How far my partner! I dey here to help you monitor everything for ${snapshot.businessName}. You fit ask me about your stock, weekly sales, expenses wey choke, or wetin you suppose restock sharp-sharp.`
        : `Hello! I'm your business assistant for ${snapshot.businessName}. You can ask me anything about your stock, weekly sales, expense breakdown, or what to reorder today.`,
      intent: "greeting",
    };
  }

  // 2. Specific item stock inquiries
  const matchedItem = snapshot.itemPerformance.find((item) =>
    q.includes(item.name.toLowerCase()) ||
    (q.includes("rice") && item.name.toLowerCase().includes("rice")) ||
    (q.includes("oil") && item.name.toLowerCase().includes("oil")) ||
    (q.includes("milk") && item.name.toLowerCase().includes("milk")) ||
    (q.includes("detergent") && item.name.toLowerCase().includes("detergent")) ||
    (q.includes("sugar") && item.name.toLowerCase().includes("sugar"))
  );

  if (matchedItem && (q.includes("stock") || q.includes("left") || q.includes("many") || q.includes("price") || q.includes("how much") || q.includes("unit") || q.includes("remain"))) {
    const alert = snapshot.stockoutAlerts.find((a) => a.itemName === matchedItem.name);
    const alertNote = alert ? ` ⚠️ Alert: ${alert.message}` : " Stock level is currently healthy.";
    return {
      answer: isPidgin
        ? `You get ${matchedItem.currentStock} units of ${matchedItem.name} left for shop (₦${matchedItem.unitPrice.toLocaleString()} each). For the past 7 days, you sell ${matchedItem.unitsSold7d} units, total na ₦${matchedItem.revenue7d.toLocaleString()}.${alertNote}`
        : `You currently have ${matchedItem.currentStock} units of ${matchedItem.name} in stock (₦${matchedItem.unitPrice.toLocaleString()} each). In the last 7 days, you sold ${matchedItem.unitsSold7d} units generating ₦${matchedItem.revenue7d.toLocaleString()}.${alertNote}`,
      intent: "item_inquiry",
    };
  }

  // 3. Top selling / Highest revenue item
  if (q.includes("top selling") || q.includes("best") || q.includes("highest") || q.includes("sell pass") || q.includes("most") || q.includes("dey move pass")) {
    const sortedByRevenue = [...snapshot.itemPerformance].sort((a, b) => b.revenue7d - a.revenue7d);
    const topItem = sortedByRevenue[0];
    if (topItem && topItem.revenue7d > 0) {
      return {
        answer: isPidgin
          ? `The item wey dey ginger sales pass for your shop for the past 7 days na ${topItem.name}! E bring in ₦${topItem.revenue7d.toLocaleString()} (${topItem.unitsSold7d} units sold). Right now, you get ${topItem.currentStock} units remaining for shelf.`
          : `Your highest-revenue item over the past 7 days is ${topItem.name}, bringing in ₦${topItem.revenue7d.toLocaleString()} (${topItem.unitsSold7d} units sold). You currently have ${topItem.currentStock} units remaining in stock.`,
        intent: "sales_summary",
      };
    }
  }

  // 4. Stockout & Restock inquiries
  if (/run(ning)? out/i.test(q) || /stock ?out/i.test(q) || /restock/i.test(q) || /low on stock/i.test(q) || /about to (run|finish)/i.test(q) || /wetin i suppose buy/i.test(q) || /finish/i.test(q)) {
    if (snapshot.stockoutAlerts.length === 0) {
      return {
        answer: isPidgin
          ? "No stock dey worry right now! All your goods dey adequate compared to how people dey buy am."
          : "Nothing looks close to running out right now — your stock levels are healthy against recent sales velocity.",
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

  // 5. Business advice, next steps, action items, or growth strategy
  if (/advice|tips|help|improve|grow|profit|suppose do|first|suggestion|convert|strategy|plan|start/i.test(q)) {
    const criticalItem = snapshot.stockoutAlerts.find((a) => a.riskLevel === "critical");
    const slowItem = snapshot.slowPeriods[0];
    const topItem = [...snapshot.itemPerformance].sort((a, b) => b.revenue7d - a.revenue7d)[0];

    if (isPidgin) {
      const steps: string[] = [];
      if (criticalItem) {
        steps.push(`**Restock ${criticalItem.itemName} sharp-sharp:** E don dey touch ground and na fast-moving market. Make customer no go buy for your competitor hand.`);
      }
      if (topItem && topItem.revenue7d > 0) {
        steps.push(`**Push your champion product:** ${topItem.name} dey bring money pass (₦${topItem.revenue7d.toLocaleString()} recently). Make sure display dey eye-level.`);
      }
      if (slowItem) {
        steps.push(`**Bundle slow-moving stock:** ${slowItem.itemName} dey move slow. Attach am as promo with another fast-moving item make money free up.`);
      }
      if (snapshot.anomalies.length > 0) {
        steps.push(`**Check expenses:** Your spending for ${snapshot.anomalies[0].category} jump high. Control fuel/generator or courier cost.`);
      }
      if (steps.length === 0) {
        steps.push("**Check daily sales and cash balance:** Make sure all sales today enter your daily log so we fit track profit accurately.");
        steps.push("**Call loyal customers:** Broadcast new arrivals on WhatsApp status to trigger quick repeat sales.");
      }

      return {
        answer: `My partner, make we arrange the priority for ${snapshot.businessName} sharp-sharp:\n\n` + steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n\n") + `\n\nWhich of these you wan make we start with?`,
        intent: "business_advice",
      };
    }

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

  // 6. Sales performance & "How is business / How business now"
  if (/how (are|is) (sales|business|market|things)/i.test(q) || /how business/i.test(q) || /how market/i.test(q) || /revenue/i.test(q) || /total sales/i.test(q) || /summary/i.test(q) || /doing/i.test(q) || /market/i.test(q)) {
    const topItem = [...snapshot.itemPerformance].sort((a, b) => b.revenue7d - a.revenue7d)[0];
    if (isPidgin) {
      const topNote = topItem ? ` Na ${topItem.name} lead the market with ₦${topItem.revenue7d.toLocaleString()}.` : "";
      return {
        answer: `Market dey move! For the past 7 days, your total sales reach ₦${snapshot.total7DayRevenue.toLocaleString()} across ${snapshot.total7DayUnits} items.${topNote} Total expense wey enter na ₦${snapshot.totalExpenses.toLocaleString()}. Wetin you wan make we review next?`,
        intent: "sales_summary",
      };
    }

    const topNote = topItem ? ` Top performer was ${topItem.name} (₦${topItem.revenue7d.toLocaleString()}).` : "";
    const slowNote = snapshot.slowPeriods.length > 0 ? ` Note that ${snapshot.slowPeriods.map((s) => s.itemName).join(", ")} is selling slower than usual.` : "";
    return {
      answer: `Over the past 7 days, your total sales revenue reached ₦${snapshot.total7DayRevenue.toLocaleString()} across ${snapshot.total7DayUnits} items sold.${topNote}${slowNote}`,
      intent: "sales_summary",
    };
  }

  // 7. Slow period inquiry
  if (/slow/i.test(q) || /quiet/i.test(q) || /down this (week|month)/i.test(q) || /drop|fall|decline/i.test(q)) {
    if (snapshot.slowPeriods.length === 0) {
      return {
        answer: isPidgin
          ? "Good news! Market dey normal, no item dey drag foot for sales right now."
          : "Good news — all your items are currently selling near or above their usual pace.",
        intent: "slow_period_check",
      };
    }
    return {
      answer: `Sales slowdown detected: ${snapshot.slowPeriods.map((s) => s.message).join(" ")} Consider running a weekend discount or bundling to move stock.`,
      intent: "slow_period_check",
    };
  }

  // 8. Expenses & Unusual spending
  if (/unusual/i.test(q) || /strange/i.test(q) || /weird/i.test(q) || /suspicious/i.test(q) || /expense/i.test(q) || /spending/i.test(q) || /cost/i.test(q) || /spend/i.test(q) || /choke/i.test(q)) {
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

  // 9. Default flexible summary
  return {
    answer: isPidgin
      ? `Here na quick update on ${snapshot.businessName}: Past 7-day sales na ₦${snapshot.total7DayRevenue.toLocaleString()} (${snapshot.total7DayUnits} items sold), with ₦${snapshot.totalExpenses.toLocaleString()} total expenses. ${snapshot.stockoutAlerts.length > 0 ? `⚠️ Alert: ${snapshot.stockoutAlerts[0].message}` : "Stock dey stable."} You fit ask me about any particular item, restock priority, or how to reduce cost!`
      : `Here is a quick snapshot of ${snapshot.businessName}: Past 7-day revenue is ₦${snapshot.total7DayRevenue.toLocaleString()} (${snapshot.total7DayUnits} items sold), with ₦${snapshot.totalExpenses.toLocaleString()} in total expenses. ${snapshot.stockoutAlerts.length > 0 ? `⚠️ Alert: ${snapshot.stockoutAlerts[0].message}` : "Stock is currently stable."} Feel free to ask about any specific item, sales trends, or costs!`,
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

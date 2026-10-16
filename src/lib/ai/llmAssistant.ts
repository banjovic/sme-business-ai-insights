// LLM Business Advisor (Gemini & Anthropic Integration)
// -----------------------------------------------------
// Enables free-flowing, open-ended conversational business intelligence.
// Uses Gemini Pro / Flash when GEMINI_API_KEY is configured, or Anthropic Claude
// when ANTHROPIC_API_KEY is configured. Grounded with live business metrics
// from getBusinessSnapshot to eliminate hallucinations.

import type { BusinessSnapshot } from "./businessContext";

function formatPrompt(context: BusinessSnapshot): string {
  return `You are a trusted, pragmatic AI business intelligence advisor for "${context.businessName}", an SME operating in the ${context.sector} sector in ${context.location}.
Your goal is to help the business owner make smart, profitable, and evidence-based decisions without confusing them with technical data science jargon.

--- VERIFIED BUSINESS DATA SNAPSHOT ---
- Past 7 Days Total Revenue: ₦${context.total7DayRevenue.toLocaleString()} (${context.total7DayUnits} items sold)
- Inventory & Sales Velocities:
${context.itemPerformance.map((i) => `  • ${i.name}: ${i.currentStock} units in stock (₦${i.unitPrice.toLocaleString()}/unit); Sold ${i.unitsSold7d} units (₦${i.revenue7d.toLocaleString()}) in the past 7 days. Reorder threshold is ${i.reorderPoint} units.`).join("\n")}

- Impending Stockouts (Alerts):
${context.stockoutAlerts.length > 0 ? context.stockoutAlerts.map((a) => `  ⚠️ [${a.riskLevel.toUpperCase()}] ${a.message}`).join("\n") : "  None. All items currently have adequate stock."}

- Slow-Selling Trends:
${context.slowPeriods.length > 0 ? context.slowPeriods.map((s) => `  📉 ${s.message}`).join("\n") : "  None. All items are selling near their usual pace."}

- Total Recorded Expenses: ₦${context.totalExpenses.toLocaleString()}
- Spending by Category:
${Object.entries(context.expenseByCategory).map(([cat, amt]) => `  • ${cat}: ₦${amt.toLocaleString()}`).join("\n")}

- Recent Expense Entries:
${context.recentExpenses.map((e) => `  • ${e.date}: ${e.category} - ₦${e.amount.toLocaleString()}`).join("\n")}

- Flagged Expense Anomalies (Unusual Costs):
${context.anomalies.length > 0 ? context.anomalies.map((a) => `  🚨 ${a.message}`).join("\n") : "  None. All recorded expenses are within normal historical bounds."}
---------------------------------------

GUIDELINES FOR YOUR RESPONSES:
1. Answer the owner's question directly, clearly, and concisely using the figures from the snapshot above.
2. DO NOT restrict yourself to a predetermined question flow. The user can ask about specific items, total revenue, restock priorities, expense breakdowns, how business compares, or general retail advice.
3. Understand informal Nigerian trade phrasing and Nigerian Pidgin (e.g., "how market be?", "which item dey move pass?", "which expense choke pass?", "wetin I suppose buy?"). Respond in warm, respectful, plain Nigerian business English with optional natural Pidgin touch if addressed in Pidgin.
4. Always provide an actionable next step (e.g., "Reorder Cooking Oil before the weekend", "Check why Transport cost jumped to ₦16,500").
5. Keep your response concise (typically 2 to 4 sentences or a short bulleted list), formatted nicely for a mobile chat interface.`;
}

async function callGemini(apiKey: string, prompt: string, question: string): Promise<string | null> {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: prompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: question }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Gemini API error:", res.status, errorText);
    return null;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text?.trim() || null;
}

async function callAnthropic(apiKey: string, prompt: string, question: string): Promise<string | null> {
  const model = process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system: prompt,
      messages: [{ role: "user", content: question }],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || null;
}

export async function askLLMAssistant(context: BusinessSnapshot, question: string): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const prompt = formatPrompt(context);

  if (geminiKey) {
    try {
      const reply = await callGemini(geminiKey, prompt, question);
      if (reply) return reply;
    } catch (err) {
      console.warn("Gemini call failed or timed out, trying fallback...", err);
    }
  }

  if (anthropicKey) {
    try {
      const reply = await callAnthropic(anthropicKey, prompt, question);
      if (reply) return reply;
    } catch (err) {
      console.warn("Anthropic call failed or timed out, trying fallback...", err);
    }
  }

  return null;
}

// LLM Business Advisor (Gemini & Anthropic Integration)
// -----------------------------------------------------
// Enables free-flowing, open-ended conversational business intelligence.
// Uses Gemini Flash/Pro when GEMINI_API_KEY is configured, or Anthropic Claude
// when ANTHROPIC_API_KEY is configured. Grounded with live business metrics
// from getBusinessSnapshot to eliminate hallucinations.

import type { BusinessSnapshot } from "./businessContext";

function formatPrompt(context: BusinessSnapshot): string {
  return `You are a trusted, pragmatic, and sharp AI business intelligence advisor for "${context.businessName}", a Nigerian SME operating in the ${context.sector} sector in ${context.location}.
Your mission is to help the business owner make smart, profitable, and evidence-based decisions, protect their capital, manage inventory, and grow their business.

--- VERIFIED REAL-TIME BUSINESS DATA ---
- Business Name: ${context.businessName}
- Sector: ${context.sector}
- Location: ${context.location}
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

CORE COMMUNICATION RULES:
1. DIALECT & TONE MATCHING (VERY IMPORTANT):
   - If the business owner chats with you in Nigerian Pidgin (e.g. "how business now?", "wetin I suppose do first like this?", "no suggestions on how to convert the zero to lots?", "how market dey go?", "which item dey sell pass?"), YOU MUST RESPOND IN NATURAL, RELATABLE, WARM, AND SMART NIGERIAN PIDGIN!
   - Use authentic, respectful trade terms (e.g. "Market dey move well", "E choke small", "Oga/Madam", "ginger sales", "clear old stock", "restock sharp-sharp", "protect your capital", "e don balance").
   - If they write in standard English, respond in polished, warm Nigerian business English.
2. CONVERSATIONAL, RELATIONAL & SMART:
   - Treat the owner like a respected partner. Don't be robotic or regurgitate generic templates.
   - Directly answer what they asked with real figures from their business snapshot.
3. ACTION-ORIENTED:
   - Always conclude with a practical, high-impact suggestion (e.g., restock alert, supplier negotiation, pricing tweak, bundle deal, cost control).
4. FORMATTING:
   - Keep answers punchy, clear, and well-spaced (2 to 4 concise paragraphs or short bullets), ideal for reading on mobile and web.`;
}

async function callGemini(apiKey: string, prompt: string, question: string): Promise<string | null> {
  const candidateModels = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
  ];

  for (const model of candidateModels) {
    try {
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
            temperature: 0.5,
            maxOutputTokens: 600,
          },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Gemini model ${model} error ${res.status}:`, errorText);
        continue; // try next candidate model
      }

      const parts = data.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p: any) => p.text || "").join("").trim();
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`Gemini model ${model} call failed:`, err);
    }
  }

  return null;
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
      max_tokens: 600,
      system: prompt,
      messages: [{ role: "user", content: question }],
    }),
    signal: AbortSignal.timeout(12000),
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

// LLM Business Advisor (Gemini & Anthropic Integration)
// -----------------------------------------------------
// Enables free-flowing, open-ended conversational business intelligence.
// Uses Gemini Flash/Pro when GEMINI_API_KEY is configured, or Anthropic Claude
// when ANTHROPIC_API_KEY is configured. Grounded with live business metrics
// from getBusinessSnapshot to eliminate hallucinations.

import type { BusinessSnapshot } from "./businessContext";

export function detectLanguage(text: string): "pidgin" | "english" {
  const q = text.trim().toLowerCase();

  const pidginPatterns = [
    /\b(wetin|how far|how body|which kind|shey|abi|abeg|biko)\b/i,
    /\b(una|make we|make i|make you|make am)\b/i,
    /\b(dey|dey go|dey come|dey move|dey run|dey sell|dey sup|wetin dey)\b/i,
    /\b(don dey|don finish|don enter|don reach|don spoil)\b/i,
    /\b(na so|no be|na who|na wetin|na my|na your|na the)\b/i,
    /\b(sharp[- ]sharp|quick[- ]quick|well[- ]well|small[- ]small|kpata[- ]kpata)\b/i,
    /\b(wahala|palava|yawa|gbege|kolo|choke)\b/i,
    /\b(how market|market dey|sell pass|move pass|carry go|drag leg)\b/i,
    /\b(how business now|how you dey|wetin sup)\b/i,
    /\b(fit sell|fit buy|i fit|you fit|we fit)\b/i,
    /(\b(abeg|abi|sha|sef|jare)\b|[?!.]\s*(o|sha|abi|abeg)\s*$)/i,
  ];

  return pidginPatterns.some((pattern) => pattern.test(q)) ? "pidgin" : "english";
}

function formatPrompt(context: BusinessSnapshot, lang: "pidgin" | "english"): string {
  const languageRules =
    lang === "pidgin"
      ? `CRITICAL DIALECT RULE — NIGERIAN PIDGIN:
The user is speaking in Nigerian Pidgin.
- You MUST formulate your ENTIRE response in authentic, fluent, natural, and relatable Nigerian Pidgin.
- Use natural Nigerian trade expressions naturally (e.g., "market dey move", "restock sharp-sharp", "clear old stock", "protect your capital", "wahala", "choke").
- Do NOT switch to stiff, formal, or textbook English. Speak like a smart, experienced trade partner who knows the market inside out.`
      : `CRITICAL DIALECT RULE — STANDARD ENGLISH:
The user is speaking in proper, standard English.
- You MUST formulate your ENTIRE response in polished, professional, articulate, and grammatically correct standard English.
- STRICT PROHIBITION: Do NOT use any Nigerian Pidgin words, slang, or street trade idioms (ABSOLUTELY NO "sharp-sharp", "ginger", "Oga/Madam", "dey", "wetin", "wahala", "choke", "palava", "small-small", etc.).
- Maintain an executive, clear, analytical, and professional advisory tone (like a McKinsey or CFO business advisor to an SME).`;

  return `You are a trusted, pragmatic, and highly intelligent AI business intelligence advisor for "${context.businessName}", an SME operating in the ${context.sector} sector in ${context.location}.
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

${languageRules}

CORE ADVISORY RULES:
1. Ground every answer in the verified real-time numbers provided above. Never hallucinate numbers.
2. Directly answer what the owner asked with real figures from their business snapshot.
3. Always conclude with a practical, high-impact suggestion (e.g., restock alert, price tweak, promotional bundle, cost control).
4. Keep answers punchy, clear, and well-spaced (2 to 4 concise paragraphs or short bullets), ideal for reading on mobile and web.`;
}

async function callGemini(apiKey: string, prompt: string, question: string): Promise<string | null> {
  const candidateModels = [
    process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
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
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Gemini model ${model} error ${res.status}:`, errorText);
        continue; // try next candidate model
      }

      const data = await res.json();
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

  const lang = detectLanguage(question);
  const prompt = formatPrompt(context, lang);

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

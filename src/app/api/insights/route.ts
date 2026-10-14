import { NextResponse } from "next/server";
import { requireCurrentBusiness, UnauthorizedError } from "@/lib/currentBusiness";
import { generateAndPersistInsights } from "@/lib/ai/insightEngine";

export async function GET() {
  try {
    const { business } = await requireCurrentBusiness();
    const insights = await generateAndPersistInsights(business.id);
    return NextResponse.json(
      insights.map((i: any) => ({
        id: i.id, type: i.type, severity: i.severity, message: i.message, generatedAt: i.generatedAt.toISOString(),
      }))
    );
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

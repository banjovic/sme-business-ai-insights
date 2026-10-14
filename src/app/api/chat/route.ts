import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentBusiness, UnauthorizedError } from "@/lib/currentBusiness";
import { answerQuestion } from "@/lib/ai/conversational";

export async function GET() {
  try {
    const { userId } = await requireCurrentBusiness();
    const history = await prisma.conversationLog.findMany({ where: { userId }, orderBy: { timestamp: "asc" }, take: 50 });
    return NextResponse.json(
      history.map((h: any) => ({ id: h.id, question: h.question, answer: h.answer, timestamp: h.timestamp.toISOString() }))
    );
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

const schema = z.object({ question: z.string().min(1).max(500) });

export async function POST(req: Request) {
  try {
    const { userId, business } = await requireCurrentBusiness();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Ask a question first" }, { status: 400 });
    }

    const { question } = parsed.data;
    const { answer, intent } = await answerQuestion(business.id, question);

    const log = await prisma.conversationLog.create({ data: { userId, question, answer, intent } });

    return NextResponse.json({ id: log.id, question, answer, timestamp: log.timestamp.toISOString() }, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

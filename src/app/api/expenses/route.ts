import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentBusiness, UnauthorizedError } from "@/lib/currentBusiness";

export async function GET() {
  try {
    const { business } = await requireCurrentBusiness();
    const expenses = await prisma.expenseRecord.findMany({ where: { businessId: business.id }, orderBy: { date: "desc" }, take: 50 });
    return NextResponse.json(
      expenses.map((e: any) => ({ id: e.id, category: e.category, amount: e.amount, date: e.date.toISOString() }))
    );
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

const schema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  try {
    const { business } = await requireCurrentBusiness();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { category, amount, date } = parsed.data;
    const expenseDate = date ? new Date(date) : new Date();

    const expense = await prisma.expenseRecord.create({ data: { businessId: business.id, category, amount, date: expenseDate } });

    return NextResponse.json({ id: expense.id, category, amount, date: expenseDate.toISOString() }, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

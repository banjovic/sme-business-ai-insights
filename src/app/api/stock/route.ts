import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentBusiness, UnauthorizedError } from "@/lib/currentBusiness";

export async function GET() {
  try {
    const { business } = await requireCurrentBusiness();
    const items = await prisma.stockItem.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } });
    return NextResponse.json(items);
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  quantityOnHand: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).default(5),
  unitPrice: z.number().min(0).default(0),
});

export async function POST(req: Request) {
  try {
    const { business } = await requireCurrentBusiness();
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const item = await prisma.stockItem.create({ data: { ...parsed.data, businessId: business.id } });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

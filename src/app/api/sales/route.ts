import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentBusiness, UnauthorizedError } from "@/lib/currentBusiness";

export async function GET() {
  try {
    const { business } = await requireCurrentBusiness();
    const sales = await prisma.saleRecord.findMany({
      where: { businessId: business.id }, include: { item: true }, orderBy: { date: "desc" }, take: 50,
    });
    return NextResponse.json(
      sales.map((s: any) => ({
        id: s.id, itemId: s.itemId, itemName: s.item.name, quantitySold: s.quantitySold,
        amount: s.amount, date: s.date.toISOString(),
      }))
    );
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

const schema = z.object({
  itemId: z.string().min(1),
  quantitySold: z.number().int().positive(),
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
    const { itemId, quantitySold, amount, date } = parsed.data;

    const item = await prisma.stockItem.findFirst({ where: { id: itemId, businessId: business.id } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const saleDate = date ? new Date(date) : new Date();

    const [sale] = await prisma.$transaction([
      prisma.saleRecord.create({ data: { businessId: business.id, itemId, quantitySold, amount, date: saleDate } }),
      prisma.stockItem.update({ where: { id: itemId }, data: { quantityOnHand: Math.max(0, item.quantityOnHand - quantitySold) } }),
    ]);

    return NextResponse.json(
      { id: sale.id, itemId, itemName: item.name, quantitySold, amount, date: saleDate.toISOString() },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

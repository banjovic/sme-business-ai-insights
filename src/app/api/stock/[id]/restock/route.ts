import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentBusiness, UnauthorizedError } from "@/lib/currentBusiness";

const schema = z.object({ quantity: z.number().int().positive() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { business } = await requireCurrentBusiness();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a positive quantity" }, { status: 400 });
    }

    const item = await prisma.stockItem.findFirst({ where: { id: params.id, businessId: business.id } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const updated = await prisma.stockItem.update({
      where: { id: item.id },
      data: { quantityOnHand: item.quantityOnHand + parsed.data.quantity },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

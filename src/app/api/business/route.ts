import { NextResponse } from "next/server";
import { requireCurrentBusiness, UnauthorizedError } from "@/lib/currentBusiness";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId, business } = await requireCurrentBusiness();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    return NextResponse.json({
      id: business.id,
      name: business.name,
      sector: business.sector,
      location: business.location,
      email: user?.email,
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}

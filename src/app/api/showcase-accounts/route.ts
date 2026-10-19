import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const accounts = businesses.map((b) => {
      const isDemo =
        b.user.email.endsWith(".ng") ||
        b.user.email === "demo@adaezestores.ng";

      return {
        id: b.id,
        name: b.name,
        email: b.user.email,
        sector: b.sector,
        location: b.location,
        isDemo,
        createdAt: b.createdAt.toISOString(),
      };
    });

    return NextResponse.json(accounts);
  } catch (err: any) {
    console.error("Failed to fetch showcase accounts:", err);
    return NextResponse.json(
      { error: "Failed to load showcase accounts" },
      { status: 500 }
    );
  }
}

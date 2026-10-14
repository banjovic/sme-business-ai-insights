import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export class UnauthorizedError extends Error {}

/** Resolves the Business belonging to the currently authenticated user, or throws. */
export async function requireCurrentBusiness() {
  const session = await getSession();
  if (!session) throw new UnauthorizedError("Not authenticated");

  const business = await prisma.business.findUnique({ where: { userId: session.userId } });
  if (!business) throw new UnauthorizedError("No business profile for this user");

  return { userId: session.userId, business };
}

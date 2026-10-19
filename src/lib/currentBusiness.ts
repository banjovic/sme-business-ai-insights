import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export class UnauthorizedError extends Error {}

/**
 * Resolves the Business belonging to the currently authenticated user.
 * Authenticates via the lightweight JWT session cookie and loads the user's
 * business profile from Prisma.
 */
export async function requireCurrentBusiness() {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError("Not authenticated");
  }

  const business = await prisma.business.findUnique({
    where: { userId: session.userId },
  });

  if (!business) {
    throw new UnauthorizedError("No business profile found for this user");
  }

  return { userId: session.userId, business };
}

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export class UnauthorizedError extends Error {}

/**
 * Resolves the Business belonging to the currently authenticated user.
 * Supports Clerk authentication with automatic DB linking/provisioning,
 * and falls back to local JWT cookie session for development/demo.
 */
export async function requireCurrentBusiness() {
  // 1. Try Clerk Authentication if configured
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { userId: clerkId } = auth();
      if (clerkId) {
        // Find DB user by clerkId
        let dbUser = await prisma.user.findUnique({
          where: { clerkId },
          include: { business: true },
        });

        if (!dbUser) {
          // If not linked by clerkId, fetch clerk profile to match by email
          const clerkUser = await currentUser();
          const email =
            clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

          if (email) {
            // Check if user exists by email (e.g. from pre-seeded showcase accounts)
            dbUser = await prisma.user.findUnique({
              where: { email },
              include: { business: true },
            });

            if (dbUser) {
              // Link clerkId to the existing user
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { clerkId },
                include: { business: true },
              });
            }
          }

          // If user still does not exist, auto-provision user and business
          if (!dbUser) {
            const displayName =
              clerkUser?.firstName ||
              email?.split("@")[0] ||
              "My Business";

            dbUser = await prisma.user.create({
              data: {
                clerkId,
                email: email || `${clerkId}@clerk.user`,
                business: {
                  create: {
                    name: `${displayName}'s Enterprise`,
                    sector: "Retail / General Trading",
                    location: "Lagos, Nigeria",
                  },
                },
              },
              include: { business: true },
            });
          }
        }

        // Ensure business exists for this user
        let business = dbUser.business;
        if (!business) {
          business = await prisma.business.create({
            data: {
              userId: dbUser.id,
              name: "My Business",
              sector: "Retail / General Trading",
              location: "Lagos, Nigeria",
            },
          });
        }

        return { userId: dbUser.id, business };
      }
    } catch (err) {
      // If Clerk auth fails or is not in request context, fall through to legacy check
      console.warn("Clerk auth resolution check:", err);
    }
  }

  // 2. Fallback to legacy cookie session
  const session = await getSession();
  if (!session) throw new UnauthorizedError("Not authenticated");

  const business = await prisma.business.findUnique({ where: { userId: session.userId } });
  if (!business) throw new UnauthorizedError("No business profile for this user");

  return { userId: session.userId, business };
}


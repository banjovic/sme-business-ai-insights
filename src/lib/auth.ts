import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * ==============================================================================
 * AUTHENTICATION ARCHITECTURE & STRATEGY
 * ==============================================================================
 *
 * CURRENT IMPLEMENTATION: Lightweight JWT Signed Cookie (`jose` + `bcryptjs`)
 * ------------------------------------------------------------------------------
 * This project uses an edge-compatible, stateless, signed-cookie JWT session mechanism:
 * 1. Zero External Network Latency: No external round-trips to third-party identity
 *    providers (e.g. Clerk/Auth0) during login, registration, or route middleware.
 * 2. Atomic Registration: When an SME owner creates an account, both the User and
 *    their Business profile are provisioned in a single database transaction.
 * 3. Edge-Native: Uses the standard Web Crypto API (`jose`), allowing `src/middleware.ts`
 *    to authenticate routes at the edge without heavy Node runtime dependencies.
 * 4. Zero-Friction Demo Mode: All 12 Nigerian SME showcase accounts can be logged in
 *    with a single click without external OTP or MFA challenges.
 *
 * FUTURE RECOMMENDATION & ENTERPRISE ROADMAP: NextAuth.js (Auth.js)
 * ------------------------------------------------------------------------------
 * For future multi-tenant scale and enterprise deployments, migrating to NextAuth.js
 * (Auth.js v5) is recommended when the platform requires:
 * - Enterprise Single Sign-On (SSO): Google Workspace, Microsoft Entra ID, or SAML
 *   for corporate SMEs and multi-branch retail networks.
 * - Centralized OAuth 2.0 / OpenID Connect identity federation.
 * - Standardized session synchronization across multi-subdomain architectures.
 * The database models (`User` and `Business`) have been structured so that an adapter
 * can easily attach to the existing schema.
 * ==============================================================================
 */

export const SESSION_COOKIE = "sme_bi_session";

export function getSecretKey() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me"
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ userId: string } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

import { jwtVerify } from "jose";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest, type NextFetchEvent, NextResponse } from "next/server";

// Routes where already-authenticated users should not linger (redirect to /dashboard)
const isAuthRoute = createRouteMatcher([
  "/login",
  "/login/(.*)",
  "/register",
  "/register/(.*)",
  "/sign-in",
  "/sign-in/(.*)",
  "/sign-up",
  "/sign-up/(.*)",
]);

// Protected routes that REQUIRE an active login session
const isProtectedRoute = createRouteMatcher([
  "/dashboard",
  "/dashboard/(.*)",
  "/log",
  "/log/(.*)",
  "/chat",
  "/chat/(.*)",
]);

const clerkHandler = clerkMiddleware((auth, req) => {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  const { userId } = auth();

  // 1. If user is on an auth page (login/register):
  if (isAuthRoute(req)) {
    // If already logged in, send them to dashboard
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // If not logged in, allow them to view login/register page!
    return NextResponse.next();
  }

  // 2. If trying to access a protected business route without being logged in, redirect to login
  if (!userId && isProtectedRoute(req)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. For any other route (including unmatched / 404 paths), let Next.js render not-found.tsx
  return NextResponse.next();
});

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up");

  // Check legacy cookie session
  const token = req.cookies.get("sme_bi_session")?.value;
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me"
      );
      const { payload } = await jwtVerify(token, secret);
      if (typeof payload.userId === "string") {
        if (isAuthPage) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
      }
    } catch {
      // Invalid local session, proceed to Clerk check
    }
  }

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    if (isProtectedRoute(req)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

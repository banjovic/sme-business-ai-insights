import { jwtVerify } from "jose";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest, type NextFetchEvent, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/api/auth(.*)",
]);

const isAuthRoute = createRouteMatcher([
  "/login(.*)",
  "/register(.*)",
]);

const clerkHandler = clerkMiddleware((auth, req) => {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  const { userId } = auth();

  // If user is already logged in and visits login/register, redirect to dashboard
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");

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
      // Invalid local sessions must still pass the configured auth checks.
    }
  }

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
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

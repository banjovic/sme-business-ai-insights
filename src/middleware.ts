import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/register"];
const PROTECTED_PAGES = ["/dashboard", "/log", "/chat"];
const PROTECTED_APIS = [
  "/api/expenses",
  "/api/insights",
  "/api/sales",
  "/api/stock",
  "/api/chat",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if current route is an auth page or protected route
  const isAuthPage = AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isProtectedPage = PROTECTED_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isProtectedApi = PROTECTED_APIS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // If the path is not something we guard, let it pass through immediately
  if (!isAuthPage && !isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // Validate the lightweight JWT session cookie
  const token = req.cookies.get("sme_bi_session")?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me"
      );
      const { payload } = await jwtVerify(token, secret);
      if (typeof payload.userId === "string") {
        isAuthenticated = true;
      }
    } catch {
      // Invalid or expired token
      isAuthenticated = false;
    }
  }

  // 1. If user is logged in and visits login or register -> redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. If user is unauthenticated and visits protected page -> redirect to login
  if (!isAuthenticated && isProtectedPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. If unauthenticated request hits protected API -> return 401 JSON
  if (!isAuthenticated && isProtectedApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

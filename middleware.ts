import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

// Public auth routes that logged-in users shouldn't visit
const AUTH_ROUTES = ["/login", "/register"];

// Routes that require an authenticated user
const PROTECTED_PREFIXES = ["/resources", "/reservations", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 1. Auth routes handling (/login, /register)
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    // If explicitly clearing session or if unauthenticated, allow visiting auth pages
    if (request.nextUrl.searchParams.get("clear") === "1" || !session) {
      const response = NextResponse.next();
      if (request.nextUrl.searchParams.get("clear") === "1" && token) {
        response.cookies.delete(SESSION_COOKIE_NAME);
      }
      return response;
    }
    // If valid session already active, redirect to dashboard /
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. If user is not logged in and visits dashboard (/) or protected areas
  const isDashboard = pathname === "/";
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!session && (isDashboard || isProtected)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 3. Admin routes gate check at middleware level
  if (pathname.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/admin/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

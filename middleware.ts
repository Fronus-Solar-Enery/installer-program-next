import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication.
  // NOTE: "/" is matched exactly, not by prefix — every path starts with "/",
  // so a prefix entry for it would make the entire app public.
  const publicPrefixes = [
    "/auth/signin",
    "/auth/error",
    "/_next",
    "/favicon.ico",
  ];

  const isPublicPath =
    path === "/" || publicPrefixes.some((prefix) => path.startsWith(prefix));

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Edge-level presence check only. Full session validation and role-based
  // authorization happen in API routes via withAuth — the JWT can't be decoded
  // here without database access in the Edge Runtime.
  const token =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  // Redirect to signin if not authenticated
  if (!token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (guarded by withAuth, which returns JSON 401/403 rather than
     *   an HTML redirect that would break fetch clients)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

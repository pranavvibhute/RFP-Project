import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];
const API_PREFIX = "/api/";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname) || pathname === "/") {
    return NextResponse.next();
  }

  // Allow API routes (backend handles auth)
  if (pathname.startsWith(API_PREFIX)) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

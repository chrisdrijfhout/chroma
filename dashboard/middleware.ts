import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get("chroma-session")?.value === "true";
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isLoginApi = request.nextUrl.pathname === "/api/login";

  if (!isLoggedIn && !isLoginPage && !isLoginApi) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except static assets, so the gate covers all pages
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

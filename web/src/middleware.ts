import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGES = ["/login", "/register"];
const PUBLIC_PREFIXES = ["/invite/"];

// This only checks for a non-httpOnly marker cookie ("logged_in") that the
// web app sets itself after a successful login and clears on logout/401 — it
// is a fast pre-render redirect for UX only, NOT a security boundary. The
// Express API is cookie-scoped to its own origin and is the sole real
// authorization check, re-verified on every API request regardless of what
// this middleware decides.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionMarker = req.cookies.has("logged_in");
  const isPublic = PUBLIC_PAGES.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (hasSessionMarker && PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!hasSessionMarker && !isPublic) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.svg|manifest.json|sw.js|offline.html|icons).*)",
  ],
};

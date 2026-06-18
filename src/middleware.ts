import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PAGES = ["/login", "/register"];
const PUBLIC_PREFIXES = [
  "/invite/",
  "/api/invites/",
  "/api/auth/",
  "/api/register",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isApi = pathname.startsWith("/api/");
  const isPublic =
    PUBLIC_PAGES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isLoggedIn && PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isLoggedIn && !isPublic) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.svg|manifest.json|sw.js|offline.html|icons).*)",
  ],
};

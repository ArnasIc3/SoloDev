import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/register"];
const PUBLIC_API_PREFIXES = ["/api/auth/"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth API
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  // Allow static files and Next internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();
  // Allow public static assets (images, fonts, etc.)
  if (/\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)$/i.test(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  // Authenticated user on public/auth pages → send to dashboard
  if (PUBLIC_PATHS.includes(pathname)) {
    if (session) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  // Protected routes
  if (!session) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

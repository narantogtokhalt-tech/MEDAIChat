// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function isPublicPath(pathname: string) {
  // Next.js internal
  if (pathname.startsWith("/_next")) return true;

  // NextAuth
  if (pathname.startsWith("/api/auth")) return true;

  // ✅ Public static files
  if (pathname.startsWith("/images/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;

  // Auth page
  if (pathname === "/login") return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Public → allow
  if (isPublicPath(pathname)) return NextResponse.next();

  // 🔐 Auth required
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // ✅ /images/*, /_next/*, /api/auth/* бүгд алгасна
    "/((?!images/|_next/|api/auth|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
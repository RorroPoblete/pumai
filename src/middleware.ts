import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/onboarding"];
const authRoutes = ["/login", "/register", "/forgot-password"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!token;

  if (authRoutes.some((r) => pathname.startsWith(r)) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/register", "/forgot-password"],
};

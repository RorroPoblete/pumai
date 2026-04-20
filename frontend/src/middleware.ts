import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/onboarding"];
const authRoutes = ["/login", "/register", "/forgot-password"];

function appBase(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (envUrl) return envUrl;
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "http";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return req.nextUrl.origin;
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!token;
  const base = appBase(req);

  if (authRoutes.some((r) => pathname.startsWith(r)) && isLoggedIn) {
    return NextResponse.redirect(`${base}/dashboard`);
  }

  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isLoggedIn) {
    const loginUrl = new URL(`${base}/login`);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/register", "/forgot-password"],
};

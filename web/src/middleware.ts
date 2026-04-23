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

function buildCSP(nonce: string, isProd: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${isProd ? "" : "'unsafe-eval'"} https://js.stripe.com https://accounts.google.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.stripe.com https://*.openai.com https://accounts.google.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
    "frame-ancestors 'none'",
    "form-action 'self' https://checkout.stripe.com",
    "base-uri 'self'",
    "object-src 'none'",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The widget script is loaded cross-origin by design — don't apply CSP to it.
  const skipCsp = pathname === "/widget.js" || pathname.startsWith("/api/webchat");

  // Per-request nonce (base64-encoded random). Next auto-injects it into its
  // own runtime scripts when the request header `x-nonce` is present.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isProd = process.env.NODE_ENV === "production";
  const csp = buildCSP(nonce, isProd);

  // Auth gating
  const needsAuthCheck =
    protectedRoutes.some((r) => pathname.startsWith(r)) ||
    authRoutes.some((r) => pathname.startsWith(r));

  if (needsAuthCheck) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
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
  }

  const requestHeaders = new Headers(req.headers);
  if (!skipCsp) {
    requestHeaders.set("x-nonce", nonce);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (!skipCsp) {
    response.headers.set("Content-Security-Policy", csp);
  }
  return response;
}

// Apply middleware to every route except static/internal/widget paths.
// CSP + nonce are injected globally; auth gating is performed conditionally.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|widget\\.js|api/webchat/widget).*)",
  ],
};

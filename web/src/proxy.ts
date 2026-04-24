import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/onboarding"];
const authRoutes = ["/login", "/register", "/forgot-password"];

// Must match the custom cookie name set in auth.ts so getToken() finds it.
const useSecureCookies = (process.env.AUTH_URL ?? "").startsWith("https://");
const sessionCookieName = useSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

function buildCSP(nonce: string, isProd: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? "" : " 'unsafe-eval'"} https://js.stripe.com https://accounts.google.com`,
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

export async function proxy(req: NextRequest) {
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
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName: sessionCookieName,
      secureCookie: useSecureCookies,
    });
    const isLoggedIn = !!token;

    if (authRoutes.some((r) => pathname.startsWith(r)) && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const requestHeaders = new Headers(req.headers);
  if (!skipCsp) {
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (!skipCsp) {
    response.headers.set("Content-Security-Policy", csp);
  }
  return response;
}

// Apply proxy to every route except static/internal/widget paths.
// CSP + nonce are injected globally; auth gating is performed conditionally.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|widget\\.js|api/webchat/widget).*)",
  ],
};

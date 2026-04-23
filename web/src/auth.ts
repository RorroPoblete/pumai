import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/prisma";
import { verifyTotpCode, verifyRecoveryCode } from "@/server/totp";
import { rateLimit } from "@/server/rate-limit";
import { clientIPFromRequest } from "@/server/request-meta";

const isProd = process.env.NODE_ENV === "production";
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const isLocalhostUrl = (u?: string) =>
  !!u && /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(u);

if (isProd && !isBuild) {
  const authUrl = process.env.AUTH_URL;
  if (!authUrl || (!authUrl.startsWith("https://") && !isLocalhostUrl(authUrl))) {
    throw new Error("AUTH_URL must be an https:// URL in production");
  }
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!publicUrl || (!publicUrl.startsWith("https://") && !isLocalhostUrl(publicUrl))) {
    throw new Error("NEXT_PUBLIC_APP_URL must be an https:// URL in production");
  }
}

// Cookie hardening is governed by whether AUTH_URL is actually https —
// not NODE_ENV — so docker-compose dev (NODE_ENV=production + http://localhost)
// still works.
const useSecureCookies = (process.env.AUTH_URL ?? "").startsWith("https://");

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies },
    },
    csrfToken: {
      name: useSecureCookies ? "__Host-authjs.csrf-token" : "authjs.csrf-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies },
    },
    callbackUrl: {
      name: useSecureCookies ? "__Secure-authjs.callback-url" : "authjs.callback-url",
      options: { sameSite: "lax", path: "/", secure: useSecureCookies },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign-in: load user data
      if (user) {
        token.id = user.id;
        token.onboarded = (user as { onboarded?: boolean }).onboarded ?? false;
        token.role = (user as { role?: string }).role ?? "USER";

        // Find active business (first membership or owned business)
        const membership = await prisma.businessMember.findFirst({
          where: { userId: user.id },
          select: { businessId: true, role: true },
          orderBy: { createdAt: "asc" },
        });
        if (membership) {
          token.activeBusinessId = membership.businessId;
          token.businessRole = membership.role;
        } else {
          // Fallback: legacy 1:1 relation
          const biz = await prisma.business.findUnique({
            where: { userId: user.id },
            select: { id: true },
          });
          token.activeBusinessId = biz?.id ?? null;
          token.businessRole = biz ? "OWNER" : null;
        }
      }

      // Session update trigger (e.g. business switch)
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { onboarded: true, role: true },
        });
        if (dbUser) {
          token.onboarded = dbUser.onboarded;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { id: string; onboarded?: boolean; role?: string; activeBusinessId?: string | null; businessRole?: string | null };
        u.id = token.id as string;
        u.onboarded = token.onboarded as boolean;
        u.role = token.role as string;
        u.activeBusinessId = token.activeBusinessId as string | null;
        u.businessRole = token.businessRole as string | null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Same-origin allowlist. Blocks open-redirect via callbackUrl.
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {
        // fallthrough
      }
      return baseUrl;
    },
  },
  providers: [
    Google,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA code", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const totpCode = (credentials.totpCode as string | undefined)?.trim() ?? "";

        // Two-dimensional rate limit (both fail-closed):
        // per-email (blocks slow online brute force of one account)
        // per-IP    (blocks credential stuffing across many accounts)
        const ip = request instanceof Request ? clientIPFromRequest(request) : "unknown";
        const [emailRl, ipRl] = await Promise.all([
          rateLimit(`login:${email.toLowerCase()}`, 10, 10 * 60_000, { failClosed: true }),
          rateLimit(`login-ip:${ip}`, 30, 10 * 60_000, { failClosed: true }),
        ]);
        if (!emailRl.ok || !ipRl.ok) throw new Error("TOO_MANY_ATTEMPTS");

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Superadmins without TOTP enabled are allowed to log in but will be
        // redirected to /dashboard/security on first protected route (see
        // dashboard/layout.tsx). This avoids the chicken-and-egg of needing
        // to be logged in to enroll in 2FA.
        if (user.totpEnabled) {
          if (!totpCode) throw new Error("TOTP_CODE_REQUIRED");
          // Accept either a live TOTP code OR an unused recovery code.
          const digitsOnly = /^\d{6}$/.test(totpCode);
          const ok = digitsOnly
            ? await verifyTotpCode(user.id, totpCode)
            : await verifyRecoveryCode(user.id, totpCode);
          if (!ok) throw new Error("TOTP_INVALID");
        }

        return { id: user.id, name: user.name, email: user.email, onboarded: user.onboarded, role: user.role };
      },
    }),
  ],
});

export const CURRENT_CONSENT_VERSION = "v1.0-2026-04-20";

export async function registerUser(name: string, email: string, password: string) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email already registered");

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      consentedAt: new Date(),
      consentVersion: CURRENT_CONSENT_VERSION,
    },
  });
  return { id: user.id, name: user.name, email: user.email };
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/backend/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
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
  },
  providers: [
    Google,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, onboarded: user.onboarded, role: user.role };
      },
    }),
  ],
});

export async function registerUser(name: string, email: string, password: string) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email already registered");

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });
  return { id: user.id, name: user.name, email: user.email };
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboarded = (user as { onboarded?: boolean }).onboarded ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { onboarded?: boolean }).onboarded = token.onboarded as boolean;
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

        return { id: user.id, name: user.name, email: user.email, onboarded: user.onboarded };
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

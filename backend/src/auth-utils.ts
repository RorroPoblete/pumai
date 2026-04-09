import { auth } from "@/auth";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// ─── Session Context ───

export interface SessionContext {
  userId: string;
  role: string;
  activeBusinessId: string | null;
  businessRole: string | null;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!user?.id) return null;
  return {
    userId: user.id as string,
    role: (user.role as string) ?? "USER",
    activeBusinessId: (user.activeBusinessId as string) ?? null,
    businessRole: (user.businessRole as string) ?? null,
  };
}

export async function requireAuth(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) throw new Error("Not authenticated");
  return ctx;
}

export async function requireSuperadmin(): Promise<SessionContext> {
  const ctx = await requireAuth();
  if (ctx.role !== "SUPERADMIN") throw new Error("Unauthorized: superadmin required");
  return ctx;
}

// ─── Active Business Resolution ───

export async function getActiveBusinessId(): Promise<string | null> {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  // 1. Cookie (set by tenant switcher)
  const cookieStore = await cookies();
  const cookieBiz = cookieStore.get("pumai_active_business")?.value;
  if (cookieBiz) {
    if (ctx.role === "SUPERADMIN") return cookieBiz;
    const member = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: ctx.userId, businessId: cookieBiz } },
    });
    if (member) return cookieBiz;
  }

  // 2. Session (set at login)
  if (ctx.activeBusinessId) return ctx.activeBusinessId;

  // 3. Legacy 1:1 fallback
  const biz = await prisma.business.findUnique({
    where: { userId: ctx.userId },
    select: { id: true },
  });
  return biz?.id ?? null;
}

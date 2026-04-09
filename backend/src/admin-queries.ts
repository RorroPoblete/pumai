import { prisma } from "./prisma";
import { auth } from "@/auth";

// ─── Auth Guard ───

async function requireSuperadmin(): Promise<string> {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!user?.id || user.role !== "SUPERADMIN") {
    throw new Error("Unauthorized: superadmin required");
  }
  return user.id as string;
}

// ─── Admin Overview ───

export interface AdminOverview {
  totalBusinesses: number;
  totalConversations: number;
  totalMessages: number;
  totalAgents: number;
  totalUsers: number;
  planBreakdown: { plan: string; count: number }[];
  recentBusinesses: {
    id: string;
    name: string;
    plan: string;
    industry: string;
    conversations: number;
    agents: number;
    createdAt: string;
  }[];
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  await requireSuperadmin();

  const [
    totalBusinesses,
    totalConversations,
    totalMessages,
    totalAgents,
    totalUsers,
    planGroups,
    recentBiz,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.agent.count(),
    prisma.user.count(),
    prisma.business.groupBy({ by: ["plan"], _count: true }),
    prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: { select: { conversations: true, agents: true } },
      },
    }),
  ]);

  return {
    totalBusinesses,
    totalConversations,
    totalMessages,
    totalAgents,
    totalUsers,
    planBreakdown: planGroups.map((g) => ({ plan: g.plan, count: g._count })),
    recentBusinesses: recentBiz.map((b) => ({
      id: b.id,
      name: b.name,
      plan: b.plan,
      industry: b.industry,
      conversations: b._count.conversations,
      agents: b._count.agents,
      createdAt: b.createdAt.toLocaleDateString("en-AU"),
    })),
  };
}

// ─── All Businesses List ───

export interface AdminBusiness {
  id: string;
  name: string;
  plan: string;
  industry: string;
  phone: string | null;
  conversations: number;
  agents: number;
  members: number;
  createdAt: string;
}

export async function getAdminBusinesses(): Promise<AdminBusiness[]> {
  await requireSuperadmin();

  const rows = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { conversations: true, agents: true, members: true } },
    },
  });

  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    plan: b.plan,
    industry: b.industry,
    phone: b.phone,
    conversations: b._count.conversations,
    agents: b._count.agents,
    members: b._count.members,
    createdAt: b.createdAt.toLocaleDateString("en-AU"),
  }));
}


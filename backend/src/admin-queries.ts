import { prisma } from "./prisma";
import { requireSuperadmin } from "./auth-utils";

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

export interface AdminBusinessWithMembers extends AdminBusiness {
  membersList: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    globalRole: string;
    createdAt: string;
  }[];
}

export async function getAdminBusinessesWithMembers(): Promise<AdminBusinessWithMembers[]> {
  await requireSuperadmin();

  const rows = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { conversations: true, agents: true, members: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
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
    membersList: b.members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      userName: m.user.name,
      userEmail: m.user.email,
      role: m.role,
      globalRole: m.user.role,
      createdAt: m.createdAt.toLocaleDateString("en-AU"),
    })),
  }));
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  onboarded: boolean;
  businesses: { name: string; role: string }[];
  createdAt: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  await requireSuperadmin();

  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        include: { business: { select: { name: true } } },
      },
    },
  });

  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    onboarded: u.onboarded,
    businesses: u.memberships.map((m) => ({ name: m.business.name, role: m.role })),
    createdAt: u.createdAt.toLocaleDateString("en-AU"),
  }));
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

// ─── Platform Config ───

export async function getPlatformConfigs(): Promise<Record<string, string>> {
  await requireSuperadmin();
  const configs = await prisma.platformConfig.findMany();
  return Object.fromEntries(configs.map((c) => [c.key, c.value]));
}

// ─── Admin Channel Configs (all tenants) ───

export interface AdminChannelView {
  id: string;
  channel: string;
  active: boolean;
  externalId: string;
  agentId: string;
  agentName: string;
  businessId: string;
  businessName: string;
}

export async function getAdminChannelConfigs(): Promise<AdminChannelView[]> {
  await requireSuperadmin();

  const configs = await prisma.channelConfig.findMany({
    include: {
      agent: { select: { name: true } },
      business: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return configs.map((c) => ({
    id: c.id,
    channel: c.channel,
    active: c.active,
    externalId: c.externalId,
    agentId: c.agentId,
    agentName: c.agent.name,
    businessId: c.businessId,
    businessName: c.business.name,
  }));
}

export interface AdminBusinessAgent {
  businessId: string;
  businessName: string;
  agents: { id: string; name: string }[];
}

export async function getAdminBusinessesWithAgents(): Promise<AdminBusinessAgent[]> {
  await requireSuperadmin();

  const businesses = await prisma.business.findMany({
    include: {
      agents: {
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return businesses.map((b) => ({
    businessId: b.id,
    businessName: b.name,
    agents: b.agents,
  }));
}


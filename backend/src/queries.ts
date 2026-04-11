import { prisma } from "./prisma";
import { getSessionContext, getActiveBusinessId } from "./auth-utils";

// ─── Helpers ───

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const PLAN_LIMITS: Record<string, number> = {
  STARTER: 300,
  GROWTH: 1000,
  ENTERPRISE: 4000,
};

// ─── Tenant Helpers ───

export async function getActiveBusiness(): Promise<{ id: string; name: string } | null> {
  const id = await getActiveBusinessId();
  if (!id) return null;
  return prisma.business.findUnique({ where: { id }, select: { id: true, name: true } });
}

export async function getAvailableTenants(): Promise<{ id: string; name: string; industry: string; plan: string }[]> {
  const ctx = await getSessionContext();
  if (!ctx) return [];

  if (ctx.role === "SUPERADMIN") {
    return prisma.business.findMany({
      select: { id: true, name: true, industry: true, plan: true },
      orderBy: { name: "asc" },
    });
  }

  const memberships = await prisma.businessMember.findMany({
    where: { userId: ctx.userId },
    include: { business: { select: { id: true, name: true, industry: true, plan: true } } },
  });
  return memberships.map((m) => m.business);
}

// ─── Business Summary (for Sidebar) ───

export interface BusinessSummary {
  plan: string;
  conversationsUsed: number;
  conversationsLimit: number;
}

export async function getBusinessSummary(): Promise<BusinessSummary | null> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return null;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { plan: true, _count: { select: { conversations: true } } },
  });
  if (!business) return null;

  return {
    plan: business.plan,
    conversationsUsed: business._count.conversations,
    conversationsLimit: PLAN_LIMITS[business.plan] ?? 300,
  };
}

// ─── Dashboard Overview ───

export interface DashboardConversation {
  id: string;
  contact: string;
  phone: string;
  channel: string;
  aiEnabled: boolean;
  agentId: string;
  agentName: string;
  status: "active" | "resolved" | "escalated";
  lastMessage: string;
  updatedAt: string;
  messages: number;
  sentiment: "positive" | "neutral" | "negative";
}

export interface DashboardAgent {
  id: string;
  name: string;
  tone: "professional" | "friendly" | "casual";
  status: "active" | "paused" | "draft";
  industry: string;
  conversationsToday: number;
  conversionRate: number;
}

export interface DashboardMetrics {
  totalConversations: number;
  conversationsChange: number;
  activeAgents: number;
  responseTime: string;
  responseTimeChange: number;
  conversionRate: number;
  conversionChange: number;
  messagesThisMonth: number;
  messagesChange: number;
}

export interface ChartData {
  conversationsPerDay: { day: string; value: number }[];
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
}

export interface DashboardOverviewData {
  metrics: DashboardMetrics;
  conversations: DashboardConversation[];
  agents: DashboardAgent[];
  chart: ChartData;
}

export async function getDashboardOverview(): Promise<DashboardOverviewData | null> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalConversations,
    thisWeekConvs,
    lastWeekConvs,
    activeAgentCount,
    messagesThisMonth,
    messagesLastMonth,
    resolvedCount,
    recentConversations,
    dbAgents,
    sentimentGroups,
    last7DaysConvs,
  ] = await Promise.all([
    prisma.conversation.count({ where: { businessId } }),
    prisma.conversation.count({ where: { businessId, createdAt: { gte: startOfWeek } } }),
    prisma.conversation.count({ where: { businessId, createdAt: { gte: startOfLastWeek, lt: startOfWeek } } }),
    prisma.agent.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.message.count({ where: { conversation: { businessId }, createdAt: { gte: startOfMonth } } }),
    prisma.message.count({ where: { conversation: { businessId }, createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    prisma.conversation.count({ where: { businessId, status: "RESOLVED" } }),
    prisma.conversation.findMany({
      where: { businessId },
      include: {
        agent: { select: { name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.agent.findMany({
      where: { businessId },
      include: {
        _count: { select: { conversations: true } },
        conversations: {
          where: { createdAt: { gte: startOfToday } },
          select: { id: true },
        },
      },
    }),
    prisma.conversation.groupBy({
      by: ["sentiment"],
      where: { businessId },
      _count: true,
    }),
    prisma.conversation.findMany({
      where: { businessId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      select: { createdAt: true },
    }),
  ]);

  // Metrics
  const conversationsChange = lastWeekConvs > 0
    ? Math.round((thisWeekConvs - lastWeekConvs) / lastWeekConvs * 1000) / 10
    : 0;
  const conversionRate = totalConversations > 0
    ? Math.round(resolvedCount / totalConversations * 1000) / 10
    : 0;
  const messagesChange = messagesLastMonth > 0
    ? Math.round((messagesThisMonth - messagesLastMonth) / messagesLastMonth * 1000) / 10
    : 0;

  const metrics: DashboardMetrics = {
    totalConversations,
    conversationsChange,
    activeAgents: activeAgentCount,
    responseTime: "1.4s",
    responseTimeChange: 0,
    conversionRate,
    conversionChange: 0,
    messagesThisMonth,
    messagesChange,
  };

  // Conversations
  const conversations: DashboardConversation[] = recentConversations.map((c) => ({
    id: c.id,
    contact: c.contactName ?? "Unknown",
    phone: c.contactPhone ?? "",
    channel: c.channel.toLowerCase(),
    aiEnabled: c.aiEnabled,
    agentId: c.agentId,
    agentName: c.agent.name,
    status: c.status.toLowerCase() as DashboardConversation["status"],
    lastMessage: c.messages[0]?.content ?? "",
    updatedAt: timeAgo(c.updatedAt),
    messages: c.messagesCount,
    sentiment: c.sentiment.toLowerCase() as DashboardConversation["sentiment"],
  }));

  // Agents
  const agents: DashboardAgent[] = dbAgents.map((a) => ({
    id: a.id,
    name: a.name,
    tone: a.tone.toLowerCase() as DashboardAgent["tone"],
    status: a.status.toLowerCase() as DashboardAgent["status"],
    industry: a.industry ?? "",
    conversationsToday: a.conversations.length,
    conversionRate: a._count.conversations > 0
      ? Math.round(a.conversations.length / a._count.conversations * 100)
      : 0,
  }));

  // Chart — conversations per day
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.set(d.toDateString(), 0);
  }
  for (const c of last7DaysConvs) {
    const key = c.createdAt.toDateString();
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const conversationsPerDay = Array.from(buckets.entries()).map(([dateStr, value]) => ({
    day: dayNames[new Date(dateStr).getDay()],
    value,
  }));

  // Sentiment breakdown
  const totalSentiment = sentimentGroups.reduce((acc, s) => acc + s._count, 0) || 1;
  const sentimentBreakdown = {
    positive: Math.round((sentimentGroups.find((s) => s.sentiment === "POSITIVE")?._count ?? 0) / totalSentiment * 100),
    neutral: Math.round((sentimentGroups.find((s) => s.sentiment === "NEUTRAL")?._count ?? 0) / totalSentiment * 100),
    negative: Math.round((sentimentGroups.find((s) => s.sentiment === "NEGATIVE")?._count ?? 0) / totalSentiment * 100),
  };

  return { metrics, conversations, agents, chart: { conversationsPerDay, sentimentBreakdown } };
}

// ─── Conversations Page ───

export interface ConversationMessage {
  id: string;
  content: string;
  role: "user" | "agent" | "system";
  createdAt: string;
}

export interface ConversationWithMessages extends DashboardConversation {
  chatMessages: ConversationMessage[];
}

export async function getConversations(): Promise<ConversationWithMessages[]> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return [];

  const rows = await prisma.conversation.findMany({
    where: { businessId },
    include: {
      agent: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, content: true, role: true, createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((c) => ({
    id: c.id,
    contact: c.contactName ?? "Unknown",
    phone: c.contactPhone ?? "",
    channel: c.channel.toLowerCase(),
    aiEnabled: c.aiEnabled,
    agentId: c.agentId,
    agentName: c.agent.name,
    status: c.status.toLowerCase() as DashboardConversation["status"],
    lastMessage: c.messages[c.messages.length - 1]?.content ?? "",
    updatedAt: timeAgo(c.updatedAt),
    messages: c.messagesCount,
    sentiment: c.sentiment.toLowerCase() as DashboardConversation["sentiment"],
    chatMessages: c.messages.map((m) => ({
      id: m.id,
      content: m.content,
      role: m.role.toLowerCase() as ConversationMessage["role"],
      createdAt: m.createdAt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
    })),
  }));
}

// ─── Agents Page ───

export async function getAgents(): Promise<DashboardAgent[]> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const rows = await prisma.agent.findMany({
    where: { businessId },
    include: {
      _count: { select: { conversations: true } },
      conversations: {
        where: { createdAt: { gte: startOfToday } },
        select: { id: true, status: true },
      },
    },
  });

  return rows.map((a) => {
    const todayResolved = a.conversations.filter((c) => c.status === "RESOLVED").length;
    const todayTotal = a.conversations.length;
    return {
      id: a.id,
      name: a.name,
      tone: a.tone.toLowerCase() as DashboardAgent["tone"],
      status: a.status.toLowerCase() as DashboardAgent["status"],
      industry: a.industry ?? "",
      conversationsToday: todayTotal,
      conversionRate: a._count.conversations > 0
        ? Math.round(todayResolved / Math.max(todayTotal, 1) * 100)
        : 0,
    };
  });
}

// ─── Settings Page ───

export interface SettingsData {
  businessName: string;
  email: string;
  timezone: string;
  phone: string | null;
  smsNumbers: { number: string; active: boolean }[];
}

export async function getSettings(): Promise<SettingsData | null> {
  const ctx = await getSessionContext();
  if (!ctx) return null;
  const businessId = ctx.activeBusinessId ?? (await getActiveBusinessId());
  if (!businessId) return null;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { smsNumbers: { select: { number: true, active: true } } },
  });
  if (!business) return null;

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { email: true },
  });

  return {
    businessName: business.name,
    email: user?.email ?? "",
    timezone: business.timezone,
    phone: business.phone,
    smsNumbers: business.smsNumbers,
  };
}

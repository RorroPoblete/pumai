import { prisma } from "./prisma";
import { CHANNEL_CATALOG, getConversationsLimit, type ChannelKey, type PlanTier } from "@/lib/stripe";
import type { Channel } from "@/generated/prisma/enums";

const ACTIVE = new Set(["active", "trialing"]);

export interface ChannelAccess {
  channel: ChannelKey;
  tier: PlanTier;
  status: string | null;
  allowed: boolean;
  conversationsUsed: number;
  conversationsLimit: number | null;
  atLimit: boolean;
  reason: "free" | "active" | "locked" | "payment_failed" | "limit_reached";
}

export function isActiveStatus(status: string | null | undefined): boolean {
  return !!status && ACTIVE.has(status);
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getSubscriptionMap(businessId: string): Promise<Map<ChannelKey, { tier: PlanTier; status: string | null }>> {
  const subs = await prisma.subscription.findMany({
    where: { businessId },
    select: { channel: true, tier: true, stripeStatus: true },
  });
  const map = new Map<ChannelKey, { tier: PlanTier; status: string | null }>();
  for (const s of subs) {
    map.set(s.channel as ChannelKey, { tier: s.tier as PlanTier, status: s.stripeStatus });
  }
  return map;
}

async function countConversationsThisMonth(businessId: string, channel: ChannelKey): Promise<number> {
  return prisma.conversation.count({
    where: {
      businessId,
      channel: channel as Channel,
      createdAt: { gte: startOfMonth() },
    },
  });
}

export async function getChannelAccess(businessId: string, channel: ChannelKey): Promise<ChannelAccess> {
  const sub = await prisma.subscription.findUnique({
    where: { businessId_channel: { businessId, channel: channel as Channel } },
    select: { tier: true, stripeStatus: true },
  });

  const tier = (sub?.tier as PlanTier | undefined) ?? "FREE";
  const status = sub?.stripeStatus ?? null;
  const catalog = CHANNEL_CATALOG[channel];

  // Webchat FREE: allowed without subscription
  if (tier === "FREE") {
    if (!catalog.free) {
      return {
        channel, tier: "FREE", status, allowed: false,
        conversationsUsed: 0, conversationsLimit: 0, atLimit: true, reason: "locked",
      };
    }
    const used = await countConversationsThisMonth(businessId, channel);
    const limit = catalog.free.conversationsLimit;
    const atLimit = used >= limit;
    return {
      channel, tier: "FREE", status, allowed: !atLimit,
      conversationsUsed: used, conversationsLimit: limit,
      atLimit, reason: atLimit ? "limit_reached" : "free",
    };
  }

  // Paid tiers: require active status
  if (!isActiveStatus(status)) {
    return {
      channel, tier, status, allowed: false,
      conversationsUsed: 0, conversationsLimit: getConversationsLimit(channel, tier),
      atLimit: false, reason: "payment_failed",
    };
  }

  const used = await countConversationsThisMonth(businessId, channel);
  const limit = getConversationsLimit(channel, tier);
  const atLimit = limit !== null && used >= limit;

  return {
    channel, tier, status, allowed: !atLimit,
    conversationsUsed: used, conversationsLimit: limit,
    atLimit, reason: atLimit ? "limit_reached" : "active",
  };
}

export async function getAllChannelAccess(businessId: string): Promise<Record<ChannelKey, ChannelAccess>> {
  const entries = await Promise.all(
    (Object.keys(CHANNEL_CATALOG) as ChannelKey[]).map(async (c) => [c, await getChannelAccess(businessId, c)] as const),
  );
  return Object.fromEntries(entries) as Record<ChannelKey, ChannelAccess>;
}

export class ChannelAccessError extends Error {
  constructor(public readonly access: ChannelAccess) {
    super(`Channel ${access.channel} not available: ${access.reason}`);
    this.name = "ChannelAccessError";
  }
}

export async function requireChannelAccess(businessId: string, channel: ChannelKey, opts: { allowAtLimit?: boolean } = {}): Promise<ChannelAccess> {
  const access = await getChannelAccess(businessId, channel);
  if (access.allowed || (opts.allowAtLimit && access.tier !== "FREE")) return access;
  throw new ChannelAccessError(access);
}

export async function hasAnyActiveSubscription(businessId: string): Promise<boolean> {
  const count = await prisma.subscription.count({
    where: {
      businessId,
      stripeStatus: { in: ["active", "trialing"] },
    },
  });
  return count > 0;
}

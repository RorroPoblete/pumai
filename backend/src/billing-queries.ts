import { prisma } from "./prisma";
import { PLANS, type PlanKey } from "@/lib/stripe";

export async function getBillingData(businessId: string) {
  const [business, conversationsThisMonth] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
    prisma.conversation.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth() },
      },
    }),
  ]);

  const plan = business.plan as PlanKey;
  const planConfig = PLANS[plan];
  const limit = planConfig.conversationsLimit;
  const usagePercent = limit ? Math.min((conversationsThisMonth / limit) * 100, 100) : 0;

  return {
    plan,
    planName: planConfig.name,
    price: planConfig.price,
    conversationsLimit: limit,
    conversationsUsed: conversationsThisMonth,
    usagePercent,
    stripeCustomerId: business.stripeCustomerId,
    stripeStatus: business.stripeStatus,
    stripePriceId: business.stripePriceId,
  };
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

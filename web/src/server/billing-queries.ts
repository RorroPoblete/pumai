import { prisma } from "./prisma";
import { getAllChannelAccess } from "./channel-gate";
import type { ChannelAccess } from "./channel-gate";

export interface BillingData {
  stripeCustomerId: string | null;
  channels: ChannelAccess[];
}

export async function getBillingData(businessId: string): Promise<BillingData> {
  const [business, access] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { stripeCustomerId: true },
    }),
    getAllChannelAccess(businessId),
  ]);

  return {
    stripeCustomerId: business.stripeCustomerId,
    channels: Object.values(access),
  };
}

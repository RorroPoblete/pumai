import { prisma } from "./prisma";
import { getActiveBusinessId } from "./auth-utils";

export interface ChannelConfigView {
  id: string;
  channel: string;
  active: boolean;
  externalId: string;
  agentId: string;
  agentName: string;
  createdAt: Date;
}

export async function getChannelConfigs(): Promise<ChannelConfigView[]> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return [];

  const configs = await prisma.channelConfig.findMany({
    where: { businessId },
    include: { agent: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return configs.map((c) => ({
    id: c.id,
    channel: c.channel,
    active: c.active,
    externalId: c.externalId,
    agentId: c.agentId,
    agentName: c.agent.name,
    createdAt: c.createdAt,
  }));
}

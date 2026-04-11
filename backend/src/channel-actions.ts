"use server";

import { prisma } from "./prisma";
import { getActiveBusinessId } from "./auth-utils";
import { channelConfigSchema } from "./validation";
import { revalidatePath } from "next/cache";

type ChannelEnum = "MESSENGER" | "INSTAGRAM" | "WEBCHAT" | "WHATSAPP" | "SMS";

export async function connectChannel(raw: unknown) {
  const businessId = await getActiveBusinessId();
  if (!businessId) throw new Error("No active business");

  const data = channelConfigSchema.parse(raw);

  await prisma.channelConfig.upsert({
    where: { businessId_channel: { businessId, channel: data.channel as ChannelEnum } },
    create: {
      businessId,
      channel: data.channel as ChannelEnum,
      externalId: data.externalId,
      credentials: data.credentials,
      agentId: data.agentId,
      active: true,
    },
    update: {
      externalId: data.externalId,
      credentials: data.credentials,
      agentId: data.agentId,
      active: true,
    },
  });

  revalidatePath("/dashboard/channels");
  revalidatePath("/dashboard/settings");
}

export async function disconnectChannel(channelConfigId: string) {
  const businessId = await getActiveBusinessId();
  if (!businessId) throw new Error("No active business");

  await prisma.channelConfig.delete({
    where: { id: channelConfigId, businessId },
  });

  revalidatePath("/dashboard/channels");
}

export async function toggleChannelActive(channelConfigId: string) {
  const businessId = await getActiveBusinessId();
  if (!businessId) throw new Error("No active business");

  const config = await prisma.channelConfig.findUnique({
    where: { id: channelConfigId, businessId },
  });
  if (!config) throw new Error("Channel config not found");

  await prisma.channelConfig.update({
    where: { id: channelConfigId },
    data: { active: !config.active },
  });

  revalidatePath("/dashboard/channels");
}

export async function updateChannelAgent(channelConfigId: string, agentId: string) {
  const businessId = await getActiveBusinessId();
  if (!businessId) throw new Error("No active business");

  await prisma.channelConfig.update({
    where: { id: channelConfigId, businessId },
    data: { agentId },
  });

  revalidatePath("/dashboard/channels");
}

"use server";

import { prisma } from "./prisma";
import { getActiveBusinessId } from "./auth-utils";
import { channelConfigSchema, webchatConfigSchema } from "./validation";
import type { Channel } from "./channels/types";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { requireChannelAccess } from "./channel-gate";
import type { ChannelKey } from "@/lib/stripe";

export async function connectChannel(raw: unknown) {
  const businessId = await getActiveBusinessId();
  if (!businessId) throw new Error("No active business");

  const data = channelConfigSchema.parse(raw);
  await requireChannelAccess(businessId, data.channel as ChannelKey, { allowAtLimit: true });

  await prisma.channelConfig.upsert({
    where: { businessId_channel: { businessId, channel: data.channel as Channel } },
    create: {
      businessId,
      channel: data.channel as Channel,
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

export async function saveWebchat(raw: unknown) {
  const businessId = await getActiveBusinessId();
  if (!businessId) throw new Error("No active business");
  await requireChannelAccess(businessId, "WEBCHAT", { allowAtLimit: true });

  const data = webchatConfigSchema.parse(raw);

  const existing = await prisma.channelConfig.findUnique({
    where: { businessId_channel: { businessId, channel: "WEBCHAT" } },
  });

  const widgetKey = existing?.externalId ?? "wk_" + randomBytes(12).toString("hex");

  const credentials = JSON.stringify({
    branding: {
      primaryColor: data.primaryColor,
      title: data.title,
      welcomeMessage: data.welcomeMessage,
      position: data.position,
      collectVisitor: data.collectVisitor,
      offlineMode: data.offlineMode,
    },
    allowedOrigins: data.allowedOrigins,
  });

  await prisma.channelConfig.upsert({
    where: { businessId_channel: { businessId, channel: "WEBCHAT" } },
    create: {
      businessId,
      channel: "WEBCHAT",
      externalId: widgetKey,
      credentials,
      agentId: data.agentId,
      active: true,
    },
    update: {
      credentials,
      agentId: data.agentId,
      active: true,
    },
  });

  revalidatePath("/dashboard/channels");
  return { widgetKey };
}

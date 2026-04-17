// ─── Human Reply Endpoint ───
// Sends a message from a dashboard user to the customer via their channel.

import { getSessionContext } from "@/backend/auth-utils";
import { prisma } from "@/backend/prisma";
import { getAdapter } from "@/backend/channels/registry";
import type { ChannelConfigData } from "@/backend/channels/types";
import { publish } from "@/backend/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx?.activeBusinessId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId, message } = (await req.json()) as {
    conversationId?: string;
    message?: string;
  };

  if (!conversationId || !message?.trim()) {
    return Response.json({ error: "conversationId and message are required" }, { status: 400 });
  }

  // Load conversation with channel info
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, businessId: ctx.activeBusinessId },
    select: {
      id: true,
      channel: true,
      contactExternalId: true,
      businessId: true,
    },
  });

  if (!conversation || !conversation.contactExternalId) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Find channel config for this business + channel
  const channelConfig = await prisma.channelConfig.findUnique({
    where: {
      businessId_channel: {
        businessId: conversation.businessId,
        channel: conversation.channel,
      },
    },
  });

  if (!channelConfig) {
    return Response.json({ error: "Channel not configured" }, { status: 400 });
  }

  // Send via channel adapter
  const adapter = getAdapter(conversation.channel);
  const credentials = JSON.parse(channelConfig.credentials) as Record<string, string>;
  const configData: ChannelConfigData = {
    credentials,
    externalId: channelConfig.externalId,
  };

  const text = message.trim();
  const externalMsgId = await adapter.sendMessage(configData, {
    recipientExternalId: conversation.contactExternalId,
    text,
  });

  // Save message to DB
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: text,
        role: "AGENT",
        externalMsgId: externalMsgId ?? null,
      },
    }),
    prisma.message.updateMany({
      where: { conversationId: conversation.id, role: "USER", readAt: null },
      data: { readAt: new Date() },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messagesCount: { increment: 1 },
        lastMessageAt: new Date(),
        status: "ACTIVE",
      },
    }),
  ]);

  if (conversation.channel === "WEBCHAT") {
    await publish(`webchat:${conversation.id}:events`, {
      type: "agent_message",
      content: text,
      createdAt: new Date().toISOString(),
    });
  }

  return Response.json({ ok: true });
}

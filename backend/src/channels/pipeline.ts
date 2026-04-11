// ─── Unified Inbound Pipeline ───
// Handles messages from any channel: find business → upsert conversation →
// AI response → send outbound → save everything → async analysis.

import { prisma } from "../prisma";
import { buildSystemPrompt, getChatResponse, analyzeConversation } from "../ai";
import { getAdapter } from "./registry";
import { fetchSenderName } from "./messenger";
import type { InboundMessage, ChannelConfigData } from "./types";

const SENTIMENT_MAP = {
  positive: "POSITIVE",
  neutral: "NEUTRAL",
  negative: "NEGATIVE",
} as const;

function parseCredentials(raw: string): Record<string, string> {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid credentials JSON in ChannelConfig");
  }
}

export async function handleInbound(message: InboundMessage): Promise<void> {
  // 1. Find ChannelConfig → identifies which business owns this page/account
  const channelConfig = await prisma.channelConfig.findFirst({
    where: {
      channel: message.channel,
      externalId: message.externalPageId,
      active: true,
    },
    include: { agent: true },
  });

  if (!channelConfig) return;

  // 2. Deduplicate (Meta may retry webhook delivery)
  if (message.externalMsgId) {
    const exists = await prisma.message.findFirst({
      where: { externalMsgId: message.externalMsgId },
    });
    if (exists) return;
  }

  const credentials = parseCredentials(channelConfig.credentials);

  // 3. Resolve sender name via platform API if not provided
  let senderName = message.senderName ?? null;
  if (!senderName && message.channel === "MESSENGER") {
    senderName = await fetchSenderName(message.senderExternalId, credentials.pageAccessToken);
  }

  // 4. Find or create conversation
  const conversation = await prisma.conversation.upsert({
    where: {
      businessId_channel_contactExternalId: {
        businessId: channelConfig.businessId,
        channel: message.channel,
        contactExternalId: message.senderExternalId,
      },
    },
    create: {
      businessId: channelConfig.businessId,
      agentId: channelConfig.agentId,
      channel: message.channel,
      contactExternalId: message.senderExternalId,
      contactName: senderName,
      status: "ACTIVE",
    },
    update: {
      status: "ACTIVE",
      lastMessageAt: new Date(),
      ...(senderName ? { contactName: senderName } : {}),
    },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 20 },
    },
  });

  // 5. Save inbound message
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message.messageText,
        role: "USER",
        externalMsgId: message.externalMsgId ?? null,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { messagesCount: { increment: 1 }, lastMessageAt: new Date() },
    }),
  ]);

  // 6. Generate AI response
  const { agent } = channelConfig;
  const systemContent = buildSystemPrompt({
    agentName: agent.name,
    tone: agent.tone,
    systemPrompt: agent.systemPrompt ?? "",
    knowledgeBase: agent.knowledgeBase ?? "",
  });

  const history = conversation.messages.map((m) => ({
    role: m.role.toLowerCase(),
    content: m.content,
  }));
  history.push({ role: "user", content: message.messageText });

  const aiResponse = await getChatResponse(systemContent, history);
  const isEscalated = aiResponse.includes("[ESCALATE]");
  const cleanResponse = aiResponse.replace("[ESCALATE]", "").trim();

  // 7. Send outbound via channel adapter
  const adapter = getAdapter(message.channel);
  const configData: ChannelConfigData = {
    credentials,
    externalId: channelConfig.externalId,
  };

  const outboundMsgId = await adapter.sendMessage(configData, {
    recipientExternalId: message.senderExternalId,
    text: cleanResponse,
  });

  // 8. Save outbound message + update status
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: cleanResponse,
        role: "AGENT",
        externalMsgId: outboundMsgId ?? null,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messagesCount: { increment: 1 },
        lastMessageAt: new Date(),
        ...(isEscalated ? { status: "ESCALATED" } : {}),
      },
    }),
  ]);

  // 9. Async sentiment analysis (fire-and-forget)
  analyzeConversation([...history, { role: "agent", content: cleanResponse }])
    .then(async (meta) => {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          sentiment: SENTIMENT_MAP[meta.sentiment] ?? "NEUTRAL",
          ...(meta.escalation ? { status: "ESCALATED" } : {}),
        },
      });
    })
    .catch((err) => console.error(`[Pipeline] Analysis failed for ${conversation.id}:`, err));
}

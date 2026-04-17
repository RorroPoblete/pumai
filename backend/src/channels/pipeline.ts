// ─── Unified Inbound Pipeline ───
// Handles messages from any channel: find business → upsert conversation →
// AI response → send outbound → save everything → async analysis.

import { prisma } from "../prisma";
import { buildSystemPrompt, getChatResponse, analyzeConversation } from "../ai";
import { getAdapter } from "./registry";
import type { InboundMessage, ChannelConfigData } from "./types";

const SENTIMENT_MAP = {
  positive: "POSITIVE",
  neutral: "NEUTRAL",
  negative: "NEGATIVE",
} as const;

const CONTEXT_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

function parseCredentials(raw: string): Record<string, string> {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid credentials JSON in ChannelConfig");
  }
}

export interface InboundResult {
  aiResponse: string | null;
  isEscalated: boolean;
  conversationId: string | null;
}

export async function handleInbound(message: InboundMessage): Promise<InboundResult> {
  const empty: InboundResult = { aiResponse: null, isEscalated: false, conversationId: null };

  // 1. Find ChannelConfig → identifies which business owns this page/account
  const channelConfig = await prisma.channelConfig.findFirst({
    where: {
      channel: message.channel,
      externalId: message.externalPageId,
      active: true,
    },
    include: { agent: true },
  });

  if (!channelConfig) return empty;

  // 2. Deduplicate (Meta may retry webhook delivery)
  if (message.externalMsgId) {
    const exists = await prisma.message.findFirst({
      where: { externalMsgId: message.externalMsgId },
    });
    if (exists) return empty;
  }

  const credentials = parseCredentials(channelConfig.credentials);
  const adapter = getAdapter(message.channel);
  const configData: ChannelConfigData = {
    credentials,
    externalId: channelConfig.externalId,
  };

  // 3. Resolve sender name via platform API if not provided
  let senderName = message.senderName ?? null;
  if (!senderName && adapter.fetchSenderName) {
    senderName = await adapter.fetchSenderName(message.senderExternalId, configData);
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
  });

  // 5. Load recent messages for context (last 2 hours, max 30)
  const contextCutoff = new Date(Date.now() - CONTEXT_WINDOW_MS);

  const recentMessages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      createdAt: { gte: contextCutoff },
    },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  // Also check if there are older messages (for context hint to AI)
  const totalMessages = await prisma.message.count({
    where: { conversationId: conversation.id },
  });
  const hasOlderHistory = totalMessages > recentMessages.length;

  // 6. Save inbound message
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

  // 7. Skip AI if human takeover is active
  if (!conversation.aiEnabled) {
    return { aiResponse: null, isEscalated: false, conversationId: conversation.id };
  }

  // 8. Build conversation history for AI
  const { agent } = channelConfig;
  const systemContent = buildSystemPrompt({
    agentName: agent.name,
    tone: agent.tone,
    systemPrompt: agent.systemPrompt ?? "",
    knowledgeBase: agent.knowledgeBase ?? "",
  });

  const history: { role: string; content: string }[] = [];

  if (hasOlderHistory) {
    history.push({
      role: "system",
      content: `This is a returning customer${senderName ? ` (${senderName})` : ""}. There are older messages in this conversation beyond the recent window. Continue naturally — don't re-introduce yourself or ask for information they already provided.`,
    });
  }

  for (const m of recentMessages) {
    history.push({ role: m.role.toLowerCase(), content: m.content });
  }
  history.push({ role: "user", content: message.messageText });

  const aiResponse = await getChatResponse(systemContent, history);
  const isEscalated = aiResponse.includes("[ESCALATE]");
  const cleanResponse = aiResponse.replace("[ESCALATE]", "").trim();

  // 9. Send outbound via channel adapter
  const outboundMsgId = await adapter.sendMessage(configData, {
    recipientExternalId: message.senderExternalId,
    text: cleanResponse,
  });

  // 10. Save outbound message + update status
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: cleanResponse,
        role: "AGENT",
        externalMsgId: outboundMsgId ?? null,
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
        ...(isEscalated ? { status: "ESCALATED" } : {}),
      },
    }),
  ]);

  // 11. Async sentiment analysis (fire-and-forget)
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

  return { aiResponse: cleanResponse, isEscalated, conversationId: conversation.id };
}

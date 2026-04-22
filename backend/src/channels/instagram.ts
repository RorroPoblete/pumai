// ─── Instagram DMs Adapter ───
// Uses Facebook Login API flow (graph.facebook.com v22.0).
// Requires FB Page linked to IG Business/Creator account, and a Page Access Token with scopes:
//   pages_manage_metadata, pages_messaging, instagram_basic, instagram_manage_messages.

import type { ChannelAdapter, ChannelConfigData, InboundMessage, OutboundMessage } from "./types";
import { scoped } from "../logger";

const log = scoped("channel:instagram");
const GRAPH_API = "https://graph.facebook.com/v22.0";

// ─── Webhook Payload Types ───

type MessagingEvent = {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: { mid: string; text?: string; is_echo?: boolean };
  read?: { mid: string };
};

interface WebhookBody {
  object: string;
  entry?: {
    id: string; // IG Business Account ID
    time?: number;
    messaging?: MessagingEvent[];
    changes?: {
      field: string;
      value: MessagingEvent;
    }[];
  }[];
}

// ─── Parse Inbound ───

function parseInbound(body: unknown): InboundMessage[] {
  const payload = body as WebhookBody;
  if (!payload.entry) return [];

  const messages: InboundMessage[] = [];

  for (const entry of payload.entry) {
    const events: MessagingEvent[] = [
      ...(entry.messaging ?? []),
      ...(entry.changes ?? [])
        .filter((c) => c.field === "messages")
        .map((c) => c.value),
    ];

    for (const event of events) {
      if (event.message?.is_echo) continue;
      if (!event.message?.text || !event.sender?.id) continue;

      messages.push({
        channel: "INSTAGRAM",
        externalPageId: entry.id,
        senderExternalId: event.sender.id,
        messageText: event.message.text,
        externalMsgId: event.message.mid,
        timestamp: event.timestamp ?? Date.now(),
      });
    }
  }

  return messages;
}

// ─── Send Outbound ───

function resolveToken(config: ChannelConfigData): string {
  return config.credentials.pageAccessToken || config.credentials.accessToken || "";
}

async function sendMessage(config: ChannelConfigData, message: OutboundMessage): Promise<string | null> {
  const token = resolveToken(config);
  const res = await fetch(`${GRAPH_API}/me/messages?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: message.recipientExternalId },
      message: { text: message.text },
      messaging_type: "RESPONSE",
    }),
  });

  if (!res.ok) {
    log.error({ status: res.status, body: await res.text() }, "send_failed");
    return null;
  }

  const data = (await res.json()) as { message_id?: string };
  return data.message_id ?? null;
}

// ─── Fetch Sender Profile ───

async function fetchSenderName(igsid: string, config: ChannelConfigData): Promise<string | null> {
  try {
    const token = resolveToken(config);
    const res = await fetch(`${GRAPH_API}/${igsid}?fields=name,username&access_token=${token}`);
    if (!res.ok) return null;

    const data = (await res.json()) as { name?: string; username?: string };
    return data.name || data.username || null;
  } catch {
    return null;
  }
}

// ─── Export ───

export const instagramAdapter: ChannelAdapter = {
  channel: "INSTAGRAM",
  parseInbound,
  sendMessage,
  fetchSenderName,
};

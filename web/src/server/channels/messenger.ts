// ─── Facebook Messenger Adapter ───
// Parses Meta webhook payloads and sends messages via Graph API v21.0.

import type { ChannelAdapter, ChannelConfigData, InboundMessage, OutboundMessage } from "./types";
import { scoped } from "../logger";

const log = scoped("channel:messenger");
const GRAPH_API = "https://graph.facebook.com/v22.0";

// ─── Webhook Payload Types ───

interface WebhookBody {
  object: string;
  entry?: {
    id: string; // Page ID
    messaging?: {
      sender: { id: string };
      timestamp: number;
      message?: { mid: string; text?: string; is_echo?: boolean };
    }[];
  }[];
}

// ─── Parse Inbound ───

function parseInbound(body: unknown): InboundMessage[] {
  const payload = body as WebhookBody;
  if (!payload.entry) return [];

  const messages: InboundMessage[] = [];

  for (const entry of payload.entry) {
    for (const event of entry.messaging ?? []) {
      if (event.message?.is_echo) continue; // Skip messages we sent
      if (!event.message?.text) continue;   // Only text messages

      messages.push({
        channel: "MESSENGER",
        externalPageId: entry.id,
        senderExternalId: event.sender.id,
        messageText: event.message.text,
        externalMsgId: event.message.mid,
        timestamp: event.timestamp,
      });
    }
  }

  return messages;
}

// ─── Send Outbound ───

async function sendMessage(config: ChannelConfigData, message: OutboundMessage): Promise<string | null> {
  const res = await fetch(`${GRAPH_API}/${config.externalId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.credentials.pageAccessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: message.recipientExternalId },
      messaging_type: "RESPONSE",
      message: { text: message.text },
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

async function fetchSenderName(psid: string, config: ChannelConfigData): Promise<string | null> {
  try {
    const token = config.credentials.pageAccessToken;
    const res = await fetch(`${GRAPH_API}/${psid}?fields=first_name,last_name`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { first_name?: string; last_name?: string };
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
    return name || null;
  } catch {
    return null;
  }
}

// ─── Export ───

export const messengerAdapter: ChannelAdapter = {
  channel: "MESSENGER",
  parseInbound,
  sendMessage,
  fetchSenderName,
};

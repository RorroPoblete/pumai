// ─── WhatsApp Adapter (via Whapi.cloud) ───
// Parses Whapi webhook payloads and sends messages via Whapi REST API.
// Docs: https://whapi.cloud/docs

import type { ChannelAdapter, ChannelConfigData, InboundMessage, OutboundMessage } from "./types";
import { scoped } from "../logger";

const log = scoped("channel:whatsapp");
const WHAPI_URL = "https://gate.whapi.cloud";

interface WhapiMessage {
  id: string;
  from_me: boolean;
  type: string;
  timestamp: number;
  text?: { body: string };
  from: string;
  from_name?: string;
}

interface WhapiWebhookBody {
  messages?: WhapiMessage[];
  channel_id?: string;
}

function parseInbound(body: unknown): InboundMessage[] {
  const payload = body as WhapiWebhookBody;
  if (!payload.messages?.length || !payload.channel_id) return [];

  const messages: InboundMessage[] = [];

  for (const msg of payload.messages) {
    if (msg.from_me) continue;
    if (msg.type !== "text" || !msg.text?.body) continue;

    messages.push({
      channel: "WHATSAPP",
      externalPageId: payload.channel_id,
      senderExternalId: msg.from,
      senderName: msg.from_name ?? undefined,
      messageText: msg.text.body,
      externalMsgId: msg.id,
      timestamp: msg.timestamp * 1000,
    });
  }

  return messages;
}

async function sendMessage(config: ChannelConfigData, message: OutboundMessage): Promise<string | null> {
  const apiToken = config.credentials.apiToken;

  const res = await fetch(`${WHAPI_URL}/messages/text`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      to: message.recipientExternalId,
      body: message.text,
    }),
  });

  if (!res.ok) {
    log.error({ status: res.status, body: await res.text() }, "send_failed");
    return null;
  }

  const data = (await res.json()) as { id?: string };
  return data.id ?? null;
}

export const whatsappAdapter: ChannelAdapter = {
  channel: "WHATSAPP",
  parseInbound,
  sendMessage,
};

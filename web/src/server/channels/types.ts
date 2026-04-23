// ─── Multi-Channel Types ───

export type Channel = "MESSENGER" | "INSTAGRAM" | "WEBCHAT" | "WHATSAPP";

export const CONTEXT_WINDOW_MS = 2 * 60 * 60 * 1000;

export const SENTIMENT_MAP: Record<string, "POSITIVE" | "NEUTRAL" | "NEGATIVE"> = {
  positive: "POSITIVE",
  neutral: "NEUTRAL",
  negative: "NEGATIVE",
};

export interface InboundMessage {
  channel: Channel;
  externalPageId: string;       // Maps to ChannelConfig.externalId
  senderExternalId: string;     // PSID, IGSID, phone, session ID
  senderName?: string;
  messageText: string;
  externalMsgId?: string;       // For deduplication
  timestamp: number;
}

export interface OutboundMessage {
  recipientExternalId: string;
  text: string;
}

export interface ChannelConfigData {
  credentials: Record<string, string>;
  externalId: string;
}

export interface ChannelAdapter {
  channel: Channel;
  parseInbound(body: unknown): InboundMessage[];
  sendMessage(config: ChannelConfigData, message: OutboundMessage): Promise<string | null>;
  fetchSenderName?(senderId: string, config: ChannelConfigData): Promise<string | null>;
}

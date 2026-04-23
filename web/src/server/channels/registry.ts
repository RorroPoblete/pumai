// ─── Channel Adapter Registry ───

import type { Channel, ChannelAdapter } from "./types";
import { messengerAdapter } from "./messenger";
import { instagramAdapter } from "./instagram";
import { webchatAdapter } from "./webchat";
import { whatsappAdapter } from "./whatsapp";

const adapters: Record<string, ChannelAdapter> = {
  MESSENGER: messengerAdapter,
  INSTAGRAM: instagramAdapter,
  WEBCHAT: webchatAdapter,
  WHATSAPP: whatsappAdapter,
};

export function getAdapter(channel: Channel): ChannelAdapter {
  const adapter = adapters[channel];
  if (!adapter) throw new Error(`No adapter for channel: ${channel}`);
  return adapter;
}

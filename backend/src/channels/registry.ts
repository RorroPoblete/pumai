// ─── Channel Adapter Registry ───

import type { Channel, ChannelAdapter } from "./types";
import { messengerAdapter } from "./messenger";

const adapters: Record<string, ChannelAdapter> = {
  MESSENGER: messengerAdapter,
};

export function getAdapter(channel: Channel): ChannelAdapter {
  const adapter = adapters[channel];
  if (!adapter) throw new Error(`No adapter for channel: ${channel}`);
  return adapter;
}

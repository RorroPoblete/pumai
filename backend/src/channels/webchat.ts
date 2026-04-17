// ─── Webchat Adapter ───
// Unlike Messenger/Instagram, webchat responses go back in the HTTP response
// to the browser widget, not pushed via an external API. sendMessage is a no-op;
// the API route reads the AI response from the pipeline result and returns it.

import type { ChannelAdapter } from "./types";

export const webchatAdapter: ChannelAdapter = {
  channel: "WEBCHAT",
  parseInbound: () => [],
  sendMessage: async () => null,
};

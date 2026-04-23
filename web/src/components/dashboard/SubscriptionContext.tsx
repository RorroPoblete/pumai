"use client";

import { createContext, useContext } from "react";
import type { ChannelKey, PlanTier } from "@/lib/stripe";

export interface ChannelAccessState {
  channel: ChannelKey;
  tier: PlanTier;
  status: string | null;
  allowed: boolean;
  conversationsUsed: number;
  conversationsLimit: number | null;
  atLimit: boolean;
  reason: string;
}

export interface ChannelsState {
  channels: Record<ChannelKey, ChannelAccessState>;
  hasAnyPaid: boolean;
}

const Ctx = createContext<ChannelsState | null>(null);

export function ChannelsProvider({ value, children }: { value: ChannelsState; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChannels(): ChannelsState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useChannels must be inside ChannelsProvider");
  return v;
}

export function useChannel(channel: ChannelKey): ChannelAccessState {
  return useChannels().channels[channel];
}

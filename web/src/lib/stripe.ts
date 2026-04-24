import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: "2026-03-25.dahlia" as any,
    typescript: true,
    appInfo: { name: "PumAI", url: "https://pumai.com.au" },
  });
  return _stripe;
}

export type ChannelKey = "WEBCHAT" | "MESSENGER" | "INSTAGRAM" | "WHATSAPP";
export type PlanTier = "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
export type PaidTier = Exclude<PlanTier, "FREE">;

export interface TierConfig {
  readonly label: string;
  readonly priceId: string;
  readonly price: number;
  readonly conversationsLimit: number | null;
  readonly setupFee: number;
}

export interface AddonConfig {
  readonly priceId: string;
  readonly price: number;
  readonly conversationsLimit: number;
}

export interface ChannelCatalog {
  readonly label: string;
  readonly color: string;
  readonly subtitle: string;
  readonly free: { readonly conversationsLimit: number } | null;
  readonly tiers: Record<PaidTier, TierConfig>;
  readonly addon: AddonConfig;
}

const env = (k: string) => process.env[k] ?? "";

export const CHANNEL_CATALOG: Readonly<Record<ChannelKey, ChannelCatalog>> = {
  WEBCHAT: {
    label: "Webchat",
    color: "#8B5CF6",
    subtitle: "Embed AI chat on your website",
    free: { conversationsLimit: 10 },
    tiers: {
      STARTER:    { label: "Starter", priceId: env("STRIPE_PRICE_WEBCHAT_STARTER"),    price: 99,  conversationsLimit: 500,  setupFee: 0 },
      GROWTH:     { label: "Growth",  priceId: env("STRIPE_PRICE_WEBCHAT_GROWTH"),     price: 299, conversationsLimit: 2000, setupFee: 300 },
      ENTERPRISE: { label: "Scale",   priceId: env("STRIPE_PRICE_WEBCHAT_ENTERPRISE"), price: 599, conversationsLimit: null, setupFee: 0 },
    },
    addon: { priceId: env("STRIPE_PRICE_WEBCHAT_ADDON"), price: 350, conversationsLimit: 2000 },
  },
  WHATSAPP: {
    label: "WhatsApp",
    color: "#3b82f6",
    subtitle: "WhatsApp Business messaging",
    free: null,
    tiers: {
      STARTER:    { label: "Starter", priceId: env("STRIPE_PRICE_WA_STARTER"),    price: 199, conversationsLimit: 500,  setupFee: 500 },
      GROWTH:     { label: "Growth",  priceId: env("STRIPE_PRICE_WA_GROWTH"),     price: 499, conversationsLimit: 2000, setupFee: 900 },
      ENTERPRISE: { label: "Scale",   priceId: env("STRIPE_PRICE_WA_ENTERPRISE"), price: 899, conversationsLimit: null, setupFee: 0 },
    },
    addon: { priceId: env("STRIPE_PRICE_WA_ADDON"), price: 350, conversationsLimit: 2000 },
  },
  INSTAGRAM: {
    label: "Instagram",
    color: "#E1306C",
    subtitle: "Instagram DMs + story mentions",
    free: null,
    tiers: {
      STARTER:    { label: "Starter", priceId: env("STRIPE_PRICE_IG_STARTER"),    price: 129, conversationsLimit: 500,  setupFee: 300 },
      GROWTH:     { label: "Growth",  priceId: env("STRIPE_PRICE_IG_GROWTH"),     price: 349, conversationsLimit: 2000, setupFee: 600 },
      ENTERPRISE: { label: "Scale",   priceId: env("STRIPE_PRICE_IG_ENTERPRISE"), price: 699, conversationsLimit: null, setupFee: 0 },
    },
    addon: { priceId: env("STRIPE_PRICE_IG_ADDON"), price: 350, conversationsLimit: 2000 },
  },
  MESSENGER: {
    label: "Messenger",
    color: "#4285F4",
    subtitle: "Facebook Page messages",
    free: null,
    tiers: {
      STARTER:    { label: "Starter", priceId: env("STRIPE_PRICE_MSG_STARTER"),    price: 129, conversationsLimit: 500,  setupFee: 300 },
      GROWTH:     { label: "Growth",  priceId: env("STRIPE_PRICE_MSG_GROWTH"),     price: 349, conversationsLimit: 2000, setupFee: 600 },
      ENTERPRISE: { label: "Scale",   priceId: env("STRIPE_PRICE_MSG_ENTERPRISE"), price: 699, conversationsLimit: null, setupFee: 0 },
    },
    addon: { priceId: env("STRIPE_PRICE_MSG_ADDON"), price: 350, conversationsLimit: 2000 },
  },
} as const;

export const CHANNEL_KEYS: readonly ChannelKey[] = ["WEBCHAT", "MESSENGER", "INSTAGRAM", "WHATSAPP"];
export const PAID_TIERS: readonly PaidTier[] = ["STARTER", "GROWTH", "ENTERPRISE"];
export const TIER_ORDER: readonly PlanTier[] = ["FREE", "STARTER", "GROWTH", "ENTERPRISE"];

export const BUNDLE_SETUP_FEE = 350;

export function computeSetupFee(items: Array<{ channel: ChannelKey; tier: PaidTier }>): number {
  if (items.length === 0) return 0;
  if (items.length === 1) return CHANNEL_CATALOG[items[0].channel].tiers[items[0].tier].setupFee;
  return BUNDLE_SETUP_FEE;
}

export interface ResolvedPrice {
  channel: ChannelKey;
  tier: PaidTier;
  isAddon: boolean;
}

export function resolveTierByPriceId(priceId: string): ResolvedPrice | null {
  for (const channel of CHANNEL_KEYS) {
    const catalog = CHANNEL_CATALOG[channel];
    for (const tier of PAID_TIERS) {
      if (catalog.tiers[tier].priceId === priceId) return { channel, tier, isAddon: false };
    }
    if (catalog.addon.priceId && catalog.addon.priceId === priceId) {
      return { channel, tier: "GROWTH", isAddon: true };
    }
  }
  return null;
}

export function getConversationsLimit(channel: ChannelKey, tier: PlanTier): number | null {
  if (tier === "FREE") return CHANNEL_CATALOG[channel].free?.conversationsLimit ?? 0;
  return CHANNEL_CATALOG[channel].tiers[tier].conversationsLimit;
}

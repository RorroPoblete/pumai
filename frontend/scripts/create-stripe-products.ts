/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY env var is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia" as any,
});

type Tier = "STARTER" | "GROWTH" | "ENTERPRISE";

interface Plan {
  channel: "WEBCHAT" | "WA" | "IG" | "MSG";
  channelLabel: string;
  tier: Tier;
  tierLabel: string;
  priceCents: number;
  conversations: string;
}

const plans: Plan[] = [
  { channel: "WEBCHAT", channelLabel: "Webchat",   tier: "STARTER",    tierLabel: "Starter",    priceCents:  9900, conversations: "500 sessions/month" },
  { channel: "WEBCHAT", channelLabel: "Webchat",   tier: "GROWTH",     tierLabel: "Growth",     priceCents: 24900, conversations: "2,000 sessions/month" },
  { channel: "WEBCHAT", channelLabel: "Webchat",   tier: "ENTERPRISE", tierLabel: "Enterprise", priceCents: 59900, conversations: "Unlimited sessions" },
  { channel: "WA",      channelLabel: "WhatsApp",  tier: "STARTER",    tierLabel: "Starter",    priceCents: 19900, conversations: "500 conversations/month" },
  { channel: "WA",      channelLabel: "WhatsApp",  tier: "GROWTH",     tierLabel: "Growth",     priceCents: 44900, conversations: "2,000 conversations/month" },
  { channel: "WA",      channelLabel: "WhatsApp",  tier: "ENTERPRISE", tierLabel: "Enterprise", priceCents: 99900, conversations: "Unlimited conversations" },
  { channel: "IG",      channelLabel: "Instagram", tier: "STARTER",    tierLabel: "Starter",    priceCents: 12900, conversations: "500 DM conversations/month" },
  { channel: "IG",      channelLabel: "Instagram", tier: "GROWTH",     tierLabel: "Growth",     priceCents: 34900, conversations: "2,000 DM conversations/month" },
  { channel: "IG",      channelLabel: "Instagram", tier: "ENTERPRISE", tierLabel: "Enterprise", priceCents: 79900, conversations: "Unlimited conversations" },
  { channel: "MSG",     channelLabel: "Messenger", tier: "STARTER",    tierLabel: "Starter",    priceCents: 11900, conversations: "500 conversations/month" },
  { channel: "MSG",     channelLabel: "Messenger", tier: "GROWTH",     tierLabel: "Growth",     priceCents: 32900, conversations: "2,000 conversations/month" },
  { channel: "MSG",     channelLabel: "Messenger", tier: "ENTERPRISE", tierLabel: "Enterprise", priceCents: 74900, conversations: "Unlimited conversations" },
];

interface Addon {
  channel: "WEBCHAT" | "WA" | "IG" | "MSG";
  channelLabel: string;
}

const addons: Addon[] = [
  { channel: "WEBCHAT", channelLabel: "Webchat" },
  { channel: "WA",      channelLabel: "WhatsApp" },
  { channel: "IG",      channelLabel: "Instagram" },
  { channel: "MSG",     channelLabel: "Messenger" },
];

async function main() {
  console.log("Creating 12 Stripe products + prices (AUD / monthly)...\n");

  const envLines: string[] = [];

  for (const p of plans) {
    const product = await stripe.products.create({
      name: `PumAI ${p.channelLabel} ${p.tierLabel}`,
      description: p.conversations,
      metadata: { channel: p.channel, tier: p.tier },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: p.priceCents,
      currency: "aud",
      recurring: { interval: "month" },
      metadata: { channel: p.channel, tier: p.tier },
    });

    const envKey = `STRIPE_PRICE_${p.channel}_${p.tier}`;
    console.log(`${envKey}=${price.id}`);
    envLines.push(`${envKey}=${price.id}`);
  }

  console.log("\nCreating 4 add-on prices (omnichannel, A$350/mo)...\n");

  for (const a of addons) {
    const product = await stripe.products.create({
      name: `PumAI ${a.channelLabel} Add-on`,
      description: "Additional channel for existing subscription (Growth tier, 2,000 conversations/month)",
      metadata: { channel: a.channel, tier: "ADDON" },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 35000,
      currency: "aud",
      recurring: { interval: "month" },
      metadata: { channel: a.channel, tier: "ADDON" },
    });

    const envKey = `STRIPE_PRICE_${a.channel}_ADDON`;
    console.log(`${envKey}=${price.id}`);
    envLines.push(`${envKey}=${price.id}`);
  }

  console.log("\n— Copy the lines above into your .env —");
  console.log(envLines.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

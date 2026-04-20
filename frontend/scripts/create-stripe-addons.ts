/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY env var is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia" as any,
});

const addons = [
  { channel: "WEBCHAT", channelLabel: "Webchat" },
  { channel: "WA",      channelLabel: "WhatsApp" },
  { channel: "IG",      channelLabel: "Instagram" },
  { channel: "MSG",     channelLabel: "Messenger" },
];

async function main() {
  console.log("Creating 4 omnichannel add-on prices (A$350/mo each)...\n");
  const lines: string[] = [];

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
    lines.push(`${envKey}=${price.id}`);
  }

  console.log("\n— Copy into your .env —");
  console.log(lines.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

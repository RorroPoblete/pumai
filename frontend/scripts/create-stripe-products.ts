import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY env var is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia" as any,
});

const plans = [
  {
    key: "STARTER",
    name: "PumAI Starter",
    description: "500 conversations/month · 1 AI agent · All 4 channels",
    amount: 9900,
  },
  {
    key: "GROWTH",
    name: "PumAI Growth",
    description: "2,000 conversations/month · 5 AI agents · All 4 channels · Priority support",
    amount: 24900,
  },
  {
    key: "ENTERPRISE",
    name: "PumAI Enterprise",
    description: "Unlimited conversations · Unlimited agents · All 4 channels · Dedicated support",
    amount: 59900,
  },
];

async function main() {
  console.log("Creating Stripe products and prices...\n");

  for (const plan of plans) {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: "aud",
      recurring: { interval: "month" },
    });

    console.log(`${plan.key}: ${price.id}`);
  }

  console.log("\nAdd these to frontend/.env.local:");
  console.log("(re-run to see all IDs above)");
}

main().catch(console.error);

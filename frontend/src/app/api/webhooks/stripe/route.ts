import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/backend/prisma";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

const PLAN_BY_PRICE: Record<string, "STARTER" | "GROWTH" | "ENTERPRISE"> = {
  [process.env.STRIPE_PRICE_STARTER ?? ""]: "STARTER",
  [process.env.STRIPE_PRICE_GROWTH ?? ""]: "GROWTH",
  [process.env.STRIPE_PRICE_ENTERPRISE ?? ""]: "ENTERPRISE",
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const businessId = session.metadata?.businessId;
  const plan = session.metadata?.plan as "STARTER" | "GROWTH" | "ENTERPRISE" | undefined;
  if (!businessId || !plan) return;

  const sub = await getStripe().subscriptions.retrieve(session.subscription as string);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      plan,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price.id ?? null,
      stripeStatus: sub.status,
    },
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const businessId = sub.metadata?.businessId;
  if (!businessId) return;

  const priceId = sub.items.data[0]?.price.id ?? "";
  const plan = PLAN_BY_PRICE[priceId];

  await prisma.business.update({
    where: { id: businessId },
    data: {
      ...(plan && { plan }),
      stripePriceId: priceId,
      stripeStatus: sub.status,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const businessId = sub.metadata?.businessId;
  if (!businessId) return;

  await prisma.business.update({
    where: { id: businessId },
    data: {
      plan: "STARTER",
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeStatus: "canceled",
    },
  });
}

"use server";

import { prisma } from "./prisma";
import { requireAuth, getActiveBusinessId } from "./auth-utils";
import { getStripe, PLANS, type PlanKey } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";

async function getBusinessId(): Promise<string> {
  const id = await getActiveBusinessId();
  if (!id) throw new Error("No active business");
  return id;
}

export async function createCheckoutSession(plan: PlanKey): Promise<{ url: string }> {
  await requireAuth();
  const businessId = await getBusinessId();

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: { user: { select: { email: true } } },
  });
  const planConfig = PLANS[plan];
  const stripe = getStripe();

  let customerId = business.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: business.user?.email,
      name: business.name,
      metadata: { businessId },
    });
    customerId = customer.id;
    await prisma.business.update({
      where: { id: businessId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/billing?success=1`,
    cancel_url: `${APP_URL}/dashboard/billing`,
    metadata: { businessId, plan },
    subscription_data: { metadata: { businessId, plan } },
  });

  return { url: session.url! };
}

export async function createBillingPortal(): Promise<{ url: string }> {
  await requireAuth();
  const businessId = await getBusinessId();

  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });

  if (!business.stripeCustomerId) throw new Error("No Stripe customer found");

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripeCustomerId,
    return_url: `${APP_URL}/dashboard/billing`,
  });

  return { url: session.url };
}

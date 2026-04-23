"use server";

import type Stripe from "stripe";
import { prisma } from "./prisma";
import { requireAuth, getActiveBusinessId } from "./auth-utils";
import {
  getStripe,
  CHANNEL_CATALOG,
  BUNDLE_SETUP_FEE,
  resolveTierByPriceId,
  type ChannelKey,
} from "@/lib/stripe";
import type { Channel } from "@/generated/prisma/enums";
import { BillingError, type CartItem } from "./billing-types";

// ─── Helpers ───

const ACTIVE_STATUSES = ["active", "trialing"] as const;

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3002";
}

async function requireBusinessId(): Promise<string> {
  const id = await getActiveBusinessId();
  if (!id) throw new BillingError("No active business", "no_business");
  return id;
}

async function ensureStripeCustomer(businessId: string): Promise<string> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    include: { user: { select: { email: true } } },
  });

  if (business.stripeCustomerId) return business.stripeCustomerId;

  const customer = await getStripe().customers.create(
    {
      email: business.user?.email ?? undefined,
      name: business.name,
      metadata: { businessId },
    },
    { idempotencyKey: `customer:create:${businessId}` },
  );

  const updated = await prisma.business
    .update({
      where: { id: businessId, stripeCustomerId: null },
      data: { stripeCustomerId: customer.id },
    })
    .catch(async () => prisma.business.findUniqueOrThrow({ where: { id: businessId } }));

  return updated.stripeCustomerId ?? customer.id;
}

type LineItem = {
  price?: string;
  price_data?: {
    currency: "aud";
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number;
};

function setupFeeLineItem(name: string, amountAud: number): LineItem {
  return {
    price_data: {
      currency: "aud",
      product_data: { name },
      unit_amount: amountAud * 100,
    },
    quantity: 1,
  };
}

function buildCartLineItems(items: CartItem[]): LineItem[] {
  const lineItems: LineItem[] = items.map((i) => ({
    price: CHANNEL_CATALOG[i.channel].tiers[i.tier].priceId,
    quantity: 1,
  }));

  if (items.length === 1) {
    const { channel, tier } = items[0];
    const cfg = CHANNEL_CATALOG[channel].tiers[tier];
    if (cfg.setupFee > 0) {
      lineItems.push(setupFeeLineItem(
        `${CHANNEL_CATALOG[channel].label} ${cfg.label} setup fee (one-time)`,
        cfg.setupFee,
      ));
    }
  } else {
    lineItems.push(setupFeeLineItem(
      `Omnichannel bundle setup fee (${items.length} channels, one-time)`,
      BUNDLE_SETUP_FEE,
    ));
  }

  return lineItems;
}

async function findActiveChannels(businessId: string, channels: ChannelKey[]): Promise<ChannelKey[]> {
  const rows = await prisma.subscription.findMany({
    where: {
      businessId,
      channel: { in: channels as Channel[] },
      stripeStatus: { in: [...ACTIVE_STATUSES] },
    },
    select: { channel: true },
  });
  return rows.map((r) => r.channel as ChannelKey);
}

async function hasAnyActiveSubscription(businessId: string): Promise<boolean> {
  const count = await prisma.subscription.count({
    where: { businessId, stripeStatus: { in: [...ACTIVE_STATUSES] } },
  });
  return count > 0;
}

// ─── Upsert (shared between webhook and sync) ───

export async function upsertSubscriptionFromStripe(
  businessId: string,
  sub: Stripe.Subscription,
): Promise<number> {
  let count = 0;
  for (const item of sub.items.data) {
    const resolved = resolveTierByPriceId(item.price.id);
    if (!resolved) continue;

    await prisma.subscription.upsert({
      where: { businessId_channel: { businessId, channel: resolved.channel as Channel } },
      create: {
        businessId,
        channel: resolved.channel as Channel,
        tier: resolved.tier,
        stripeSubscriptionId: sub.id,
        stripeItemId: item.id,
        stripePriceId: item.price.id,
        stripeStatus: sub.status,
      },
      update: {
        tier: resolved.tier,
        stripeSubscriptionId: sub.id,
        stripeItemId: item.id,
        stripePriceId: item.price.id,
        stripeStatus: sub.status,
      },
    });
    count++;
  }
  return count;
}

// ─── Checkout Sessions ───

export async function createCartCheckoutSession(items: CartItem[]): Promise<{ url: string }> {
  await requireAuth();
  const businessId = await requireBusinessId();

  if (!items.length) throw new BillingError("No items selected", "invalid_cart");

  const channels = items.map((i) => i.channel);
  if (new Set(channels).size !== items.length) {
    throw new BillingError("Cannot subscribe to the same channel twice", "invalid_cart");
  }

  for (const { channel, tier } of items) {
    const cfg = CHANNEL_CATALOG[channel].tiers[tier];
    if (!cfg.priceId) {
      throw new BillingError(`Stripe price ID for ${channel} ${tier} is not configured`, "not_configured");
    }
  }

  const alreadyActive = await findActiveChannels(businessId, channels);
  if (alreadyActive.length > 0) {
    const biz = await prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { stripeCustomerId: true } });
    if (biz.stripeCustomerId) return createBillingPortal();
  }

  const customerId = await ensureStripeCustomer(businessId);
  const base = appUrl();
  const cartDigest = items.map((i) => `${i.channel}:${i.tier}`).sort().join(",");

  const session = await getStripe().checkout.sessions.create(
    {
      customer: customerId,
      mode: "subscription",
      line_items: buildCartLineItems(items),
      success_url: `${base}/dashboard/billing?success=1`,
      cancel_url: `${base}/dashboard/billing?cancelled=1`,
      client_reference_id: businessId,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { name: "auto", address: "auto" },
      metadata: { businessId, kind: "cart", items: cartDigest },
      subscription_data: { metadata: { businessId, kind: "cart", items: cartDigest } },
    },
    { idempotencyKey: `cart:${businessId}:${cartDigest}:${Date.now()}` },
  );

  if (!session.url) throw new BillingError("Stripe did not return a checkout URL", "not_configured");
  return { url: session.url };
}

export async function createAddonCheckoutSession(channel: ChannelKey): Promise<{ url: string }> {
  await requireAuth();
  const businessId = await requireBusinessId();

  const addon = CHANNEL_CATALOG[channel].addon;
  if (!addon.priceId) {
    throw new BillingError(`Add-on price for ${channel} is not configured`, "not_configured");
  }

  if (!(await hasAnyActiveSubscription(businessId))) {
    throw new BillingError("Add-on pricing requires an existing active subscription", "invalid_cart");
  }

  const [active] = await findActiveChannels(businessId, [channel]);
  if (active) {
    const biz = await prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { stripeCustomerId: true } });
    if (biz.stripeCustomerId) return createBillingPortal();
  }

  const customerId = await ensureStripeCustomer(businessId);
  const base = appUrl();

  const session = await getStripe().checkout.sessions.create(
    {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: addon.priceId, quantity: 1 }],
      success_url: `${base}/dashboard/billing?success=1&channel=${channel}`,
      cancel_url: `${base}/dashboard/billing?cancelled=1`,
      client_reference_id: businessId,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { name: "auto", address: "auto" },
      metadata: { businessId, channel, tier: "GROWTH", kind: "addon" },
      subscription_data: { metadata: { businessId, channel, tier: "GROWTH", kind: "addon" } },
    },
    { idempotencyKey: `addon:${businessId}:${channel}:${Date.now()}` },
  );

  if (!session.url) throw new BillingError("Stripe did not return a checkout URL", "not_configured");
  return { url: session.url };
}

export async function createBillingPortal(): Promise<{ url: string }> {
  await requireAuth();
  const businessId = await requireBusinessId();

  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  if (!business.stripeCustomerId) {
    return { url: `${appUrl()}/dashboard/billing` };
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: business.stripeCustomerId,
    return_url: `${appUrl()}/dashboard/billing`,
  });

  return { url: session.url };
}

// ─── Recovery / Sync ───

export async function syncSubscriptionsFromStripe(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { stripeCustomerId: true },
  });
  if (!business?.stripeCustomerId) return;

  const subs = await getStripe().subscriptions.list({
    customer: business.stripeCustomerId,
    status: "all",
    limit: 20,
  });

  for (const sub of subs.data) {
    await upsertSubscriptionFromStripe(businessId, sub);
  }
}

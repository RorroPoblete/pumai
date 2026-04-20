import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/backend/prisma";
import { upsertSubscriptionFromStripe } from "@/backend/billing-actions";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ─── Logging ───

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, evt: string, meta: Record<string, unknown> = {}) {
  const payload = JSON.stringify({ scope: "stripe-webhook", evt, ...meta });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

// ─── Error classes ───

class PermanentWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentWebhookError";
  }
}

// ─── Entry point ───

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    log("error", "missing_webhook_secret");
    return new Response("Webhook not configured", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    log("warn", "invalid_signature", { message: err instanceof Error ? err.message : String(err) });
    return new Response("Invalid signature", { status: 400 });
  }

  const seen = await prisma.processedWebhookEvent.findUnique({ where: { id: event.id } });
  if (seen) return Response.json({ received: true, duplicate: true });

  try {
    await dispatch(event);
    await prisma.processedWebhookEvent.create({ data: { id: event.id, type: event.type } });
    return Response.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const permanent = err instanceof PermanentWebhookError;
    log(permanent ? "warn" : "error", "handler_error", {
      eventId: event.id, type: event.type, permanent, message,
    });

    if (permanent) {
      await prisma.processedWebhookEvent.create({ data: { id: event.id, type: event.type } });
      return Response.json({ received: true, permanentFailure: true });
    }
    return new Response("Handler error", { status: 500 });
  }
}

async function dispatch(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    case "customer.subscription.created":
    case "customer.subscription.updated":
      return handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    case "invoice.payment_succeeded":
      return handlePaymentSucceeded(event.data.object as Stripe.Invoice);
    case "invoice.payment_failed":
      return handlePaymentFailed(event.data.object as Stripe.Invoice);
    default:
      log("info", "unhandled_event", { eventId: event.id, type: event.type });
  }
}

// ─── Business lookup ───

async function businessByCustomerId(customerId: string): Promise<string | null> {
  const biz = await prisma.business.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return biz?.id ?? null;
}

function extractCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function resolveBusinessId(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.businessId) return sub.metadata.businessId;
  const customerId = extractCustomerId(sub.customer);
  return customerId ? businessByCustomerId(customerId) : null;
}

// ─── Handlers ───

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const businessId = session.metadata?.businessId
    ?? (extractCustomerId(session.customer) && await businessByCustomerId(extractCustomerId(session.customer)!));

  if (!businessId) {
    log("warn", "checkout_no_business", { sessionId: session.id });
    return;
  }

  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subId) throw new PermanentWebhookError("checkout.session missing subscription id");

  const sub = await getStripe().subscriptions.retrieve(subId);
  const upserted = await upsertSubscriptionFromStripe(businessId, sub);
  if (upserted === 0) {
    log("warn", "checkout_no_items_resolved", { sessionId: session.id, subId });
  }
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const businessId = await resolveBusinessId(sub);
  if (!businessId) {
    log("warn", "subscription_no_business", { subId: sub.id });
    return;
  }
  await upsertSubscriptionFromStripe(businessId, sub);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      tier: "FREE",
      stripeSubscriptionId: null,
      stripeItemId: null,
      stripePriceId: null,
      stripeStatus: "canceled",
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = extractCustomerId(invoice.customer);
  if (!customerId) return;
  const businessId = await businessByCustomerId(customerId);
  if (!businessId) return;

  await prisma.subscription.updateMany({
    where: { businessId, stripeStatus: { in: ["past_due", "unpaid"] } },
    data: { stripeStatus: "active" },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subId = (invoice as any).subscription as string | null;
  if (!subId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subId },
    data: { stripeStatus: "past_due" },
  });
}

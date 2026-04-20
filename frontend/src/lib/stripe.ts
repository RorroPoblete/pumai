import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: "2026-03-25.dahlia" as any,
    });
  }
  return _stripe;
}

export const PLANS = {
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER ?? "",
    conversationsLimit: 500,
    price: 99,
    currency: "AUD",
  },
  GROWTH: {
    name: "Growth",
    priceId: process.env.STRIPE_PRICE_GROWTH ?? "",
    conversationsLimit: 2000,
    price: 249,
    currency: "AUD",
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
    conversationsLimit: null,
    price: 599,
    currency: "AUD",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

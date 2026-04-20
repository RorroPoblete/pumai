import type { ChannelKey, PaidTier } from "@/lib/stripe";

export interface CartItem {
  readonly channel: ChannelKey;
  readonly tier: PaidTier;
}

export type BillingErrorCode =
  | "no_business"
  | "not_configured"
  | "no_customer"
  | "invalid_cart"
  | "already_active";

export class BillingError extends Error {
  constructor(message: string, readonly code: BillingErrorCode) {
    super(message);
    this.name = "BillingError";
  }
}

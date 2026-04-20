import { redirect } from "next/navigation";
import { getActiveBusinessId } from "@/backend/auth-utils";
import { getBillingData } from "@/backend/billing-queries";
import { syncSubscriptionsFromStripe } from "@/backend/billing-actions";
import BillingClient from "./billing-client";

interface Props {
  searchParams: Promise<{ success?: string; cancelled?: string; channel?: string }>;
}

export default async function BillingPage({ searchParams }: Props) {
  const businessId = await getActiveBusinessId();
  if (!businessId) redirect("/login");

  const params = await searchParams;

  if (params.success === "1") {
    try {
      await syncSubscriptionsFromStripe(businessId);
    } catch (err) {
      console.error("[billing] sync failed", err);
    }
  }

  const billing = await getBillingData(businessId);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Billing & Plans</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Pay per channel — each subscription unlocks only that channel.</p>
      </div>
      <BillingClient
        {...billing}
        success={params.success === "1"}
        cancelled={params.cancelled === "1"}
        successChannel={params.channel ?? null}
      />
    </div>
  );
}

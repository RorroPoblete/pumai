import { redirect } from "next/navigation";
import { getActiveBusinessId } from "@/server/auth-utils";
import { getBillingData } from "@/server/billing-queries";
import { syncSubscriptionsFromStripe } from "@/server/billing-actions";
import BillingClient from "./billing-client";
import TopBar from "@/components/dashboard/TopBar";

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
    <>
      <TopBar title="Billing & Plans" />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto w-full">
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
      </div>
    </>
  );
}

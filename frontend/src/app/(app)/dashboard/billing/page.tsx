import { getActiveBusinessId } from "@/backend/auth-utils";
import { getBillingData } from "@/backend/billing-queries";
import BillingClient from "./billing-client";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ success?: string }>;
}

export default async function BillingPage({ searchParams }: Props) {
  const businessId = await getActiveBusinessId();
  if (!businessId) redirect("/login");

  const params = await searchParams;
  const billing = await getBillingData(businessId);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Billing & Plans</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Manage your subscription and usage.</p>
      </div>
      <BillingClient
        {...billing}
        success={params.success === "1"}
      />
    </div>
  );
}

import Sidebar from "@/components/dashboard/Sidebar";
import { getBusinessSummary, getActiveBusiness, getAvailableTenants } from "@/backend/queries";
import { getSessionContext } from "@/backend/auth-utils";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  const isSuperadmin = ctx?.role === "SUPERADMIN";

  const [summary, tenants, activeBusiness] = await Promise.all([
    getBusinessSummary(),
    getAvailableTenants(),
    getActiveBusiness(),
  ]);

  return (
    <div className="min-h-screen bg-black">
      <Sidebar
        plan={summary?.plan ?? "STARTER"}
        conversationsUsed={summary?.conversationsUsed ?? 0}
        conversationsLimit={summary?.conversationsLimit ?? 300}
        tenants={tenants}
        activeBusinessId={activeBusiness?.id ?? null}
        activeBusinessName={activeBusiness?.name ?? null}
        isSuperadmin={isSuperadmin}
      />
      <div className="lg:ml-60 min-h-screen flex flex-col">{children}</div>
    </div>
  );
}

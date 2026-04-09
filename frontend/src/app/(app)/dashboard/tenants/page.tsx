import { getAdminBusinesses, getAdminOverview } from "@/backend/admin-queries";
import TopBar from "@/components/dashboard/TopBar";
import TenantsList from "./tenants-list";
import { getSessionContext } from "@/backend/auth-utils";
import { redirect } from "next/navigation";

export default async function TenantsPage() {
  const ctx = await getSessionContext();
  if (ctx?.role !== "SUPERADMIN") redirect("/dashboard");

  const [businesses, overview] = await Promise.all([
    getAdminBusinesses(),
    getAdminOverview(),
  ]);

  return (
    <>
      <TopBar title="Tenant Management" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {overview && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Tenants", value: overview.totalBusinesses },
              { label: "Users", value: overview.totalUsers },
              { label: "Conversations", value: overview.totalConversations },
              { label: "Messages", value: overview.totalMessages },
              { label: "Agents", value: overview.totalAgents },
            ].map((kpi) => (
              <div key={kpi.label} className="card-gradient border border-[rgba(239,68,68,0.1)] rounded-xl p-4">
                <div className="text-[10px] font-medium text-[#71717A] uppercase tracking-wider mb-1">{kpi.label}</div>
                <div className="text-xl font-black text-white">{kpi.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
        <TenantsList businesses={businesses} />
      </div>
    </>
  );
}

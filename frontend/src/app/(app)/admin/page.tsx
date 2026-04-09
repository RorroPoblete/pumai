import { getAdminOverview } from "@/backend/admin-queries";
import TopBar from "@/frontend/components/dashboard/TopBar";

export default async function AdminOverviewPage() {
  const data = await getAdminOverview();

  if (!data) {
    return (
      <>
        <TopBar title="Admin" />
        <div className="flex-1 flex items-center justify-center text-[#71717A] text-sm">
          Unauthorized.
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Platform Overview" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Businesses", value: data.totalBusinesses },
            { label: "Users", value: data.totalUsers },
            { label: "Conversations", value: data.totalConversations },
            { label: "Messages", value: data.totalMessages },
            { label: "Agents", value: data.totalAgents },
          ].map((kpi) => (
            <div key={kpi.label} className="card-gradient border border-[rgba(239,68,68,0.1)] rounded-xl p-5">
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider mb-2">{kpi.label}</div>
              <div className="text-2xl font-black text-white">{kpi.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Plan Breakdown */}
        <div className="card-gradient border border-[rgba(239,68,68,0.1)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Plan Distribution</h3>
          <div className="flex gap-6">
            {data.planBreakdown.map((p) => (
              <div key={p.plan} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  p.plan === "ENTERPRISE" ? "bg-[#8B5CF6]" : p.plan === "GROWTH" ? "bg-[#3b82f6]" : "bg-[#71717A]"
                }`} />
                <div>
                  <span className="text-sm font-semibold text-white">{p.count}</span>
                  <span className="text-xs text-[#71717A] ml-1.5">{p.plan}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Businesses */}
        <div className="card-gradient border border-[rgba(239,68,68,0.1)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Businesses</h3>
            <a href="/admin/businesses" className="text-xs text-[#ef4444] hover:text-[#f87171] transition-colors">
              View all &rarr;
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.04)]">
                  {["Business", "Plan", "Industry", "Conversations", "Agents", "Created"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentBusinesses.map((b) => (
                  <tr key={b.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(239,68,68,0.03)] transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-white">{b.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        b.plan === "ENTERPRISE" ? "bg-[rgba(139,92,246,0.12)] text-[#A78BFA]"
                        : b.plan === "GROWTH" ? "bg-[rgba(59,130,246,0.12)] text-[#3b82f6]"
                        : "bg-[rgba(255,255,255,0.06)] text-[#71717A]"
                      }`}>
                        {b.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#A1A1AA]">{b.industry}</td>
                    <td className="px-5 py-3.5 text-xs text-[#A1A1AA]">{b.conversations}</td>
                    <td className="px-5 py-3.5 text-xs text-[#A1A1AA]">{b.agents}</td>
                    <td className="px-5 py-3.5 text-xs text-[#71717A]">{b.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

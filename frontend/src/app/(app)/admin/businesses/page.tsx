import { getAdminBusinesses } from "@/backend/admin-queries";
import TopBar from "@/frontend/components/dashboard/TopBar";

export default async function AdminBusinessesPage() {
  const businesses = await getAdminBusinesses();

  return (
    <>
      <TopBar title="All Businesses" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="card-gradient border border-[rgba(239,68,68,0.1)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  {["Business", "Plan", "Industry", "Members", "Conversations", "Agents", "Phone", "Created"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(239,68,68,0.03)] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-white">{b.name}</div>
                    </td>
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
                    <td className="px-5 py-3.5 text-xs text-[#A1A1AA]">{b.members}</td>
                    <td className="px-5 py-3.5 text-xs text-[#A1A1AA]">{b.conversations}</td>
                    <td className="px-5 py-3.5 text-xs text-[#A1A1AA]">{b.agents}</td>
                    <td className="px-5 py-3.5 text-xs text-[#71717A]">{b.phone ?? "-"}</td>
                    <td className="px-5 py-3.5 text-xs text-[#71717A]">{b.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {businesses.length === 0 && (
            <div className="text-center py-16 text-[#71717A] text-sm">No businesses yet.</div>
          )}
        </div>
      </div>
    </>
  );
}

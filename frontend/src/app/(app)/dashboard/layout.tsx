import Sidebar from "@/frontend/components/dashboard/Sidebar";
import { getBusinessSummary } from "@/backend/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const summary = await getBusinessSummary();

  return (
    <div className="min-h-screen bg-black">
      <Sidebar
        plan={summary?.plan ?? "STARTER"}
        conversationsUsed={summary?.conversationsUsed ?? 0}
        conversationsLimit={summary?.conversationsLimit ?? 300}
      />
      <div className="lg:ml-60 min-h-screen flex flex-col">{children}</div>
    </div>
  );
}

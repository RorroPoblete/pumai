import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="lg:ml-60 min-h-screen flex flex-col">{children}</div>
    </div>
  );
}

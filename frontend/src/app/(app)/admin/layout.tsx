import AdminSidebar from "@/frontend/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen gradient-hero flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-60 flex flex-col">{children}</main>
    </div>
  );
}

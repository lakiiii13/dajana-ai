import { requireAdmin } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar admin={admin} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { DashboardClientWrapper } from "@/components/DashboardClientWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return <DashboardClientWrapper admin={admin}>{children}</DashboardClientWrapper>;
}

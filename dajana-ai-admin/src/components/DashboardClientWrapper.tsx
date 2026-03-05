"use client";

import { ToastProvider } from "@/components/ui/toast";
import { Sidebar } from "@/components/sidebar";

export function DashboardClientWrapper({
  admin,
  children,
}: {
  admin: { email: string; role: string };
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar admin={admin} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </ToastProvider>
  );
}

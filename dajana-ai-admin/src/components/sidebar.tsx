"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shirt,
  Users,
  BarChart3,
  Bell,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  admin: {
    email: string;
    role: string;
  };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/outfits", label: "Outfiti", icon: Shirt },
  { href: "/dashboard/users", label: "Korisnici", icon: Users },
  { href: "/dashboard/analytics", label: "Statistika", icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Notifikacije", icon: Bell },
];

export function Sidebar({ admin }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col max-h-screen overflow-y-auto">
      {/* Logo – box iznad Dashboarda, u levom uglu */}
      <div className="p-5 border-b border-gray-200">
        <div className="relative w-full h-12 flex items-center justify-start">
          {!logoError ? (
            <img
              src="/OSB%20logo%20horizontalni%20pozitiv.jpg"
              alt="OSB Logo"
              className="h-full w-auto max-w-full object-contain object-left"
              onError={() => setLogoError(true)}
            />
          ) : null}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#0D4326] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 mb-3">
          <p className="font-medium text-gray-900">{admin.email}</p>
          <p className="text-xs text-gray-500">{admin.role}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Odjavi se
        </Button>
      </div>
    </div>
  );
}

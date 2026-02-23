"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-[#0D4326] tracking-wider">
            DAJANA
          </span>
          <span className="text-lg font-light text-[#CF8F5A]">AI</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
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

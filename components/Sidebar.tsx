"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { TeamRole } from "@/types/roles";
import {
  LayoutDashboard,
  Users,
  Gift,
  FileText,
  Activity,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const canAccessTeamManagement =
    session?.user?.role === TeamRole.ADMIN ||
    session?.user?.role === TeamRole.MANAGER;

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const mainNavItems: Array<{
    title: string;
    href: string;
    icon: typeof LayoutDashboard;
    show: boolean;
    badge?: string;
  }> = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      title: "Installers",
      href: "/installers",
      icon: Users,
      show: true,
    },
    {
      title: "Rewards",
      href: "/rewards",
      icon: Gift,
      show: true,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: FileText,
      show: true,
    },
    {
      title: "Activity",
      href: "/activity",
      icon: Activity,
      show: true,
    },
    {
      title: "Team",
      href: "/team",
      icon: UserCog,
      show: canAccessTeamManagement,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      show: session?.user?.role === TeamRole.ADMIN,
    },
  ];

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                IP
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Installer</span>
              <span className="text-xs text-muted-foreground">Program</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary mx-auto">
            <span className="text-sm font-bold text-primary-foreground">
              IP
            </span>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="absolute -right-3 top-20 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full border border-border bg-background shadow-md"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-2 p-4">
        {!collapsed && (
          <div className="mb-2 px-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Main
            </span>
          </div>
        )}

        {mainNavItems.map(
          (item) =>
            item.show && (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                      : "text-muted-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            )
        )}
      </div>

      {/* User Info at Bottom */}
      {!collapsed && session && (
        <div className="absolute bottom-0 w-full border-t border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-bold text-primary">
                {session.user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "U"}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {session.user?.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session.user?.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { TeamRole } from "@/types/roles";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { FC, useMemo, useCallback, memo } from "react";
import IconDashboard from "./icons/Dashboard";
import IconUserCog from "./icons/UserCog";
import IconUsersGroupRounded from "./icons/UsersGroupRounded";
import IconSettings from "./icons/Settings";
import IconDocument from "./icons/Document";
import IconActivity from "./icons/Activity";
import IconGift from "./icons/Gift";
import ProgramLogo from "./ProgramLogo";
import { UserAvatar } from "./UserAvatar";
import { Badge } from "./ui/badge";

// Types
export interface NavItem {
  title: string;
  href: string;
  Icon: FC<IconProps>;
  show?: boolean | ((role?: TeamRole) => boolean);
  badge?: string | number;
}

export interface SidebarBranding {
  logo?: React.ReactNode;
  shortLogo?: string;
  fullName?: string;
  subtitle?: string;
  homeHref?: string;
}

export interface SidebarUser {
  name?: string | null;
  role?: string | null;
  email?: string | null;
  avatar?: string | null;
}

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  navItems?: NavItem[];
  branding?: SidebarBranding;
  showUserInfo?: boolean;
  collapsible?: boolean;
  sectionLabel?: string;
  width?: {
    expanded?: string;
    collapsed?: string;
  };
  user?: SidebarUser;
}

// Default navigation items
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    Icon: IconDashboard,
    show: true,
  },
  {
    title: "Installers",
    href: "/installers",
    Icon: IconUserCog,
    show: true,
  },
  {
    title: "Rewards",
    href: "/rewards",
    Icon: IconGift,
    show: true,
  },
  {
    title: "Reports",
    href: "/reports",
    Icon: IconDocument,
    show: true,
  },
  {
    title: "Activity",
    href: "/activity",
    Icon: IconActivity,
    show: true,
  },
  {
    title: "Team",
    href: "/team",
    Icon: IconUsersGroupRounded,
    show: (role) => role === TeamRole.ADMIN || role === TeamRole.MANAGER,
  },
  {
    title: "Settings",
    href: "/settings",
    Icon: IconSettings,
    show: (role) => role === TeamRole.ADMIN,
  },
];

// Default branding
const DEFAULT_BRANDING: SidebarBranding = {
  shortLogo: "IP",
  fullName: "Installer",
  subtitle: "Program",
  homeHref: "/dashboard",
};

function Sidebar({
  collapsed = false,
  onCollapsedChange,
  navItems = DEFAULT_NAV_ITEMS,
  branding = DEFAULT_BRANDING,
  showUserInfo = true,
  collapsible = true,
  sectionLabel = "Main",
  width = { expanded: "w-64", collapsed: "w-18" },
  user,
}: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Use provided user or session user
  const currentUser = useMemo(
    () => user || session?.user,
    [user, session?.user]
  );

  // Memoize active path checker
  const isActive = useCallback(
    (path: string) => {
      return pathname === path || pathname?.startsWith(path + "/");
    },
    [pathname]
  );

  // Memoize filtered nav items based on user role
  const visibleNavItems = useMemo(() => {
    const userRole = currentUser?.role as TeamRole | undefined;

    return navItems.filter((item) => {
      if (item.show === undefined || item.show === true) return true;
      if (item.show === false) return false;
      if (typeof item.show === "function") return item.show(userRole);
      return item.show;
    });
  }, [navItems, currentUser?.role]);

  // Memoize toggle handler
  const handleToggle = useCallback(() => {
    onCollapsedChange?.(!collapsed);
  }, [collapsed, onCollapsedChange]);

  // Memoize branding config
  const brandingConfig = useMemo(
    () => ({ ...DEFAULT_BRANDING, ...branding }),
    [branding]
  );

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-[width] duration-300 flex flex-col",
        collapsed ? width.collapsed : width.expanded
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4 relative">
        <Link
          href={brandingConfig.homeHref!}
          className="flex items-center justify-center w-full"
        >
          <ProgramLogo
            className={cn(
              "transition-[width] duration-300 ease-fluid shrink-0 !m-0 !h-max",
              collapsed ? "w-14" : "w-24"
            )}
          />
        </Link>
        {/* Collapse Toggle */}
        {collapsible && (
          <div className="w-6.5 h-6.5 absolute -bottom-3 -right-4 z-50">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-lg border border-border bg-background active:!translate-y-0"
              onClick={handleToggle}
            >
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform duration-700 ease-fluid",
                  !collapsed && "rotate-180"
                )}
              />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={cn("flex flex-col gap-1 px-3 py-4")}>
        {sectionLabel && (
          <div className="mb-2 px-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {sectionLabel}
            </span>
          </div>
        )}

        {visibleNavItems.map((item) => (
          <NavItem
            key={item.href}
            to={item.href}
            Icon={item.Icon}
            label={item.title}
            badge={item.badge}
            isExpanded={!collapsed}
            isActive={isActive(item.href)}
          />
        ))}
      </div>

      {/* User Profile */}
      {showUserInfo && currentUser && (
        <div className="mt-auto p-3 justify-center flex">
          {!collapsed ? (
            <div className="p-3 bg-card border shadow-sm rounded-2xl border-zinc-200/50 dark:border-zinc-700/50 w-full">
              <div className="flex items-center gap-2">
                <UserAvatar
                  user={currentUser}
                  size="small"
                  className="rounded-2xl flex items-center justify-center"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize truncate text-zinc-900 dark:text-zinc-50">
                    {currentUser?.name || "User"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-1 text-[10px] border-none rounded-md font-semibold !bg-background",
                    currentUser?.role === "ADMIN"
                      ? "dark:bg-zinc-950/40 dark:text-rose-400"
                      : currentUser?.role === "MANAGER"
                      ? "dark:bg-zinc-950/40 dark:text-cyan-400"
                      : "dark:bg-zinc-950/40 dark:text-zinc-400"
                  )}
                >
                  {currentUser?.role || "USER"}
                </Badge>
              </div>
            </div>
          ) : (
            <UserAvatar
              user={currentUser}
              className="rounded-2xl flex items-center justify-center text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
}

// Memoize the main component to prevent unnecessary re-renders
export default memo(Sidebar);

interface NavItemProps {
  to: string;
  Icon: FC<IconProps>;
  label: string;
  badge?: string | number;
  isExpanded: boolean;
  isActive?: boolean;
}

const NavItem = memo(
  ({ to, Icon, label, badge, isActive, isExpanded }: NavItemProps) => {
    const content = (
      <Link
        title={label}
        href={to}
        className={cn(
          "flex items-center gap-2 px-3 py-3 rounded-2xl transition-all duration-200",
          isExpanded ? "h-12" : "w-12 h-12",
          isActive
            ? "bg-sidebar-primary text-primary font-medium"
            : "hover:bg-sidebar-primary text-sidebar-accent-foreground/70 hover:text-sidebar-accent-foreground"
        )}
      >
        <div className="flex items-center justify-center transition-all">
          <Icon className={cn("shrink-0w-5 h-5")} fill={isActive} />
        </div>
        {isExpanded && (
          <div className="flex items-center justify-between flex-1 overflow-hidden">
            <span
              className={cn(
                "text-sm transition-all whitespace-nowrap",
                isActive ? "font-semibold translate-x-0.5" : "font-medium"
              )}
            >
              {label}
            </span>
            <div className="flex items-center gap-2">{badge}</div>
          </div>
        )}
      </Link>
    );

    if (!isExpanded) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent
              side="right"
              className="flex items-center gap-2 py-1"
            >
              <span className="font-medium">{label}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  }
);

NavItem.displayName = "NavItem";

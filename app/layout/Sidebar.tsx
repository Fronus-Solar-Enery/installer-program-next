"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { TeamRole } from "@/types/roles";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FC, useMemo, useCallback, memo, useRef, forwardRef } from "react";
import IconDashboard from "@/components/icons/Dashboard";
import IconUsersGroupRounded from "@/components/icons/UsersGroupRounded";
import IconSettings from "@/components/icons/Settings";
import IconDocument from "@/components/icons/Document";
import IconActivity from "@/components/icons/Activity";
import IconGift from "@/components/icons/Gift";
import ProgramLogo from "@/components/ProgramLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { IconAltArrowLeft, IconInstaller } from "@/components/icons";

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

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  navItems?: NavItem[];
  branding?: SidebarBranding;
  showUserInfo?: boolean;
  collapsible?: boolean;
  sectionLabel?: string;
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
    Icon: IconInstaller,
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

  // Memoize branding config
  const brandingConfig = useMemo(
    () => ({ ...DEFAULT_BRANDING, ...branding }),
    [branding]
  );

  const sideBarRef = useRef<HTMLDivElement>(null);
  const navItemRef = useRef<HTMLAnchorElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  // Memoize toggle handler
  const handleToggle = useCallback(() => {
    onCollapsedChange?.(!collapsed);
  }, [collapsed, onCollapsedChange]);

  useGSAP(() => {
    const sidebar = sideBarRef.current;
    const logo = logoRef.current;
    const navItems = gsap.utils.toArray<HTMLElement>(".navitem-link");
    const navTitles = gsap.utils.toArray<HTMLElement>(".navlink-title");
    const navIcons = gsap.utils.toArray<HTMLElement>(".navitem-icon");
    const profileContainer = document.querySelector(".profile-container");
    const profileName = document.querySelector(".profile-name");
    const profileBadge = document.querySelector(".profile-badge");
    const profileAvatar = document.querySelector(".profile-avatar");

    if (!sidebar || !logo || !navIcons || !navTitles || !navItems) return;

    const ctx = gsap.context(() => {
      // helpers must return void, not a Tween
      const showTitles = () => {
        gsap.set(navTitles, { display: "inline-flex" });
        gsap.set(profileName, { display: "inline-flex" });
      };

      const hideTitles = () => {
        gsap.set(navTitles, { display: "none" });
        gsap.set(profileName, { display: "none" });
      };
      // helpers must return void, not a Tween
      const showProfile = () => {
        [profileName, profileBadge].forEach((pi) => {
          gsap.set(pi, { display: "inline-flex" });
        });
      };

      const hideProfile = () => {
        [profileName, profileBadge].forEach((pi) => {
          gsap.set(pi, { display: "none" });
        });
      };

      const tl = gsap.timeline();

      if (collapsed) {
        tl.to(navTitles, {
          x: -20,
          opacity: 0,
          duration: 0.36,
          stagger: 0.04,
          ease: "power2.inOut",
          onComplete: () => {
            hideTitles();
          },
        });

        tl.to(
          navItems,
          {
            width: "3rem",
            height: "3rem",
            duration: 0.36,
            ease: "power2.inOut",
            stagger: 0.03,
          },
          0
        );

        tl.to(
          navIcons,
          {
            width: "1.5rem",
            height: "1.5rem",
            duration: 0.6,
            ease: "power2.inOut",
            stagger: 0.03,
          },
          "<"
        );

        tl.to(
          profileContainer,
          {
            padding: 0,
            border: 0,
            duration: 0.36,
            ease: "power2.inOut",
          },
          "<"
        );

        tl.to(
          profileName,
          {
            x: -20,
            opacity: 0,
            duration: 0.36,
            ease: "power2.inOut",
            onComplete: () => {
              hideProfile();
            },
          },
          "<"
        );

        tl.to(
          profileBadge,
          {
            x: 20,
            opacity: 0,
            duration: 0.36,
            ease: "power2.inOut",
            onComplete: () => {
              hideProfile();
            },
          },
          "<"
        );

        tl.to(
          profileAvatar,
          {
            height: "3rem",
            width: "3rem",
            duration: 0.36,
            ease: "power2.inOut",
          },
          "<"
        );

        tl.to(
          logo,
          {
            width: "3.5rem",
            duration: 0.36,
            ease: "power2.inOut",
          },
          "<"
        );

        tl.to(
          sidebar,
          {
            width: "72px",
            duration: 0.36,
            ease: "power2.inOut",
          },
          "-=0.739"
        );
      } else {
        tl.to(
          sidebar,
          {
            width: "256px",
            duration: 0.36,
            ease: "power2.inOut",
          },
          "+=0.05"
        );
        tl.to(
          logo,
          {
            width: "6rem",
            duration: 0.36,
            ease: "power2.inOut",
          },
          0
        );

        tl.to(
          navIcons,
          {
            width: "1.25rem",
            height: "1.25rem",
            duration: 0.45,
            ease: "power2.inOut",
            stagger: 0.03,
          },
          "<"
        );

        tl.to(
          navItems,
          {
            height: "atuo",
            width: "100%",
            duration: 0.36,
            ease: "power2.inOut",
            stagger: 0.03,
          },
          0
        );

        // add a callback (returns void) to set display before animating titles
        tl.add(() => showTitles(), "+=0");

        tl.fromTo(
          navTitles,
          { x: -20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.22,
            stagger: 0.04,
            ease: "power2.out",
          },
          "-=0.08"
        );

        tl.to(
          profileAvatar,
          {
            height: "2.25rem",
            width: "2.25rem",
            duration: 0.56,
            ease: "power2.inOut",
          },
          0
        );

        // add a callback (returns void) to set display before animating titles
        tl.add(() => showProfile(), "+=0");

        tl.fromTo(
          profileName,
          { x: -20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.22,
            ease: "power2.out",
          },
          "-=0.15"
        );

        tl.fromTo(
          profileBadge,
          { x: 20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.22,
            ease: "power2.out",
          },
          "-=0.15"
        );

        tl.to(
          profileContainer,
          {
            padding: "0.75rem",
            border: 1,
            duration: 0.6,
            ease: "power2.inOut",
          },
          "-=1.05"
        );
      }
    }, sidebar);

    return () => ctx.revert();
  }, [collapsed]);

  return (
    <div
      ref={sideBarRef}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-[width] duration-300 flex flex-col w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4 relative">
        <Link
          href={brandingConfig.homeHref!}
          className="flex items-center justify-center w-full"
        >
          <ProgramLogo
            ref={logoRef}
            className={cn(
              "transition-[width] duration-300 ease-fluid shrink-0 !m-0 !h-max w-24",
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
              className="h-6 w-6 rounded-full border border-border bg-background active:!translate-y-0 shadow-sm"
              onClick={handleToggle}
            >
              <IconAltArrowLeft
                className={cn(
                  "h-3 w-3 transition-transform duration-700 ease-fluid",
                  collapsed && "rotate-180"
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
            ref={navItemRef}
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
          <div className="profile-container p-3 bg-card border shadow-lg rounded-4xl border-border w-full flex items-center gap-2 squircle">
            <UserAvatar
              user={currentUser}
              className="profile-avatar rounded-2xl flex items-center justify-center size-9 shadow-sm"
            />
            <div className="profile-name flex-1 min-w-0 relative">
              <p className="text-sm font-medium capitalize truncate text-zinc-900 dark:text-zinc-50">
                {currentUser?.name || "User"}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "profile-badge px-2.5 py-1 text-[10px] border-none rounded-md font-semibold !bg-background relative",
                // collapsed && "hidden",
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

const NavItemBase = forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ to, Icon, label, badge, isActive, isExpanded }, ref) => {
    const content = (
      <Link
        title={label}
        ref={ref}
        href={to}
        className={cn(
          "navitem-link flex items-center gap-2 px-3 py-3 rounded-2xl transition-all duration-200 w-full",
          isExpanded ? "squircle" : "squircle-icon",
          isActive
            ? "bg-sidebar-primary text-primary font-medium"
            : "hover:bg-sidebar-primary text-sidebar-accent-foreground/70 hover:text-sidebar-accent-foreground"
        )}
      >
        <div className="flex items-center justify-center transition-all">
          <Icon
            className={cn("navitem-icon shrink-0 w-5 h-5")}
            fill={isActive}
            duotone
          />
        </div>
        <div className="flex items-center justify-between flex-1 overflow-hidden navlink-title">
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
      </Link>
    );

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="right"
            className={cn(
              "flex items-center gap-2 py-1",
              isExpanded && "hidden"
            )}
          >
            <span className="font-medium">{label}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

NavItemBase.displayName = "NavItemBase";

export const NavItem = memo(NavItemBase);
NavItem.displayName = "NavItem";

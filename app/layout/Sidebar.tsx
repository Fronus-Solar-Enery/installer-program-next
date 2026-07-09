"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { TeamRole } from "@/types/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FC,
  useMemo,
  useCallback,
  memo,
  useRef,
  forwardRef,
  useEffect,
  useState,
} from "react";
import IconDashboard from "@/components/icons/Dashboard";
import IconUsersGroupRounded from "@/components/icons/UsersGroupRounded";
import IconSettings from "@/components/icons/Settings";
import IconDocument from "@/components/icons/Document";
import IconActivity from "@/components/icons/Activity";
import IconGift from "@/components/icons/Gift";
import IconClipboardCheck from "@/components/icons/ClipboardCheck";
import ProgramLogo from "@/components/ProgramLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordian";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { EASE_MOVE, EASE_MOVE_REVERSE, EASE_ENTER } from "@/lib/gsapEases";
import { IconAltArrowLeft, IconInstaller } from "@/components/icons";

// Types
export interface SubNavItem {
  title: string;
  href: string;
  show?: boolean | ((role?: TeamRole) => boolean);
}

export interface NavItem {
  title: string;
  href?: string;
  Icon: FC<IconProps>;
  show?: boolean | ((role?: TeamRole) => boolean);
  badge?: string | number;
  subItems?: SubNavItem[];
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
  user?: TeamUser;
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
    Icon: IconInstaller,
    show: true,
    subItems: [
      {
        title: "Installers List",
        href: "/installers",
        show: true,
      },
      {
        title: "Register",
        href: "/installers/register",
        show: true,
      },
      // {
      //   title: "Bulk Register",
      //   href: "/installers/bulk-register",
      //   show: true,
      // },
    ],
  },
  {
    title: "Rewards",
    Icon: IconGift,
    show: true,
    subItems: [
      {
        title: "Rewards List",
        href: "/rewards",
        show: true,
      },
      {
        title: "Register",
        href: "/rewards/register",
        show: true,
      },
      // {
      //   title: "Bulk Register",
      //   href: "/rewards/bulk-register",
      //   show: true,
      // },
      {
        title: "Bulk Update",
        href: "/rewards/bulk-update",
        show: true,
      },
    ],
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
    title: "Batch Jobs",
    href: "/batch-jobs",
    Icon: IconClipboardCheck,
    show: (role) => role === TeamRole.ADMIN,
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
    [user, session?.user],
  );

  // State to manage accordion open/close
  const [openAccordion, setOpenAccordion] = useState<string>("");

  // Close accordion when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setOpenAccordion("");
    }
  }, [collapsed]);

  // Memoize active path checker
  const isActive = useCallback(
    (path: string) => {
      return pathname === path || pathname?.startsWith(path + "/");
    },
    [pathname],
  );

  // Exact match for sub-items to avoid false positives
  const isExactActive = useCallback(
    (path: string) => {
      return pathname === path;
    },
    [pathname],
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
    [branding],
  );

  const sideBarRef = useRef<HTMLDivElement>(null);
  const navItemRef = useRef<HTMLAnchorElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  // Memoize toggle handler
  const handleToggle = useCallback(() => {
    onCollapsedChange?.(!collapsed);
  }, [collapsed, onCollapsedChange]);

  const [hideArrow, setHideArrow] = useState(false);

  useGSAP(() => {
    const sidebar = sideBarRef.current;
    const logo = logoRef.current;
    const navItems = gsap.utils.toArray<HTMLElement>(".navitem-link");
    const navTitles = gsap.utils.toArray<HTMLElement>(".navlink-title");
    const navIcons = gsap.utils.toArray<HTMLElement>(".navitem-icon");

    if (!sidebar || !logo || !navIcons || !navTitles || !navItems) return;

    const profileContainer = sidebar.querySelector(".profile-container");
    const profileName = sidebar.querySelector(".profile-name");
    const profileBadge = sidebar.querySelector(".profile-badge");
    const profileAvatar = sidebar.querySelector(".profile-avatar");

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      tl.timeScale(prefersReducedMotion ? 40 : 1);

      if (collapsed) {
        tl.to(navTitles, {
          x: -20,
          opacity: 0,
          duration: 0.3,
          stagger: 0.035,
          ease: EASE_ENTER,
          onComplete: () => {
            hideTitles();
          },
        });

        tl.to(
          navItems,
          {
            width: "3rem",
            height: "3rem",
            duration: 0.3,
            ease: EASE_MOVE,
            stagger: 0.025,
          },
          0,
        );

        tl.to(
          navIcons,
          {
            width: "1.5rem",
            height: "1.5rem",
            duration: 0.45,
            ease: EASE_MOVE,
            stagger: 0.025,
          },
          "<",
        );

        tl.to(
          profileContainer,
          {
            padding: 0,
            border: 0,
            duration: 0.3,
            ease: EASE_MOVE,
          },
          "<",
        );

        tl.to(
          profileName,
          {
            x: -20,
            opacity: 0,
            duration: 0.3,
            ease: EASE_ENTER,
            onComplete: () => {
              hideProfile();
            },
          },
          "<",
        );

        tl.to(
          profileBadge,
          {
            x: 20,
            opacity: 0,
            duration: 0.3,
            ease: EASE_ENTER,
            onComplete: () => {
              hideProfile();
            },
          },
          "<",
        );

        tl.to(
          profileAvatar,
          {
            height: "3rem",
            width: "3rem",
            duration: 0.3,
            ease: EASE_MOVE,
          },
          "<",
        );

        tl.to(
          logo,
          {
            width: "3.5rem",
            duration: 0.3,
            ease: EASE_MOVE,
          },
          "<",
        );

        tl.to(
          sidebar,
          {
            width: "72px",
            duration: 0.3,
            ease: EASE_MOVE_REVERSE,
          },
          0, // start with main-elem's margin tween (AppLayout), not offset into the timeline
        );
      } else {
        tl.to(
          sidebar,
          {
            width: "256px",
            duration: 0.3,
            ease: EASE_MOVE_REVERSE,
          },
          0, // start with main-elem's margin tween (AppLayout), not offset into the timeline
        );
        tl.to(
          logo,
          {
            width: "6rem",
            duration: 0.3,
            ease: EASE_MOVE,
          },
          0,
        );

        tl.to(
          navIcons,
          {
            width: "1.25rem",
            height: "1.25rem",
            duration: 0.35,
            ease: EASE_MOVE,
            stagger: 0.025,
          },
          "<",
        );

        tl.to(
          navItems,
          {
            height: "auto",
            width: "100%",
            duration: 0.3,
            ease: EASE_MOVE,
            stagger: 0.025,
          },
          0,
        );

        // add a callback (returns void) to set display before animating titles
        tl.add(() => showTitles(), "+=0");

        tl.fromTo(
          navTitles,
          { x: -20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.2,
            stagger: 0.035,
            ease: EASE_ENTER,
          },
          "-=0.07",
        );

        tl.to(
          profileAvatar,
          {
            height: "2.25rem",
            width: "2.25rem",
            duration: 0.45,
            ease: EASE_MOVE,
          },
          0,
        );

        // add a callback (returns void) to set display before animating titles
        tl.add(() => showProfile(), "+=0");

        tl.fromTo(
          profileName,
          { x: -20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.2,
            ease: EASE_ENTER,
          },
          "-=0.13",
        );

        tl.fromTo(
          profileBadge,
          { x: 20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.2,
            ease: EASE_ENTER,
          },
          "-=0.13",
        );

        tl.to(
          profileContainer,
          {
            padding: "0.75rem",
            border: 1,
            duration: 0.48,
            ease: EASE_MOVE,
          },
          "-=0.85",
        );
      }
    }, sidebar);

    return () => ctx.revert();
  }, [collapsed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHideArrow(collapsed);
    }, 600);

    return () => clearTimeout(timer);
  }, [collapsed]);

  return (
    <div
      ref={sideBarRef}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar flex flex-col w-64",
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
            className={cn("shrink-0 m-0! w-24", collapsed ? "w-14" : "w-24")}
          />
        </Link>
        {/* Collapse Toggle */}
        {collapsible && (
          <div className="w-6.5 h-6.5 absolute -bottom-3 -right-4 z-50">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full border border-border bg-background shadow-sm"
              onClick={handleToggle}
            >
              <IconAltArrowLeft
                className={cn(
                  "h-3 w-3 transition-transform duration-300 ease-fluid",
                  collapsed && "rotate-180",
                )}
              />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div
        className={cn(
          "flex flex-col gap-1 px-3 py-4 overflow-y-auto overflow-x-hidden",
        )}
      >
        {sectionLabel && (
          <div className="mb-2 px-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {sectionLabel}
            </span>
          </div>
        )}

        <Accordion
          type="single"
          collapsible
          className="w-full space-y-1"
          value={openAccordion}
          onValueChange={setOpenAccordion}
        >
          {visibleNavItems.map((item) => {
            if (item.subItems && item.subItems.length > 0) {
              // Filter visible sub-items
              const visibleSubItems = item.subItems.filter((subItem) => {
                const userRole = currentUser?.role as TeamRole | undefined;
                if (subItem.show === undefined || subItem.show === true)
                  return true;
                if (subItem.show === false) return false;
                if (typeof subItem.show === "function")
                  return subItem.show(userRole);
                return subItem.show;
              });

              const isAnySubItemActive = visibleSubItems.some((subItem) =>
                isExactActive(subItem.href),
              );

              // Render accordion item with popover for collapsed state
              return (
                <AccordionItem
                  key={item.title}
                  value={item.title}
                  className="border-none"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <AccordionTrigger
                        hideArrow={hideArrow}
                        className={cn(
                          // Only color/transform transition here — GSAP owns width/height,
                          // so `transition-all` would fight it every frame.
                          "navitem-link flex items-center gap-2 px-3 py-3 rounded-2xl transition-[color,background-color,transform] duration-200 ease-fluid hover:no-underline active:scale-[0.98] w-full",
                          collapsed ? "squircle-icon" : "squircle",
                          isAnySubItemActive
                            ? "bg-sidebar-primary text-primary font-medium"
                            : "[@media(hover:hover)]:hover:bg-sidebar-primary text-sidebar-accent-foreground/70 [@media(hover:hover)]:hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center justify-center transition-all">
                            <item.Icon
                              className={cn("navitem-icon shrink-0 w-5 h-5")}
                              fill={isAnySubItemActive}
                              duotone
                            />
                          </div>
                          <span
                            className={cn(
                              "text-sm transition-all whitespace-nowrap navlink-title",
                              isAnySubItemActive
                                ? "font-semibold"
                                : "font-medium",
                            )}
                          >
                            {item.title}
                          </span>
                        </div>
                      </AccordionTrigger>
                    </PopoverTrigger>
                    {collapsed && (
                      <PopoverContent
                        side="right"
                        align="start"
                        className="w-40 p-1 rounded-2xl"
                      >
                        <div className="p-2 pb-1 pt-1 text-xs text-muted-foreground">
                          {item.title}
                        </div>
                        <div className="space-y-1 relative">
                          {visibleSubItems.map((subItem) => (
                            <div
                              key={subItem.href}
                              className={cn(
                                "before-wrapper relative before:left-2 after:left-2",
                                isExactActive(subItem.href)
                                  ? "before:w-2"
                                  : "before:w-4 hover:before:w-2",
                              )}
                            >
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  "before-content relative mt-1 ml-5 px-3 py-2 rounded-2xl text-sm transition-[color,background-color,transform] duration-200 ease-fluid active:scale-[0.98] squircle flex items-center z-10",
                                  isExactActive(subItem.href)
                                    ? "bg-sidebar-primary text-primary"
                                    : "[@media(hover:hover)]:hover:bg-sidebar-primary text-sidebar-accent-foreground/70 [@media(hover:hover)]:hover:text-sidebar-accent-foreground",
                                )}
                              >
                                {subItem.title}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                  {!collapsed && (
                    <AccordionContent className="pb-0 pt-1 relative">
                      <div className="relative pl-6">
                        {visibleSubItems.map((subItem) => (
                          <div
                            key={subItem.href}
                            className={cn(
                              "before-wrapper relative",
                              isExactActive(subItem.href)
                                ? "before:w-2"
                                : "before:w-4 hover:before:w-2",
                            )}
                          >
                            <Link
                              href={subItem.href}
                              className={cn(
                                "before-content relative mt-1 ml-1 px-3 py-2 rounded-2xl text-sm transition-[color,background-color,transform] duration-200 ease-fluid active:scale-[0.98] squircle flex items-center z-10",
                                isExactActive(subItem.href)
                                  ? "bg-sidebar-primary text-primary"
                                  : "[@media(hover:hover)]:hover:bg-sidebar-primary text-sidebar-accent-foreground/70 [@media(hover:hover)]:hover:text-sidebar-accent-foreground",
                              )}
                            >
                              {subItem.title}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  )}
                </AccordionItem>
              );
            }

            // Render regular nav item (outside accordion)
            return (
              <NavItem
                ref={navItemRef}
                key={item.href!}
                to={item.href!}
                Icon={item.Icon}
                label={item.title}
                badge={item.badge}
                isExpanded={!collapsed}
                isActive={isActive(item.href!)}
              />
            );
          })}
        </Accordion>
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
                "profile-badge px-2.5 py-1 text-[10px] border-none rounded-md font-semibold bg-background! relative",
                // collapsed && "hidden",
                currentUser?.role === "ADMIN"
                  ? "dark:bg-zinc-950/40 dark:text-rose-400"
                  : currentUser?.role === "MANAGER"
                    ? "dark:bg-zinc-950/40 dark:text-cyan-400"
                    : "dark:bg-zinc-950/40 dark:text-zinc-400",
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
            : "[@media(hover:hover)]:hover:bg-sidebar-primary text-sidebar-accent-foreground/70 [@media(hover:hover)]:hover:text-sidebar-accent-foreground",
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
              isActive ? "translate-x-0.5" : "",
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
              isExpanded && "hidden",
            )}
          >
            <span className="font-medium">{label}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
);

NavItemBase.displayName = "NavItemBase";

export const NavItem = memo(NavItemBase);
NavItem.displayName = "NavItem";

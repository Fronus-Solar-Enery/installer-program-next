"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopNavbar from "@/app/layout/TopNavbar";
import Breadcrumb from "@/components/Breadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbProvider,
  useBreadcrumb,
} from "@/contexts/BreadcrumbContext";
import { getRouteIcon } from "@/components/breadcrumbIcons";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { EASE_MOVE_REVERSE } from "@/lib/gsapEases";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

interface AppLayoutProps {
  children: React.ReactNode;
}

function BreadcrumbWithOverrides({ crumbs }: { crumbs: BreadcrumbItem[] }) {
  const { overrides } = useBreadcrumb();
  const applied = crumbs.map((c) => {
    if (!c.href) return c;
    const override = overrides[c.href];
    return {
      ...c,
      label: override?.label ?? c.label,
      icon: override?.icon ?? c.icon,
    };
  });

  return <Breadcrumb items={applied} />;
}

/**
 * Dashboard layout — renders sidebar + top navbar + breadcrumbs.
 * Used by all authenticated dashboard pages.
 * Auth pages and the landing page bypass this entirely.
 */
export function DashboardLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const mainRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mainElem = mainRef?.current;
    if (!mainElem) return;

    gsap.to(mainElem, {
      marginLeft: sidebarCollapsed ? "64px" : "256px",
      duration: 0.3,
      ease: EASE_MOVE_REVERSE,
    });
  }, [sidebarCollapsed]);

  const pathname = usePathname() ?? "/dashboard";

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const path = pathname || "/dashboard";
    const segments = path.split("/").filter(Boolean);

    if (path === "/dashboard" || segments.length === 0) {
      return [{ label: "Home", href: "/dashboard" }];
    }

    const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/dashboard" }];
    let current = "";

    segments.forEach((seg) => {
      current += `/${seg}`;
      if (current === "/dashboard") return;

      const label =
        seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      const icon = getRouteIcon(seg);

      crumbs.push({ label, href: current, icon });
    });

    return crumbs;
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <BreadcrumbProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div
          ref={mainRef}
          className="fixed top-0 right-0 left-0 bottom-0 flex flex-1 flex-col overflow-hidden main-elem max-h-screen h-full ml-64"
        >
          <TopNavbar />
          <main className="flex-1 overflow-y-auto p-4 relative">
            <div className="container mx-auto">
              <div className="flex h-9 items-center pl-3 mb-4">
                <BreadcrumbWithOverrides crumbs={breadcrumbItems} />
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}

/**
 * Standalone layout — renders children with no chrome (no sidebar, no navbar).
 * Used for auth pages, the public landing page, and the installer portal.
 */
export function StandaloneLayout({ children }: AppLayoutProps) {
  return <>{children}</>;
}

/**
 * Default export — routes to the correct layout based on pathname.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname() ?? "/dashboard";

  const isStandalonePage =
    pathname.startsWith("/auth") ||
    pathname === "/" ||
    pathname.startsWith("/my-stats") ||
    pathname.startsWith("/installer/");

  if (isStandalonePage) {
    return <StandaloneLayout>{children}</StandaloneLayout>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

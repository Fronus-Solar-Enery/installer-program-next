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
import { Skeleton } from "@/components/ui/skeleton";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Don't show layout on auth pages
  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    if (status === "unauthenticated" && !isAuthPage) {
      router.push("/auth/signin");
    }
  }, [status, router, isAuthPage]);

  const mainRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mainElem = mainRef?.current;
    if (!mainElem) return;

    gsap.to(mainElem, {
      marginLeft: sidebarCollapsed ? "64px" : "256px",
      duration: 0.4,
      ease: "power1.inOut",
    });
  }, [sidebarCollapsed]);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const path = pathname || "/dashboard";
    const segments = path.split("/").filter(Boolean);

    if (path === "/dashboard" || segments.length === 0) {
      return [{ label: "Home", href: "/dashboard" }];
    }

    const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/dashboard" }];
    let current = "";

    segments.forEach((seg, idx) => {
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
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!session && !isAuthPage) {
    return null;
  }

  // If auth page, render without layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <BreadcrumbProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Main Content Area */}
        <div
          ref={mainRef}
          className={`fixed top-0 right-0 left-0 bottom-0 flex flex-1 flex-col overflow-hidden transition-all duration-300 main-elem max-h-screen h-full ml-64`}
        >
          {/* Top Navbar */}
          <TopNavbar />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-muted/10 p-4">
            <div className="container mx-auto">
              <div className="flex h-14 items-center px-6 bg-card squircle rounded-2xl border border-border mb-4">
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

"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "@/app/layout/TopNavbar";
import { Skeleton } from "@/components/ui/skeleton";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Don't show layout on auth pages
  const isAuthPage = pathname?.startsWith("/auth");

  useEffect(() => {
    if (status === "unauthenticated" && !isAuthPage) {
      router.push("/auth/signin");
    }
  }, [status, router, isAuthPage]);

  const mainRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mainElem = mainRef.current;
    gsap.to(mainElem, {
      marginLeft: sidebarCollapsed ? "64px" : "256px",
      duration: 0.4,
      ease: "power1.inOut",
    });
  }, [sidebarCollapsed]);

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
    <div className="flex h-screen overflow-hidden bg-zinc-200 dark:bg-zinc-950">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div
        ref={mainRef}
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300 main-elem ml-64"
        // style={{ marginLeft: sidebarCollapsed ? "64px" : "256px" }}
      >
        {/* Top Navbar */}
        <TopNavbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10">{children}</main>
      </div>
    </div>
  );
}

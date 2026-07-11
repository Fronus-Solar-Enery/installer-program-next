"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import IconQuitFullScreen from "@/components/icons/QuitFullScreen";
import IconFullScreen from "@/components/icons/FullScreen";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import IconLogout2 from "@/components/icons/Logout2";
import IconUserRounded from "@/components/icons/UserRounded";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import IconArrowUpDown from "@/components/icons/ArrowUpDown";
import IconMagnifer from "@/components/icons/Magnifer";
import IconRefresh2 from "@/components/icons/Refresh2";
// Dynamic import: GlobalSearchModal is 26KB - only loaded when search is opened
const GlobalSearchModal = dynamic(
  () => import("@/components/GlobalSearchModal"),
  { ssr: false },
);
import { IconCommand } from "@/components/icons";

export default function TopNavbar() {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Listen for refresh completion
  useEffect(() => {
    const handleDone = () => setRefreshing(false);
    window.addEventListener("app:refresh:done", handleDone);
    return () => window.removeEventListener("app:refresh:done", handleDone);
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-sidebar px-6">
        <div className="flex-1"></div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="squircle-icon max-w-xs h-9 justify-start text-left font-normal rounded-full border border-border"
            aria-label="Open search"
          >
            <IconMagnifer className="shrink-0 w-4.5 h-4.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline-flex items-center justify-between w-full ml-2 text-sm text-zinc-500 dark:text-zinc-400/60 leading-none">
              Search...
              <kbd className="flex items-center px-2 py-1 text-xs font-bold bg-card dark:bg-background rounded-full ml-3 leading-none text-foreground">
                <span className="text-[10px] mr-1">
                  <IconCommand className="size-2.5!" width={2} />
                </span>{" "}
                K
              </kbd>
            </span>
          </Button>

          {/* Refresh */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              window.dispatchEvent(new Event("app:refresh"));
            }}
            disabled={refreshing}
            title="Refresh data"
            className="gap-2 squircle-icon h-9 rounded-full border border-border"
          >
            Refresh
            <IconRefresh2
              width={2}
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
          </Button>
          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            className="rounded-full hover:border border-border size-9"
            size={"icon"}
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <>
              {isFullscreen ? (
                <IconQuitFullScreen className="size-4.5" />
              ) : (
                <IconFullScreen className="size-4.5" />
              )}
            </>
          </Button>
          {/* Theme Toggle */}
          <ThemeToggle triggerClass="size-9 " />

          {/* User Menu */}

          <Dropdown>
            <DropdownTrigger asChild>
              <Button
                variant="secondary"
                className="squircle-icon h-9 gap-2 pl-0.5 pr-1 text-left font-normal border border-border"
              >
                <UserAvatar
                  user={session?.user}
                  size="small"
                  className="w-8 h-8 bg-card dark:bg-background"
                />
                <span className="hidden sm:inline-block text-sm font-medium leading-none">
                  {session?.user?.name || "User"}
                </span>
                <IconArrowUpDown className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="right" className="w-56">
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize truncate text-zinc-900 dark:text-zinc-50">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs truncate text-zinc-500 dark:text-zinc-400">
                    {session?.user?.email || "user@example.com"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-1 text-[10px] border-none rounded-md font-semibold bg-background!",
                    session?.user?.role === "ADMIN"
                      ? "bg-foreground/5 text-destructive-text-hover"
                      : session?.user?.role === "MANAGER"
                        ? "dark:bg-zinc-950/40 dark:text-cyan-400"
                        : "dark:bg-zinc-950/40 dark:text-zinc-400",
                  )}
                >
                  {session?.user?.role || "USER"}
                </Badge>
              </div>
              <div className="space-y-1 px-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start px-2 py-2 text-sm bg-transparent rounded-lg"
                  href="/profile"
                >
                  <IconUserRounded className="mr-2" />
                  Profile
                </Button>
                {/* <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start px-2 py-2 text-sm bg-transparent rounded-lg"
                  href="/profile"
                >
                  <IconSettings className="mr-2" />
                  Settings
                </Button> */}
              </div>

              <div className="border-t mt-2 border-zinc-200 dark:border-muted p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="w-full justify-start px-2 py-2 text-sm text-destructive-text hover:text-destructive-text-hover hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <IconLogout2 className="mr-2" />
                  Logout
                </Button>
              </div>
            </DropdownContent>
          </Dropdown>
        </div>
      </header>

      {/* Command Palette */}
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

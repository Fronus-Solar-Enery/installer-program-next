"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import IconQuitFullScreen from "./icons/QuitFullScreen";
import IconFullScreen from "./icons/FullScreen";
import { Dropdown, DropdownContent, DropdownTrigger } from "./ui/dropdown";
import IconLogout2 from "./icons/Logout2";
import IconSettings from "./icons/Settings";
import IconUserRounded from "./icons/UserRounded";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import IconArrowUpDown from "./icons/ArrowUpDown";
import IconMagnifer from "./icons/Magnifer";
import GlobalSearchModal from "./GlobalSearchModal";

export default function TopNavbar() {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
            className="max-w-xs w- h-10 justify-start text-left font-normal rounded-full"
            aria-label="Open search"
          >
            <IconMagnifer
              className="shrink-0 w-4.5 h-4.5 text-zinc-500 dark:text-zinc-400"
              duotone={false}
            />
            <span className="hidden sm:inline-flex items-center justify-between w-full ml-2 text-sm text-zinc-500 dark:text-zinc-400/60 leading-none">
              Search...
              <kbd className="inline-flex items-center px-2 py-1 text-xs font-bold bg-background rounded-full ml-3 leading-none text-zinc-700 dark:text-zinc-500">
                <span className="text-[10px] mr-1">⌘</span> K
              </kbd>
            </span>
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            className="rounded-xl "
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <div>
              {isFullscreen ? (
                <IconQuitFullScreen className="w-5 h-5" duotone={false} />
              ) : (
                <IconFullScreen className="w-5 h-5" duotone={false} />
              )}
            </div>
          </Button>
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}

          <Dropdown>
            <DropdownTrigger asChild>
              <Button
                variant="secondary"
                className="gap-2 pl-1 pr-3 text-left font-normal rounded-full"
              >
                <UserAvatar
                  user={session?.user?.name}
                  size="small"
                  className="w-8 h-8 bg-background"
                />
                <span className="hidden sm:inline-block text-sm font-medium">
                  {session?.user?.name || "User"}
                </span>
                <IconArrowUpDown
                  className="h-5 w-5 text-muted-foreground"
                  duotone={false}
                />
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
                    "px-2.5 py-1 text-[10px] border-none rounded-md font-semibold !bg-background",
                    session?.user?.role === "ADMIN"
                      ? "dark:bg-zinc-950/40 dark:text-rose-400"
                      : session?.user?.role === "MANAGER"
                      ? "dark:bg-zinc-950/40 dark:text-cyan-400"
                      : "dark:bg-zinc-950/40 dark:text-zinc-400"
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
                  <IconUserRounded className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start px-2 py-2 text-sm bg-transparent rounded-lg"
                  href="/team/profile"
                >
                  <IconSettings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>

              <div className="border-t mt-2 border-zinc-200 dark:border-muted p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="w-full justify-start px-2 py-2 text-sm text-rose-500 hover:text-rose-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <IconLogout2 className="w-4 h-4 mr-2" duotone={false} />
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

"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { WifiOffIcon } from "./icons/animated/WifiOff";
import { WifiIcon } from "./icons/animated/WifiOn";
import { Button } from "./ui/button";
import Loading from "./ui/loading";

export function OfflineIndicator() {
  const { isOnline, restoredAt, isChecking, checkConnection } =
    useNetworkStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);

  // Show "back online" notification when connection is restored
  useEffect(() => {
    if (restoredAt) {
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [restoredAt]);

  // Don't render anything if online and no "back online" message to show
  if (isOnline && !showBackOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-100 w-full h-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all duration-300 ease-in-out bg-background/80 backdrop-blur-xs",
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-between p-6 bg-card rounded-4xl squircle w-xs h-96 text-center border border-border/60",
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "rounded-full bg-card border border-border/40 p-6 size-36! flex items-center justify-center",
              !isOnline ? "text-red-400" : "text-emerald-400",
            )}
          >
            {isOnline ? (
              <WifiIcon className="size-20 animate-pulse" />
            ) : (
              <WifiOffIcon className="size-20" />
            )}
          </div>
          <div className="space-y-2">
            <div role="status" aria-live="polite" className="text-2xl">
              {isOnline ? "You're back online" : "You're offline"}
            </div>
            <p className="font-normal">
              {isOnline
                ? "Connection restored — your session is fully active and ready to continue seamlessly without interruption."
                : "Connection lost — some features may be limited. Check your internet and refresh to reconnect."}
            </p>
          </div>
        </div>
        <Button
          variant={"outline"}
          className="w-full squircle-icon rounded-full"
          disabled={isOnline || isChecking}
          onClick={() => checkConnection()}
        >
          {isChecking ? (
            <>
              Checking <Loading className="size-4" />{" "}
            </>
          ) : (
            "Check Connection"
          )}
        </Button>
      </div>
    </div>
  );
}

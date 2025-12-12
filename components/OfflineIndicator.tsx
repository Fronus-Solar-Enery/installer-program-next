"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff, Wifi, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show "back online" notification when connection is restored
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowBackOnline(true);
      setDismissed(false);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Reset dismissed state when going offline again
  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  // Don't render anything if online and no "back online" message to show
  if (isOnline && !showBackOnline) {
    return null;
  }

  // If dismissed, don't show anything
  if (dismissed && !showBackOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-100 w-full h-full backdrop-blur-xs flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all duration-300 ease-in-out bg-background/70"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          !isOnline
            ? "bg-linear-to-r from-red-600 via-red-500 to-red-600 text-white shadow-lg animate-pulse"
            : "bg-linear-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white shadow-lg"
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 animate-bounce" />
            <span>You are offline. Please check your internet connection.</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span>You&apos;re back online!</span>
          </>
        )}
      </div>

      {/* {!isOnline && (
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )} */}
    </div>
  );
}

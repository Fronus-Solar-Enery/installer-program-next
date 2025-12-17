"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface NetworkStatus {
  isOnline: boolean;
  restoredAt: number | null; // Timestamp when connection was restored (null if never restored or currently offline)
  isChecking: boolean; // Track if we're currently checking connection
  checkConnection: () => Promise<boolean>; // Manual connection check function
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const wasOfflineRef = useRef(false);

  const handleOnline = useCallback(() => {
    // Only set restoredAt if we were actually offline before
    if (wasOfflineRef.current) {
      setRestoredAt(Date.now());
      wasOfflineRef.current = false;
    }
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setRestoredAt(null);
    wasOfflineRef.current = true;
  }, []);

  // Manual connection check by pinging a reliable endpoint
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      // Use a lightweight endpoint that's highly available
      // Adding a cache-busting query param to prevent cached responses
      await fetch(`https://1.1.1.1/cdn-cgi/trace?_=${Date.now()}`, {
        method: "HEAD",
        mode: "no-cors", // Avoid CORS issues
        cache: "no-store",
      });
      // With no-cors mode, we can't read the response, but if we get here without error,
      // the request succeeded and we're online
      handleOnline();
      return true;
    } catch {
      handleOffline();
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [handleOnline, handleOffline]);

  useEffect(() => {
    // Set initial state based on browser's navigator.onLine
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        wasOfflineRef.current = true;
      }
    }

    // Add event listeners for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, restoredAt, isChecking, checkConnection };
}

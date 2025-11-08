import { useState, useEffect, useCallback, useMemo } from "react";

export function useRelativeTime(
  input: Date | string,
  updateInterval: number = 5000
): string {
  const date = useMemo(
    () => (typeof input === "string" ? new Date(input) : input),
    [input]
  );

  const getRelativeTimeString = useCallback((): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 5) return "Just Now";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const seconds = diffInSeconds % 60;
      return `${minutes}m ${seconds ? ` ${seconds}s` : ""} ago`;
    }

    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }

    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }, [date]);

  const [relativeTime, setRelativeTime] = useState<string>(
    getRelativeTimeString
  );

  useEffect(() => {
    setRelativeTime(getRelativeTimeString());
    const id = setInterval(
      () => setRelativeTime(getRelativeTimeString()),
      updateInterval
    );
    return () => clearInterval(id);
  }, [getRelativeTimeString, updateInterval]);

  return relativeTime;
}

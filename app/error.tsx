"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route-segment error boundary. Catches errors thrown while rendering any page
 * under app/ so a single failing page no longer takes down the whole layout —
 * the sidebar/chrome (rendered by the parent layout) stays intact and only the
 * content area shows this fallback. Also the single place to log render-time
 * errors for pages. Must be a Client Component.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Central hook for render-time error reporting (wire to Sentry/etc here).
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-background p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive-text" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while rendering this page. You can try
            again, or return to the dashboard.
          </p>
          {error.digest && (
            <p className="pt-1 font-mono text-xs text-muted-foreground/70">
              Error ref: {error.digest}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button onClick={reset}>Try again</Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

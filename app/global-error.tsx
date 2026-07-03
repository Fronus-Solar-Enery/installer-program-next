"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the ROOT layout (app/layout.tsx) or
 * its providers — the one place app/error.tsx can't cover. It replaces the
 * entire document, so it must render its own <html>/<body> and cannot rely on
 * ThemeProvider, fonts, or app tokens being available. Kept self-contained with
 * inline styles on a neutral dark surface (matches the app's default themeColor).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              margin: "0 0 0.5rem",
            }}
          >
            Application error
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.5,
              color: "#a1a1a1",
              margin: "0 0 1.5rem",
            }}
          >
            A critical error prevented the app from loading. Please try again.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#6b6b6b",
                margin: "0 0 1rem",
              }}
            >
              Error ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              cursor: "pointer",
              borderRadius: "0.75rem",
              border: "none",
              background: "#fafafa",
              color: "#0a0a0a",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

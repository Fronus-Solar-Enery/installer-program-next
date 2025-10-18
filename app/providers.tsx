"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SessionProvider>
      {children}
      <Toaster
        theme={isDark ? "light" : "dark"}
        richColors
        expand={false}
        position="top-center"
        toastOptions={{
          className: "my-toast",
          duration: 3000,
        }}
      />
    </SessionProvider>
  );
}

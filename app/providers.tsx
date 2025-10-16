"use client";

import { SessionProvider } from "next-auth/react";
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SessionProvider>
      <HeroUIProvider>
        {children}
        {/* <Toaster position="bottom-right" richColors /> */}
        <Toaster
          theme={isDark ? "light" : "dark"}
          richColors
          expand={false}
          position="top-center"
          // visibleToasts={1}
          toastOptions={{
            className: "my-toast",
            duration: 3000,
          }}
        />
      </HeroUIProvider>
    </SessionProvider>
  );
}

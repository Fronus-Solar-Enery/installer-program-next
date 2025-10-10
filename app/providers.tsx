"use client";

import { SessionProvider } from "next-auth/react";
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        {children}
        <Toaster position="bottom-right" richColors />
      </HeroUIProvider>
    </SessionProvider>
  );
}

import { Saira } from "next/font/google";
import type { Viewport, Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import AppLayout from "@/app/layout/AppLayout";
import { BatchJobProvider } from "@/contexts/BatchJobContext";
import { BatchJobProgress } from "@/components/BatchJobProgress";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { WifiOffIcon } from "@/components/icons/animated/WifiOff";
import { WifiIcon } from "@/components/icons/animated/WifiOn";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  display: "swap",
});

const siteUrl = process.env.NEXTAUTH_URL || "https://ipms.fronus.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "IPMS - Fronus",
    template: "%s | IPMS",
  },
  description:
    "Manage installers, rewards, and installations for Fronus Solar Energy",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${saira.variable} antialiased`}>
        <OfflineIndicator />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <BatchJobProvider>
              <BatchJobProgress />
              <AppLayout>{children}</AppLayout>
            </BatchJobProvider>
          </Providers>
        </ThemeProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

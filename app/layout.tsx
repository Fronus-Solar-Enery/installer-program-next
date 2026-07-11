import { Saira, Geist } from "next/font/google";
import localFont from "next/font/local";
import type { Viewport, Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { BatchJobProvider } from "@/contexts/BatchJobContext";
import { BatchJobProgress } from "@/components/BatchJobProgress";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  display: "swap",
});

const bloxat = localFont({
  src: "../public/fonts/bloxat.ttf",
  variable: "--font-bloxat",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const siteUrl = process.env.NEXTAUTH_URL || "https://installer.fronus.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Fronus Installer Program",
    template: "%s | Fronus",
  },
  description:
    "Fronus Solar Energy installer reward program — earn on every eligible inverter installation.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png" },
      { url: "/favicon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/favicon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
      <body
        className={`${saira.variable} ${bloxat.variable} ${geist.variable} antialiased`}
      >
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
              {children}
            </BatchJobProvider>
          </Providers>
        </ThemeProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html:
              process.env.NODE_ENV === "production"
                ? `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `
                : `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

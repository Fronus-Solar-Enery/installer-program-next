import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import AppLayout from "@/app/layout/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXTAUTH_URL || "https://ipms.fronus.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Installer Program Management System - Fronus Solar Energy",
    template: "%s | IPMS - Fronus Solar",
  },
  description: "Comprehensive installer program management system for Fronus Solar Energy. Track rewards, manage installers, integrate with Google Contacts, and monitor certification status.",
  applicationName: "IPMS",
  keywords: [
    "installer management",
    "program management",
    "rewards tracking",
    "solar energy",
    "fronus solar",
    "installer database",
    "certification tracking",
    "google contacts integration",
    "payment management",
    "installer rewards"
  ],
  authors: [{ name: "Fronus Solar Energy", url: siteUrl }],
  creator: "Fronus Solar Energy",
  publisher: "Fronus Solar Energy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IPMS",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Installer Program Management System",
    title: "IPMS - Installer Program Management System",
    description: "Comprehensive installer program management system for Fronus Solar Energy with rewards tracking and Google Contacts integration",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "IPMS Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IPMS - Installer Program Management System",
    description: "Comprehensive installer program management system for Fronus Solar Energy",
    images: ["/web-app-manifest-512x512.png"],
    creator: "@fronussolar",
  },
  robots: {
    index: false, // Set to true for public sites
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <AppLayout>{children}</AppLayout>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.18.12"],
  // Configuration for stable builds on Windows
  generateBuildId: async () => {
    return "build-" + Date.now();
  },

  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression
  reactStrictMode: true, // Enable React strict mode for better debugging

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Optimize large package imports to reduce bundle size
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-icons",
      "recharts",
    ],
  },
};

export default nextConfig;

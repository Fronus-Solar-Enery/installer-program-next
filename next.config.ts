import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration for stable builds on Windows
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;

import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve the "@/..." path aliases from tsconfig so tests import app code the
  // same way the app does (native support in Vite 6 / Vitest 4).
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.{test,spec}.ts"],
    exclude: ["node_modules", ".next"],
  },
});

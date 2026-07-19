import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { demoEventsApiPlugin } from "./vite/demoEventsApiPlugin";

export default defineConfig({
  plugins: [react(), demoEventsApiPlugin()],
  resolve: {
    alias: [{ find: /^quno-calendar$/, replacement: resolve(__dirname, "src/lib/index.ts") }]
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    exclude: ["node_modules/**", "dist/**", "dist-demo/**", "e2e/**", "work/**", "outputs/**"],
    css: true
  }
});

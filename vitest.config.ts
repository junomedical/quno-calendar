import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { projectAliases } from "#quno-project/vite/projectAliases";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: projectAliases(__dirname) },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    exclude: ["node_modules/**", "dist/**", "dist-demo/**", "e2e/**", "work/**", "outputs/**"],
    css: true
  }
});

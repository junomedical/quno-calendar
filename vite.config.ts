import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { demoEventsApiPlugin } from "./vite/demoEventsApiPlugin";

export default defineConfig({
  plugins: [react(), demoEventsApiPlugin()],
  resolve: {
    alias: [
      { find: /^@quno\/calendar\/timeline$/, replacement: resolve(__dirname, "src/lib/timeline/index.ts") },
      { find: /^@quno\/calendar\/date-picker$/, replacement: resolve(__dirname, "src/lib/date-picker/index.ts") },
      { find: /^@quno\/calendar\/date-input$/, replacement: resolve(__dirname, "src/lib/date-input/index.ts") },
      { find: /^@quno\/calendar$/, replacement: resolve(__dirname, "src/lib/index.ts") },
      { find: /^#quno-internal\//, replacement: `${resolve(__dirname, "src/lib")}/` }
    ]
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    exclude: ["node_modules/**", "dist/**", "dist-demo/**", "e2e/**", "work/**", "outputs/**"],
    css: true
  }
});
